import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { MaterialModule } from '../../shared/material.module';
import { OrdersRoutingModule } from './orders-routing.module';

import { OrdersComponent } from './orders.component';
import { TodayOrdersComponent } from './components/today-orders/today-orders.component';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { OrderAssemblyComponent } from './components/order-assembly/order-assembly.component';
import { OrderFinishingComponent } from './components/order-finishing/order-finishing.component';
import { NewOrderComponent } from './components/new-order/new-order.component';
import { PizzaSelectionModalComponent } from './components/pizza-selection-modal/pizza-selection-modal.component';

@NgModule({
  declarations: [
    OrdersComponent,
    TodayOrdersComponent,
    OrderDetailsComponent,
    OrderAssemblyComponent,
    OrderFinishingComponent,
    NewOrderComponent,
    PizzaSelectionModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    MaterialModule,
    OrdersRoutingModule
  ]
})
export class OrdersModule { } 