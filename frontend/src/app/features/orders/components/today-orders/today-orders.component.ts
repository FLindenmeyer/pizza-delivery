import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
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
  historyDataSource: MatTableDataSource<Order>;
  dateRange: FormGroup;
  private subscriptions: Subscription[] = [];
  private orders: Order[] = [];

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private websocketService: WebsocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.dataSource = new MatTableDataSource<Order>([]);
    this.historyDataSource = new MatTableDataSource<Order>([]);
    this.dateRange = this.fb.group({
      start: [null],
      end: [null]
    });
  }

  ngOnInit(): void {
    this.loadTodayOrders();
    this.setupWebSocketListeners();
    this.setupDateRangeListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.disconnect();
  }

  private setupDateRangeListener(): void {
    this.subscriptions.push(
      this.dateRange.valueChanges.subscribe(range => {
        if (range.start && range.end) {
          this.loadHistoricalOrders(range.start, range.end);
        }
      })
    );
  }

  private loadHistoricalOrders(startDate: Date, endDate: Date): void {
    this.orderService.getOrders(startDate, endDate).subscribe({
      next: (orders) => {
        this.historyDataSource.data = orders;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Erro ao carregar histórico de pedidos', 'OK', { duration: 3000 });
      }
    });
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

  getColumnLabel(column: string): string {
    const labels: { [key: string]: string } = {
      id: 'Pedido',
      customer: 'Cliente',
      house: 'Casa',
      time: 'Horário',
      phone: 'Telefone',
      status: 'Status',
      quantity: 'Qtd.',
      total: 'Total',
      actions: 'Ações'
    };
    return labels[column] || column;
  }

  isPriorityOrder(order: Order): boolean {
    // Pedido é prioritário se for o mais antigo em preparação
    if (order.status === OrderStatus.PENDING || order.status === OrderStatus.ASSEMBLY) {
      const pendingOrders = this.orders.filter(o => 
        o.status === OrderStatus.PENDING || o.status === OrderStatus.ASSEMBLY
      );
      if (pendingOrders.length > 0) {
        const oldestOrder = pendingOrders.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        return order.id === oldestOrder.id;
      }
    }
    return false;
  }

  private setupWebSocketListeners(): void {
    // Initial orders
    this.subscriptions.push(
      this.websocketService.onInitialOrders().subscribe((orders: Order[]) => {
        this.orders = orders;
        this.updateOrderList();
        this.cdr.detectChanges();
      })
    );

    // New order created
    this.subscriptions.push(
      this.websocketService.onOrderCreated().subscribe((order: Order) => {
        // Add the new order and sort by creation date
        this.orders = [...this.orders, order].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.updateOrderList();
        this.cdr.detectChanges();
      })
    );

    // Order updated
    this.subscriptions.push(
      this.websocketService.onOrderUpdated().subscribe((updatedOrder: Order) => {
        const currentData = [...this.orders];
        const index = currentData.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          currentData[index] = updatedOrder;
          this.orders = currentData;
          this.updateOrderList();
        }
        this.cdr.detectChanges();
      })
    );

    // Order deleted
    this.subscriptions.push(
      this.websocketService.onOrderDeleted().subscribe((orderId: string) => {
        const currentData = [...this.orders];
        this.orders = currentData.filter(order => order.id !== orderId);
        this.updateOrderList();
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
        this.orders = orders;
        this.updateOrderList();
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
            this.orders = this.orders.filter(o => o.id !== order.id);
            this.updateOrderList();
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
        const currentData = [...this.orders];
        const index = currentData.findIndex(o => o.id === order.id);
        if (index !== -1) {
          currentData[index] = updatedOrder;
          this.orders = currentData;
          this.updateOrderList();
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

  formatTime(time: string): string {
    if (!time) return '';
    
    // Se já estiver no formato HH:mm, retorna como está
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    
    // Se estiver no formato HH:mm:ss, remove os segundos
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5);
    }
    
    // Se for uma data ISO, converte para HH:mm mantendo o horário original
    try {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Erro ao formatar horário:', e);
    }
    
    return time; // Retorna o original se não conseguir formatar
  }

  private sortOrders(orders: Order[]): Order[] {
    return orders.sort((a, b) => {
      // Se ambos têm horário de preparação, compara os horários
      if (a.preparationTime && b.preparationTime) {
        const timeA = new Date(`1970-01-01T${a.preparationTime}`);
        const timeB = new Date(`1970-01-01T${b.preparationTime}`);
        return timeA.getTime() - timeB.getTime();
      }
      
      // Se apenas um tem horário de preparação, ele vem primeiro
      if (a.preparationTime) return -1;
      if (b.preparationTime) return 1;
      
      // Se nenhum tem horário de preparação, ordena pela data de criação
      // Mantém a comparação em UTC para garantir a ordem correta
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  private updateOrderList(): void {
    // Manter a ordem que veio do backend
    this.dataSource.data = this.orders;
  }
} 