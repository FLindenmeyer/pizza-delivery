import { Routes } from '@angular/router';
import { TodayOrdersComponent } from './components/today-orders/today-orders.component';
import { NewOrderComponent } from './components/new-order/new-order.component';
import { OrderListComponent } from './components/order-list/order-list.component';

export const ordersRoutes: Routes = [
  { path: '', component: TodayOrdersComponent },
  { path: 'new', component: NewOrderComponent },
  { path: 'history', component: OrderListComponent }
]; 