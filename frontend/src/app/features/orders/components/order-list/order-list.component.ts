import { Component, OnInit, inject } from '@angular/core';
import { OrderService } from '@core/services';
import { Order } from '@core/models';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { OrderStatus } from '@core/models/order-status-translation.enum';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly dialog = inject(MatDialog);
  
  orders: Order[] = [];
  OrderStatusTranslation = OrderStatus;
  displayedColumns = [
    'id',
    'customer',
    'house',
    'time',
    'phone',
    'status',
    'quantity',
    'total',
    'actions'
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
      }
    });
  }

  getTotalPizzas(order: Order): number {
    return order.pizzas.reduce((total, pizza) => total + pizza.quantity, 0);
  }

  openOrderDetails(order: Order) {
    console.log('Opening details for order:', order);
    this.dialog.open(OrderDetailsComponent, {
      width: '800px',
      data: { ...order }
    });
  }

  getFormattedTotal(total: string | number): string {
    const numericTotal = typeof total === 'string' ? parseFloat(total) : total;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericTotal);
  }
} 