import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { TodayOrdersComponent } from '../features/orders/components/today-orders/today-orders.component';
import { OrderListComponent } from '../features/orders/components/order-list/order-list.component';
import { OrderDetailsComponent } from '../features/orders/components/order-details/order-details.component';
import { PizzaSelectionModalComponent } from '../features/orders/components/pizza-selection-modal/pizza-selection-modal.component';
import { NewOrderComponent } from '../features/orders/components/new-order/new-order.component';

@NgModule({
  declarations: [
    TodayOrdersComponent,
    OrderListComponent,
    OrderDetailsComponent,
    PizzaSelectionModalComponent,
    NewOrderComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: '', component: TodayOrdersComponent },
      { path: 'new', component: NewOrderComponent },
      { path: 'history', component: OrderListComponent }
    ])
  ]
})
export class OrdersModule {} 