import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { OrderService } from '@core/services';
import { Order } from '@core/models';
import { OrderStatus } from '@core/models/order-status-translation.enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { WebsocketService } from 'src/app/core/services/websocket.service';

@Component({
  selector: 'app-order-finishing',
  templateUrl: './order-finishing.component.html',
  styleUrls: ['./order-finishing.component.scss']
})
export class OrderFinishingComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  private readonly websocketService = inject(WebsocketService);

  inProgressOrders: Order[] = [];
  completedOrders: Order[] = [];
  readonly OrderStatus = OrderStatus;

  ngOnInit(): void {
    this.loadOrders();
    this.setupWebSocketEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrders(): void {
    this.orderService.getTodayOrders().subscribe(orders => {
      this.filterAndSortOrders(orders);
    });
  }

  private filterAndSortOrders(orders: Order[]): void {
    // Separa os pedidos em andamento e concluídos
    const sortedOrders = orders.sort((a, b) => 
      new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    );

    this.inProgressOrders = sortedOrders.filter(order => 
      order.status === OrderStatus.ASSEMBLY_COMPLETED || 
      order.status === OrderStatus.BAKING
    );

    this.completedOrders = sortedOrders.filter(order => 
      order.status === OrderStatus.READY
    );
  }

  isOldestOrder(order: Order): boolean {
    if (this.inProgressOrders.length === 0) return false;
    return order.id === this.inProgressOrders[0].id;
  }

  private setupWebSocketEvents(): void {
    this.orderService.onOrderUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedOrder => {
        console.debug('Pedido atualizado recebido no OrderFinishing:', updatedOrder);
        
        // Remove o pedido das duas listas
        this.inProgressOrders = this.inProgressOrders.filter(o => o.id !== updatedOrder.id);
        this.completedOrders = this.completedOrders.filter(o => o.id !== updatedOrder.id);

        // Adiciona o pedido na lista apropriada
        if (updatedOrder.status === OrderStatus.ASSEMBLY_COMPLETED || 
            updatedOrder.status === OrderStatus.BAKING) {
          this.inProgressOrders = [...this.inProgressOrders, updatedOrder].sort((a, b) => 
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          );
        } else if (updatedOrder.status === OrderStatus.READY) {
          this.completedOrders = [...this.completedOrders, updatedOrder].sort((a, b) => 
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          );
        }
      });

    // Escuta por pedidos removidos
    this.orderService.onOrderDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orderId => {
        console.log('Pedido removido recebido:', orderId);
        this.inProgressOrders = this.inProgressOrders.filter(o => o.id !== orderId);
        this.completedOrders = this.completedOrders.filter(o => o.id !== orderId);
      });
  }
  
  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(order.id!, newStatus).subscribe({
      next: (updatedOrder) => {
        this.websocketService.emitOrderStatusUpdate(updatedOrder);
        this.snackBar.open('Status atualizado com sucesso!', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar status', 'OK', { duration: 3000 });
      }
    });
  }

  changeOrderStatus(order: any, newStatus: string) {
    order.status = newStatus;
    this.websocketService.emitOrderStatusUpdate(order); // Emite a atualização
  }
} 