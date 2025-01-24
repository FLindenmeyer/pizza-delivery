import { Component, inject } from '@angular/core';
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

  readonly PIZZA_BASE_PRICE = PIZZA_BASE_PRICE;
  readonly availableFlavors: PizzaFlavor[] = [
    {
      id: 1,
      name: 'Mozarela',
      description: 'Queijo mozarela, molho de tomate e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 2,
      name: 'Calabresa',
      description: 'Calabresa fatiada, cebola e orégano',
      additionalPrice: 0,
      portion: 'whole'
    },
    {
      id: 3,
      name: 'Portuguesa',
      description: 'Presunto, ovos, cebola, ervilha, queijo e orégano',
      additionalPrice: 3,
      portion: 'whole'
    }
  ];

  flavorCounts = new Map<number, number>();
  quantity = 1;

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

  increaseFlavorCount(flavorId: number): void {
    if (this.canAddMoreFlavor(flavorId)) {
      this.flavorCounts.set(flavorId, (this.flavorCounts.get(flavorId) ?? 0) + 1);
    }
  }

  decreaseFlavorCount(flavorId: number): void {
    const currentCount = this.flavorCounts.get(flavorId) ?? 0;
    if (currentCount > 0) {
      this.flavorCounts.set(flavorId, currentCount - 1);
    }
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
        quantity: this.quantity
      };
      this.dialogRef.close(pizza);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
} 