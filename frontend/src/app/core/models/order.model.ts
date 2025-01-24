import { Pizza } from './pizza.model';
import { OrderStatus } from './order-status-translation.enum';

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