export interface Pizza {
  id?: string;  // id é opcional
  flavors: PizzaFlavor[];  // 1 ou 2 sabores
  size: number;       // fixo em 35
  slices: number;     // fixo em 8
  quantity: number;   // quantidade de pizzas
}

export interface PizzaFlavor {
  id: number;
  name: string;
  description: string;
  additionalPrice: number;
  portion: 'whole' | 'half';
}

export interface PizzaSelection {
  flavors: PizzaFlavor[];
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id?: string;
  customerName: string;
  houseNumber: string;
  phone?: string;
  pizzas: Pizza[];  // Agora é um array de pizzas
  status: OrderStatus;
  orderDate: Date;
  deliveryTime: string;
  isScheduled: boolean;
  totalPrice: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export const PIZZA_BASE_PRICE = 62.99; 