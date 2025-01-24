export interface Pizza {
  id?: string;
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

export const PIZZA_BASE_PRICE = 62.99; 