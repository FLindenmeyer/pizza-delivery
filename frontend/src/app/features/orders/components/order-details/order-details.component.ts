import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Order } from '@core/models';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Order) {}

  ngOnInit() {
    console.log('Order details:', this.data); // Debug
    if (this.data?.pizzas) {
      console.log('Pizzas:', this.data.pizzas); // Debug
    }
  }

  canUpdateStatus(): boolean {
    return true;
  }

  updateStatus(): void {
    // Implementar
  }

  goBack(): void {
    // Implementar
  }
} 