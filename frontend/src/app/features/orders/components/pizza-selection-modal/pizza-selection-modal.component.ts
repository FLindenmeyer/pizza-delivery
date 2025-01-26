import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Pizza, PizzaFlavor, PIZZA_BASE_PRICE } from '@core/models';

@Component({
  selector: 'app-pizza-selection-modal',
  templateUrl: './pizza-selection-modal.component.html',
  styleUrls: ['./pizza-selection-modal.component.scss']
})
export class PizzaSelectionModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PizzaSelectionModalComponent>);

  @Output() pizzaAdded = new EventEmitter<Pizza>();

  readonly PIZZA_BASE_PRICE = PIZZA_BASE_PRICE;
  readonly availableFlavors: PizzaFlavor[] = [
    {
      id: 1,
      name: 'Portuguesa',
      description: 'Molho, mussarela, presunto, ovo, cebola, pimentão verde e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 2,
      name: 'Calabresa',
      description: 'Molho, mussarela, calabresa, cebola, cream cheese philadelphia e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 3,
      name: 'Frango tradicional',
      description: 'Molho, mussarela, frango com tempero da casa, milho, cream cheese philadelphia e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 4,
      name: 'Frango defumado',
      description: 'Molho, mussarela, frango defumado DORGAN, tomate cereja, cream cheese philadelphia e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 5,
      name: 'Marguerita',
      description: 'Molho, mussarela, tomate, manjericão, raspas de queijo parmesão faixa azul e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 6,
      name: 'Carne de Sol/Sertaneja',
      description: 'Molho, mussarela, carne de sol, cebola roxa, cream cheese philadelphia, queijo coalho em cubos e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 7,
      name: 'Bacon e Milho',
      description: 'Molho, mussarela, bacon DORGAN, milho verde, cream cheese philadelphia e orégano',
      additionalPrice: 0,
      portion: 'whole'
    }
  ];

  flavorCounts = new Map<number, number>();
  quantity = 1;
  addedPizzas: Pizza[] = [];
  observation = '';

  constructor() {
    this.availableFlavors.forEach(flavor => {
      this.flavorCounts.set(flavor.id, 0);
    });
  }

  getFlavorCount(flavorId: number): number {
    return this.flavorCounts.get(flavorId) ?? 0;
  }

  getTotalFlavorCount(): number {
    return Array.from(this.flavorCounts.values())
      .reduce((sum, count) => sum + count, 0);
  }

  canAddMoreFlavor(flavorId: number): boolean {
    const currentCount = this.getFlavorCount(flavorId);
    const totalCount = this.getTotalFlavorCount();
    return totalCount < 2 || (currentCount === 1 && totalCount === 2);
  }

  toggleFlavor(flavorId: number): void {
    const currentCount = this.getFlavorCount(flavorId);
    if (currentCount === 0 && this.canAddMoreFlavor(flavorId)) {
      // Se não tem nenhuma porção, adiciona meia
      this.flavorCounts.set(flavorId, 1);
    } else if (currentCount === 1 && this.getTotalFlavorCount() === 1) {
      // Se já tem meia e é o único sabor, completa a pizza
      this.flavorCounts.set(flavorId, 2);
    } else if (currentCount > 0) {
      // Se já tem alguma porção, remove
      this.flavorCounts.set(flavorId, 0);
    }
  }

  clearFlavor(flavorId: number): void {
    this.flavorCounts.set(flavorId, 0);
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  calculateTotal(): number {
    const selectedFlavors = this.getSelectedFlavors();
    const additionalPrice = selectedFlavors.reduce(
      (sum, flavor) => sum + (flavor.additionalPrice * this.getFlavorCount(flavor.id)), 0
    );
    return (PIZZA_BASE_PRICE + additionalPrice) * this.quantity;
  }

  getSelectedFlavors(): PizzaFlavor[] {
    return this.availableFlavors.filter(flavor => this.getFlavorCount(flavor.id) > 0);
  }

  isSelectionValid(): boolean {
    return this.getTotalFlavorCount() === 2 && this.quantity > 0;
  }

  confirm(): void {
    if (this.isSelectionValid()) {
      const selectedFlavors = this.getSelectedFlavors();
      const pizza: Pizza = {
        flavors: selectedFlavors.map(flavor => ({
          ...flavor,
          portion: this.getFlavorCount(flavor.id) === 2 ? 'whole' : 'half'
        })),
        size: 35,
        slices: 8,
        quantity: this.quantity,
        observation: this.observation.trim() || undefined
      };
      
      // Adicionar a pizza à lista local
      this.addedPizzas.push(pizza);
      
      // Emitir o evento sem fechar o modal
      this.pizzaAdded.emit(pizza);
      
      // Resetar a seleção para uma nova pizza
      this.flavorCounts.forEach((_, key) => this.flavorCounts.set(key, 0));
      this.quantity = 1;
      this.observation = '';
    }
  }

  finishSelection(): void {
    this.dialogRef.close(this.addedPizzas);
  }

  close(): void {
    this.dialogRef.close();
  }

  removePizza(index: number): void {
    this.addedPizzas.splice(index, 1);
  }

  getFlavorText(pizza: Pizza): string {
    return pizza.flavors
      .map(flavor => flavor.portion === 'whole' ? `Inteira ${flavor.name}` : `Meia ${flavor.name}`)
      .join(' + ');
  }
} 