import { pool } from '../config/database';

export interface Order {
  id?: string;
  customerName: string;
  houseNumber: string;
  phone?: string;
  pizzas: Pizza[];
  status: OrderStatus;
  preparationTime?: string;
  isScheduled: boolean;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pizza {
  flavors: PizzaFlavor[];
  size: number;
  slices: number;
  quantity: number;
  observation?: string;
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
  static async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Dados recebidos:', order);
      
      // Validação dos dados básicos
      if (!order.customerName) throw new Error('Nome do cliente é obrigatório');
      if (!order.houseNumber) throw new Error('Número da casa é obrigatório');
      if (!order.pizzas?.length) throw new Error('Pedido deve ter pelo menos uma pizza');
      
      // Calcula o total baseado no preço fixo de R$ 70,00 por pizza mais adicionais
      const totalPrice = order.pizzas.reduce((total, pizza) => {
        const additionalPrice = pizza.flavors.reduce((acc, flavor) => acc + (flavor.additionalPrice || 0), 0);
        return total + ((70 + additionalPrice) * pizza.quantity);
      }, 0);
      
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_name, house_number, phone, status,
          preparation_time, is_scheduled, total_price, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 
          CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo',
          CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
        ) RETURNING *`,
        [
          order.customerName,
          order.houseNumber,
          order.phone || '',
          OrderStatus.PENDING,
          order.preparationTime || null,
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
            order_id, flavors, size, slices, quantity, observation
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newOrder.id,
            JSON.stringify(pizza.flavors),
            pizza.size,
            pizza.slices,
            pizza.quantity,
            pizza.observation || null
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
                'quantity', op.quantity,
                'observation', op.observation
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
            'flavors', op.flavors::json,
            'size', op.size,
            'slices', op.slices,
            'quantity', op.quantity,
            'observation', op.observation
          )
        ) FILTER (WHERE op.id IS NOT NULL), '[]'::json) as pizzas
      FROM orders o
      LEFT JOIN order_pizzas op ON o.id = op.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    return rows.map(row => this.mapOrderFromDb(row));
  }

  static async findByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    console.log('Buscando pedidos por intervalo de data:', { startDate, endDate });
    
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'flavors', op.flavors::json,
            'size', op.size,
            'slices', op.slices,
            'quantity', op.quantity,
            'observation', op.observation
          )
        ) FILTER (WHERE op.id IS NOT NULL), '[]'::json) as pizzas
      FROM orders o
      LEFT JOIN order_pizzas op ON o.id = op.order_id
      WHERE o.created_at >= $1::timestamp AND o.created_at <= $2::timestamp
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [startDate, endDate]);
    
    console.log('Pedidos encontrados:', rows.length);
    return rows.map(row => this.mapOrderFromDb(row));
  }

  static async findToday(): Promise<Order[]> {
    console.log('Buscando pedidos do dia...');
    
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'flavors', op.flavors::json,
            'size', op.size,
            'slices', op.slices,
            'quantity', op.quantity,
            'observation', op.observation
          )
        ) FILTER (WHERE op.id IS NOT NULL), '[]'::json) as pizzas
      FROM orders o
      LEFT JOIN order_pizzas op ON o.id = op.order_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `);
    
    console.log('Pedidos encontrados:', rows.length);
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
        const pizzasArray = Array.isArray(row.pizzas) ? row.pizzas : JSON.parse(row.pizzas);
        
        pizzas = pizzasArray.map((p: any) => {
          const flavors = typeof p.flavors === 'string' ? JSON.parse(p.flavors) : p.flavors;
          
          return {
            flavors: flavors,
            size: p.size,
            slices: p.slices,
            quantity: p.quantity,
            observation: p.observation || undefined
          };
        });
      }

      const mappedOrder: Order = {
        id: row.id,
        customerName: row.customer_name,
        houseNumber: row.house_number,
        phone: row.phone || '',
        status: row.status,
        preparationTime: row.preparation_time || null,
        isScheduled: row.is_scheduled,
        totalPrice: parseFloat(row.total_price),
        pizzas: pizzas,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
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