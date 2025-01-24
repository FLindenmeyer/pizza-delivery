import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService, Order, Pizza } from '@core/index';
import { OrderStatus } from '@core/models/order-status-translation.enum';
import { PizzaSelectionModalComponent } from '../pizza-selection-modal/pizza-selection-modal.component';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss']
})
export class NewOrderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly orderForm: FormGroup = this.fb.group({
    customerName: ['', Validators.required],
    houseNumber: ['', Validators.required],
    phone: [''],
    isScheduled: [false],
    deliveryTime: ['']
  });

  selectedPizzas: Pizza[] = [];

  constructor() {
    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    this.orderForm.get('isScheduled')?.valueChanges.subscribe(isScheduled => {
      const timeControl = this.orderForm.get('deliveryTime');
      if (isScheduled) {
        timeControl?.setValidators(Validators.required);
      } else {
        timeControl?.clearValidators();
        timeControl?.setValue('');
      }
      timeControl?.updateValueAndValidity();
    });
  }

  openPizzaSelection(): void {
    const dialogRef = this.dialog.open(PizzaSelectionModalComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedPizzas.push(result);
      }
    });
  }

  removePizza(index: number): void {
    this.selectedPizzas.splice(index, 1);
  }

  formatPizzaFlavors(pizza: Pizza): string {
    return pizza.flavors
      .map(f => `${f.portion === 'whole' ? 'Inteira' : '1/2'} ${f.name}`)
      .join(' + ');
  }

  calculateTotal(): number {
    return this.selectedPizzas.reduce((total, pizza) => {
      return total + (70 * pizza.quantity);
    }, 0);
  }

  isOrderValid(): boolean {
    return this.orderForm.valid && this.selectedPizzas.length > 0;
  }

  finishOrder(): void {
    if (this.isOrderValid()) {
      const order: Omit<Order, 'id'> = {
        ...this.orderForm.value,
        pizzas: this.selectedPizzas,
        status: OrderStatus.PENDING,
        orderDate: new Date(),
        totalPrice: this.calculateTotal()
      };

      this.orderService.createOrder(order).subscribe({
        next: () => {
          this.snackBar.open('Pedido criado com sucesso!', 'OK', { duration: 3000 });
          this.router.navigate(['/orders']);
        },
        error: () => {
          this.snackBar.open('Erro ao criar pedido', 'OK', { duration: 3000 });
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/orders']);
  }
} 