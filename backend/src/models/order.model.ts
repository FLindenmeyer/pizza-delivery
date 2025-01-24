import { pool } from '../config/database';

export interface Order {
  id?: string;
  customerName: string;
  houseNumber: string;
  phone?: string;
  pizzas: Pizza[];
  status: OrderStatus;
  orderDate: Date;
  deliveryTime: string;
  isScheduled: boolean;
  totalPrice: number;
}

export interface Pizza {
  flavors: PizzaFlavor[];
  size: number;
  slices: number;
  quantity: number;
}

export interface PizzaFlavor {
  id: number;
  name: string;
  description: string;
  additionalPrice: number;
  portion: 'whole' | 'half';
}

export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PREPARATION = 'IN_PREPARATION',
  ASSEMBLY = 'ASSEMBLY',
  ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED',
  BAKING = 'BAKING',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export class OrderModel {
  static async create(order: Omit<Order, 'id'>): Promise<Order> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Dados recebidos:', order);
      
      // Validação dos dados básicos
      if (!order.customerName) throw new Error('Nome do cliente é obrigatório');
      if (!order.houseNumber) throw new Error('Número da casa é obrigatório');
      if (!order.pizzas?.length) throw new Error('Pedido deve ter pelo menos uma pizza');
      
      // Define horário padrão se não especificado
      let deliveryTime = order.deliveryTime;
      if (!deliveryTime || deliveryTime === '') {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 45);
        deliveryTime = now.toTimeString().slice(0, 5);
      }

      // Calcula o total baseado no preço fixo de R$ 70,00 por pizza mais adicionais
      const totalPrice = order.pizzas.reduce((total, pizza) => {
        const additionalPrice = pizza.flavors.reduce((acc, flavor) => acc + (flavor.additionalPrice || 0), 0);
        return total + ((70 + additionalPrice) * pizza.quantity);
      }, 0);
      
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_name, house_number, phone, status,
          order_date, delivery_time, is_scheduled, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          order.customerName,
          order.houseNumber,
          order.phone || '',
          OrderStatus.PENDING,
          new Date(),
          deliveryTime,
          order.isScheduled || false,
          totalPrice
        ]
      );

      const newOrder = orderResult.rows[0];
      console.log('Pedido criado:', newOrder);

      // Inserir pizzas
      for (const pizza of order.pizzas) {
        console.log('Inserindo pizza:', pizza);
        await client.query(
          `INSERT INTO order_pizzas (
            order_id, flavors, size, slices, quantity
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            newOrder.id,
            JSON.stringify(pizza.flavors),
            pizza.size,
            pizza.slices,
            pizza.quantity
          ]
        );
      }

      await client.query('COMMIT');

      // Buscar o pedido completo do banco
      const result = await client.query(
        `SELECT 
          o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'flavors', op.flavors::json,
                'size', op.size,
                'slices', op.slices,
                'quantity', op.quantity
              )
            ) FILTER (WHERE op.id IS NOT NULL),
            '[]'::json
          ) as pizzas
        FROM orders o
        LEFT JOIN order_pizzas op ON o.id = op.order_id
        WHERE o.id = $1
        GROUP BY o.id`,
        [newOrder.id]
      );

      if (!result.rows[0]) {
        throw new Error('Pedido não encontrado após criação');
      }

      const mappedOrder = this.mapOrderFromDb(result.rows[0]);
      console.log('Pedido mapeado:', mappedOrder);
      return mappedOrder;

    } catch (error: any) {
      console.error('Erro detalhado:', {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack,
        order: order
      });
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll(): Promise<Order[]> {
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'flavors', op.flavors,
            'size', op.size,
            'slices', op.slices,
            'quantity', op.quantity
          )
        ) FILTER (WHERE op.id IS NOT NULL), '[]') as pizzas
      FROM orders o
      LEFT JOIN order_pizzas op ON o.id = op.order_id
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `);
    
    return rows.map(row => this.mapOrderFromDb(row));
  }

  static async findToday(): Promise<Order[]> {
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'flavors', op.flavors,
            'size', op.size,
            'slices', op.slices,
            'quantity', op.quantity
          )
        ) FILTER (WHERE op.id IS NOT NULL), '[]') as pizzas
      FROM orders o
      LEFT JOIN order_pizzas op ON o.id = op.order_id
      WHERE DATE(o.order_date) = CURRENT_DATE
      GROUP BY o.id
      ORDER BY o.delivery_time ASC
    `);
    
    return rows.map(row => this.mapOrderFromDb(row));
  }

  static async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (rows.length === 0) {
      throw new Error('Pedido não encontrado');
    }

    const order = rows[0];
    const pizzasResult = await pool.query(
      'SELECT * FROM order_pizzas WHERE order_id = $1',
      [id]
    );

    return this.mapOrderFromDb({
      ...order,
      pizzas: pizzasResult.rows
    });
  }

  static async delete(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Primeiro verificamos se o pedido existe
      const orderExists = await client.query(
        'SELECT id FROM orders WHERE id = $1',
        [parseInt(id)]
      );

      if (orderExists.rows.length === 0) {
        throw new Error('Pedido não encontrado');
      }

      // Deletamos as pizzas do pedido
      await client.query(
        'DELETE FROM order_pizzas WHERE order_id = $1',
        [parseInt(id)]
      );

      // Deletamos o pedido
      await client.query(
        'DELETE FROM orders WHERE id = $1',
        [parseInt(id)]
      );

      await client.query('COMMIT');
    } catch (error: any) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private static mapOrderFromDb(row: any): Order {
    if (!row) {
      throw new Error('Dados do pedido não encontrados');
    }

    try {
      console.log('Dados do banco para mapear:', row);
      
      let pizzas: Pizza[] = [];
      
      if (row.pizzas && row.pizzas !== '[]') {
        // Garantir que temos um array de pizzas
        const pizzasArray = Array.isArray(row.pizzas) ? row.pizzas : JSON.parse(row.pizzas);
        
        pizzas = pizzasArray.map((p: any) => {
          // Garantir que temos um array de sabores
          const flavors = typeof p.flavors === 'string' ? JSON.parse(p.flavors) : p.flavors;
          
          return {
            flavors: flavors,
            size: p.size,
            slices: p.slices,
            quantity: p.quantity
          };
        });
      }

      const mappedOrder: Order = {
        id: row.id,
        customerName: row.customer_name,
        houseNumber: row.house_number,
        phone: row.phone || '',
        status: row.status,
        orderDate: row.order_date,
        deliveryTime: row.delivery_time,
        isScheduled: row.is_scheduled,
        totalPrice: parseFloat(row.total_price),
        pizzas: pizzas
      };

      console.log('Pedido mapeado:', mappedOrder);
      return mappedOrder;
    } catch (error) {
      console.error('Erro ao mapear pedido do banco:', error);
      console.error('Dados recebidos:', row);
      throw new Error('Erro ao processar dados do pedido');
    }
  }
} 