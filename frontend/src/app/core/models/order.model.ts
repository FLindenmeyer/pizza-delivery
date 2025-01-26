import { Pizza } from './pizza.model';
import { OrderStatus } from './order-status-translation.enum';

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