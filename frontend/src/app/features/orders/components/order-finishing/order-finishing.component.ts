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
    this.orderService.getTodayOrders().subscribe({
      next: (orders) => {
        this.filterAndSortOrders(orders);
      },
      error: (error) => {
        console.error('Erro ao carregar pedidos:', error);
        this.snackBar.open('Erro ao carregar pedidos', 'OK', { duration: 3000 });
      }
    });
  }

  private filterAndSortOrders(orders: Order[]): void {
    // Separa os pedidos em andamento e concluídos
    const sortedOrders = this.sortOrders(orders);

    this.inProgressOrders = sortedOrders.filter(order => 
      order.status === OrderStatus.ASSEMBLY_COMPLETED || 
      order.status === OrderStatus.BAKING
    );

    this.completedOrders = sortedOrders.filter(order => 
      order.status === OrderStatus.READY
    );

    console.log('Pedidos em andamento:', this.inProgressOrders);
    console.log('Pedidos concluídos:', this.completedOrders);
  }

  private sortOrders(orders: Order[]): Order[] {
    return orders.sort((a, b) => {
      // Primeiro, ordenar por horário de preparo se existir
      if (a.preparationTime && b.preparationTime) {
        return new Date('1970/01/01 ' + a.preparationTime).getTime() - 
               new Date('1970/01/01 ' + b.preparationTime).getTime();
      }
      
      // Se não houver horário de preparo, ordenar por data de criação
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  isOldestOrder(order: Order): boolean {
    if (this.inProgressOrders.length === 0) return false;
    return order.id === this.inProgressOrders[0].id;
  }

  private setupWebSocketEvents(): void {
    // Escuta por atualizações de status
    this.websocketService.orderStatusUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedOrder => {
        console.log('Status do pedido atualizado:', updatedOrder);
        this.handleOrderUpdate(updatedOrder);
      });

    // Escuta por novos pedidos
    this.orderService.onOrderCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(newOrder => {
        console.log('Novo pedido recebido:', newOrder);
        if (newOrder.status === OrderStatus.ASSEMBLY_COMPLETED || 
            newOrder.status === OrderStatus.BAKING) {
          this.inProgressOrders = [...this.inProgressOrders, newOrder].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      });

    // Escuta por pedidos removidos
    this.orderService.onOrderDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orderId => {
        console.log('Pedido removido:', orderId);
        this.inProgressOrders = this.inProgressOrders.filter(o => o.id !== orderId);
        this.completedOrders = this.completedOrders.filter(o => o.id !== orderId);
      });
  }

  private handleOrderUpdate(updatedOrder: Order): void {
    // Remove o pedido das duas listas
    this.inProgressOrders = this.inProgressOrders.filter(o => o.id !== updatedOrder.id);
    this.completedOrders = this.completedOrders.filter(o => o.id !== updatedOrder.id);

    // Adiciona o pedido na lista apropriada
    if (updatedOrder.status === OrderStatus.ASSEMBLY_COMPLETED || 
        updatedOrder.status === OrderStatus.BAKING) {
      this.inProgressOrders = [...this.inProgressOrders, updatedOrder].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (updatedOrder.status === OrderStatus.READY) {
      this.completedOrders = [...this.completedOrders, updatedOrder].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  }
  
  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    console.log('Atualizando status do pedido:', { orderId: order.id, oldStatus: order.status, newStatus });
    
    this.orderService.updateOrderStatus(order.id!, newStatus).subscribe({
      next: (updatedOrder) => {
        console.log('Status atualizado com sucesso:', updatedOrder);
        this.handleOrderUpdate(updatedOrder);
        this.snackBar.open('Status atualizado com sucesso!', 'OK', { duration: 3000 });
      },
      error: (error) => {
        console.error('Erro ao atualizar status:', error);
        this.snackBar.open('Erro ao atualizar status', 'OK', { duration: 3000 });
      }
    });
  }
} 