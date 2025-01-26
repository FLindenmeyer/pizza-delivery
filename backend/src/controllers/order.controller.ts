import { Request, Response } from 'express';
import { OrderModel } from '../models/order.model';

class OrderController {
  async getOrders(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (startDate && endDate) {
        const orders = await OrderModel.findByDateRange(startDate as string, endDate as string);
        return res.json(orders);
      }

      const orders = await OrderModel.findAll();
      return res.json(orders);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }
}

export default new OrderController(); 