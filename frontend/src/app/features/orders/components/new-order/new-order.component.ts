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
    preparationTime: ['']
  });

  selectedPizzas: Pizza[] = [];
  minDeliveryTime: string = '';

  constructor() {
    this.setupFormValidation();
    this.updateMinDeliveryTime();
  }

  private updateMinDeliveryTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.minDeliveryTime = `${hours}:${minutes}`;
  }

  private setupFormValidation(): void {
    this.orderForm.get('isScheduled')?.valueChanges.subscribe(isScheduled => {
      const prepTimeControl = this.orderForm.get('preparationTime');
      
      if (isScheduled) {
        prepTimeControl?.setValidators([
          Validators.required,
          (control) => {
            if (!control.value) return null;
            const [hours, minutes] = control.value.split(':').map(Number);
            const selectedTime = new Date();
            selectedTime.setHours(hours, minutes, 0);
            
            const now = new Date();
            return selectedTime > now ? null : { min: true };
          }
        ]);
      } else {
        prepTimeControl?.clearValidators();
        prepTimeControl?.setValue('');
      }
      
      prepTimeControl?.updateValueAndValidity();
    });
  }

  openPizzaSelection(): void {
    const dialogRef = this.dialog.open(PizzaSelectionModalComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && Array.isArray(result)) {
        this.selectedPizzas = [...this.selectedPizzas, ...result];
      }
    });
  }

  removePizza(index: number): void {
    this.selectedPizzas.splice(index, 1);
  }

  formatPizzaFlavors(pizza: Pizza): string {
    return pizza.flavors
      .map(f => `${f.portion === 'whole' ? 'Inteira' : 'Meia'} ${f.name}`)
      .join(' + ');
  }

  calculateTotal(): number {
    return this.selectedPizzas.reduce((total, pizza) => {
      const pizzaPrice = pizza.flavors.reduce((flavorTotal, flavor) => 
        flavorTotal + (flavor.additionalPrice * (flavor.portion === 'whole' ? 2 : 1)), 70);
      return total + (pizzaPrice * pizza.quantity);
    }, 0);
  }

  isOrderValid(): boolean {
    return this.orderForm.valid && this.selectedPizzas.length > 0;
  }

  finishOrder(): void {
    if (this.isOrderValid()) {
      const formValues = this.orderForm.value;
      const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        customerName: formValues.customerName,
        houseNumber: formValues.houseNumber,
        phone: formValues.phone || '',
        pizzas: this.selectedPizzas,
        status: OrderStatus.PENDING,
        isScheduled: formValues.isScheduled,
        preparationTime: formValues.isScheduled ? formValues.preparationTime : '',
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