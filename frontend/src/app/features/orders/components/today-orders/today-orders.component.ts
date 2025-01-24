import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { OrderService } from '@core/services/order.service';
import { AuthService } from '@core/services/auth.service';
import { Order } from '@core/models/order.model';
import { OrderStatus, OrderStatusTranslation } from '@core/models/order-status-translation.enum';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { WebsocketService } from '@core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-today-orders',
  templateUrl: './today-orders.component.html',
  styleUrls: ['./today-orders.component.scss']
})
export class TodayOrdersComponent implements OnInit, OnDestroy {
  readonly displayedColumns = [
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
  
  OrderStatus = OrderStatus;
  OrderStatusTranslation = OrderStatusTranslation;
  dataSource: MatTableDataSource<Order>;
  private subscriptions: Subscription[] = [];

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private websocketService: WebsocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource<Order>([]);
  }

  ngOnInit(): void {
    this.loadTodayOrders();
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.disconnect();
  }

  logout(): void {
    this.websocketService.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getOrderStatuses(): OrderStatus[] {
    return Object.values(OrderStatus);
  }

  getStatusTranslation(status: OrderStatus): string {
    return OrderStatusTranslation[status];
  }

  private setupWebSocketListeners(): void {
    // Initial orders
    this.subscriptions.push(
      this.websocketService.onInitialOrders().subscribe((orders: Order[]) => {
        this.dataSource.data = orders;
        this.setupFilter();
        this.cdr.detectChanges();
      })
    );

    // New order created
    this.subscriptions.push(
      this.websocketService.onOrderCreated().subscribe((order: Order) => {
        const currentData = [...this.dataSource.data];
        currentData.push(order);
        this.dataSource.data = currentData;
        this.cdr.detectChanges();
      })
    );

    // Order updated
    this.subscriptions.push(
      this.websocketService.onOrderUpdated().subscribe((updatedOrder: Order) => {
        const currentData = [...this.dataSource.data];
        const index = currentData.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          currentData[index] = updatedOrder;
          this.dataSource.data = currentData;
          this.cdr.detectChanges();
        }
      })
    );

    // Order deleted
    this.subscriptions.push(
      this.websocketService.onOrderDeleted().subscribe((orderId: string) => {
        const currentData = [...this.dataSource.data];
        this.dataSource.data = currentData.filter(order => order.id !== orderId);
        this.cdr.detectChanges();
      })
    );
  }

  filterByStatus(status: OrderStatus | ''): void {
    if (!status) {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = status;
    }
    this.cdr.detectChanges();
  }

  private loadTodayOrders(): void {
    this.orderService.getTodayOrders().subscribe({
      next: (orders) => {
        this.dataSource.data = orders;
        this.setupFilter();
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Erro ao carregar pedidos', 'OK', { duration: 3000 });
      }
    });
  }

  private setupFilter(): void {
    this.dataSource.filterPredicate = (data: Order, filter: string) => {
      if (!filter) return true;
      return data.status === filter;
    };
  }

  getTotalPizzas(order: Order): number {
    return order.pizzas.reduce((total, pizza) => total + pizza.quantity, 0);
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

  openOrderDetails(order: Order): void {
    this.dialog.open(OrderDetailsComponent, {
      width: '500px',
      data: order
    });
  }

  deleteOrder(order: Order): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remover Pedido',
        message: `Tem certeza que deseja remover o pedido #${order.id}?`,
        confirmText: 'Remover',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.orderService.deleteOrder(order.id!).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(o => o.id !== order.id);
            this.snackBar.open('Pedido removido com sucesso!', 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erro ao remover pedido', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(order.id!, newStatus).subscribe({
      next: (updatedOrder) => {
        const currentData = [...this.dataSource.data];
        const index = currentData.findIndex(o => o.id === order.id);
        if (index !== -1) {
          currentData[index] = updatedOrder;
          this.dataSource.data = currentData;
        }
        this.snackBar.open('Status atualizado com sucesso!', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => {
        order.status = order.status;
        this.snackBar.open('Erro ao atualizar status', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }
} 