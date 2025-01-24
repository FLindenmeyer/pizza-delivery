import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order, OrderStatus } from '../../models/pizza.model';
import { MatDialog } from '@angular/material/dialog';
import { PizzaSelectionModalComponent } from '../pizza-selection-modal/pizza-selection-modal.component';

@Component({
  selector: 'app-create-order',
  template: `
    <div class="create-order-container">
      <h2>Novo Pedido</h2>
      
      <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h3>Dados do Cliente</h3>
          <mat-form-field>
            <input matInput placeholder="Nome do Cliente" formControlName="customerName">
            <mat-error *ngIf="orderForm.get('customerName')?.hasError('required')">
              Nome é obrigatório
            </mat-error>
          </mat-form-field>

          <mat-form-field>
            <input matInput placeholder="Número da Casa" formControlName="houseNumber">
            <mat-error *ngIf="orderForm.get('houseNumber')?.hasError('required')">
              Número da casa é obrigatório
            </mat-error>
          </mat-form-field>

          <mat-form-field>
            <input matInput placeholder="Telefone (opcional)" formControlName="phone">
          </mat-form-field>
        </div>

        <div class="form-section">
          <h3>Detalhes do Pedido</h3>
          
          <mat-form-field>
            <input matInput type="number" min="1" placeholder="Quantidade de Pizzas" 
                   formControlName="quantity">
          </mat-form-field>

          <div formGroupName="pizzaConfig">
            <mat-radio-group formControlName="type" (change)="onPizzaTypeChange($event)">
              <mat-radio-button value="whole">Pizza Inteira (1 sabor)</mat-radio-button>
              <mat-radio-button value="half">Meio a Meio (2 sabores)</mat-radio-button>
            </mat-radio-group>

            <ng-container *ngIf="orderForm.get('pizzaConfig.type')?.value === 'whole'">
              <mat-form-field>
                <mat-select placeholder="Selecione o Sabor" formControlName="flavor1">
                  <mat-option *ngFor="let flavor of availableFlavors" [value]="flavor">
                    {{flavor}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </ng-container>

            <ng-container *ngIf="orderForm.get('pizzaConfig.type')?.value === 'half'">
              <mat-form-field>
                <mat-select placeholder="Primeiro Sabor" formControlName="flavor1">
                  <mat-option *ngFor="let flavor of availableFlavors" [value]="flavor">
                    {{flavor}}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field>
                <mat-select placeholder="Segundo Sabor" formControlName="flavor2">
                  <mat-option *ngFor="let flavor of availableFlavors" [value]="flavor">
                    {{flavor}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </ng-container>
          </div>
        </div>

        <div class="form-section">
          <h3>Agendamento</h3>
          <mat-checkbox formControlName="isScheduled">Agendar horário de entrega?</mat-checkbox>

          <mat-form-field *ngIf="orderForm.get('isScheduled')?.value">
            <input matInput type="time" placeholder="Horário de Entrega" 
                   formControlName="deliveryTime">
            <mat-hint>Formato: HH:mm (24h)</mat-hint>
          </mat-form-field>
        </div>

        <div class="actions">
          <button mat-button type="button" (click)="goBack()">Cancelar</button>
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="orderForm.invalid">
            Criar Pedido
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-order-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .form-section {
      margin-bottom: 2rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
  `]
})
export class CreateOrderComponent implements OnInit {
  orderForm: FormGroup;
  availableFlavors = [
    'Margherita', 'Pepperoni', 'Portuguesa', 
    'Calabresa', 'Frango com Catupiry', 'Quatro Queijos'
  ];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      houseNumber: ['', Validators.required],
      phone: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      pizzaConfig: this.fb.group({
        type: ['whole', Validators.required],
        flavor1: ['', Validators.required],
        flavor2: ['']
      }),
      isScheduled: [false],
      deliveryTime: ['']
    });

    // Adicionar validação para o segundo sabor quando for meio a meio
    this.orderForm.get('pizzaConfig.type')?.valueChanges.subscribe(type => {
      const flavor2Control = this.orderForm.get('pizzaConfig.flavor2');
      if (type === 'half') {
        flavor2Control?.setValidators(Validators.required);
      } else {
        flavor2Control?.clearValidators();
        flavor2Control?.setValue('');
      }
      flavor2Control?.updateValueAndValidity();
    });

    // Validação para horário de entrega quando agendado
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

  ngOnInit() {
    // Recuperar a seleção de pizza do state da rota
    const navigation = this.router.getCurrentNavigation();
    const pizzaSelection = navigation?.extras?.state?.['pizzaSelection'];

    if (pizzaSelection) {
      // Preencher o formulário com os dados da pizza selecionada
      this.orderForm.patchValue({
        pizzaConfig: {
          type: pizzaSelection.flavors.length === 1 ? 'whole' : 'half',
          flavor1: pizzaSelection.flavors[0]?.name,
          flavor2: pizzaSelection.flavors[1]?.name
        },
        quantity: pizzaSelection.quantity
      });
    } else {
      // Se não houver seleção de pizza, abrir o modal
      this.openPizzaSelection();
    }
  }

  onPizzaTypeChange(event: any) {
    // Este método pode ficar vazio, pois a lógica já está nos observables
  }

  onSubmit() {
    if (this.orderForm.valid) {
      const formValue = this.orderForm.value;
      const pizzaFlavors = [];

      if (formValue.pizzaConfig.type === 'whole') {
        pizzaFlavors.push({
          name: formValue.pizzaConfig.flavor1,
          portion: 'whole'
        });
      } else {
        pizzaFlavors.push(
          {
            name: formValue.pizzaConfig.flavor1,
            portion: 'half'
          },
          {
            name: formValue.pizzaConfig.flavor2,
            portion: 'half'
          }
        );
      }

      const order: Omit<Order, 'id'> = {
        customerName: formValue.customerName,
        houseNumber: formValue.houseNumber,
        phone: formValue.phone,
        pizza: {
          flavors: pizzaFlavors,
          size: 35,
          slices: 8,
          quantity: formValue.quantity
        },
        status: OrderStatus.PENDING,
        orderDate: new Date(),
        isScheduled: formValue.isScheduled,
        deliveryTime: formValue.deliveryTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      this.orderService.createOrder(order).subscribe(
        response => {
          this.snackBar.open('Pedido criado com sucesso!', 'OK', { duration: 3000 });
          this.router.navigate(['/orders']);
        },
        error => {
          this.snackBar.open('Erro ao criar pedido', 'OK', { duration: 3000 });
        }
      );
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  openPizzaSelection() {
    const dialogRef = this.dialog.open(PizzaSelectionModalComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Atualizar o formulário com a seleção de pizza
        this.orderForm.patchValue({
          pizzaConfig: {
            type: result.flavors.length === 1 ? 'whole' : 'half',
            flavor1: result.flavors[0]?.name,
            flavor2: result.flavors[1]?.name
          },
          quantity: result.quantity
        });
      }
    });
  }
} 