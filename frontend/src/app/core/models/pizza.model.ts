export interface Pizza {
  id?: string;
  flavors: PizzaFlavor[];
  size: number;
  slices: number;
  quantity: number;
  observation?: string;  // Optional field for customer notes/customizations
}

export interface PizzaFlavor {
  id: number;
  name: string;
  description: string;
  additionalPrice: number;
  portion: 'whole' | 'half';
}

export const PIZZA_BASE_PRICE = 70.00; 