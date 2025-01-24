import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdersComponent } from './orders.component';
import { TodayOrdersComponent } from './components/today-orders/today-orders.component';
import { OrderAssemblyComponent } from './components/order-assembly/order-assembly.component';
import { OrderFinishingComponent } from './components/order-finishing/order-finishing.component';
import { NewOrderComponent } from './components/new-order/new-order.component';

const routes: Routes = [
  {
    path: '',
    component: OrdersComponent,
    children: [
      { path: '', component: TodayOrdersComponent },
      { path: 'new', component: NewOrderComponent },
      { path: 'assembly', component: OrderAssemblyComponent },
      { path: 'finishing', component: OrderFinishingComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { } 