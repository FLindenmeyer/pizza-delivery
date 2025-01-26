import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { OrderService } from '@core/services';
import { Order } from '@core/models';
import { OrderStatus } from '@core/models/order-status-translation.enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { WebsocketService } from 'src/app/core/services/websocket.service';

@Component({
  selector: 'app-order-assembly',
  templateUrl: './order-assembly.component.html',
  styleUrls: ['./order-assembly.component.scss']
})
export class OrderAssemblyComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  private readonly websocketService = inject(WebsocketService);

  orders: Order[] = [];
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
      error: () => {
        this.snackBar.open('Erro ao carregar pedidos', 'OK', { duration: 3000 });
      }
    });
  }

  private filterAndSortOrders(orders: Order[]): void {
    // Filtra apenas pedidos pendentes ou em montagem
    this.orders = this.sortOrders(
      orders.filter(order => 
        order.status === OrderStatus.PENDING || 
        order.status === OrderStatus.ASSEMBLY
      )
    );
  }

  isOldestOrder(order: Order): boolean {
    if (this.orders.length === 0) return false;
    
    const pendingOrders = this.orders.filter(o => 
      o.status === OrderStatus.PENDING || 
      o.status === OrderStatus.ASSEMBLY
    );
    
    if (pendingOrders.length === 0) return false;
    
    // Retorna true se este pedido é o mais antigo dos pendentes/em montagem
    return order.id === pendingOrders[0].id;
  }

  private setupWebSocketEvents(): void {
    // Escuta por atualizações de status
    this.orderService.onOrderStatusUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedOrder => {
        console.log('Status do pedido atualizado:', updatedOrder);
        this.handleOrderUpdate(updatedOrder);
      });

    // Escuta por novos pedidos
    this.orderService.onOrderCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(newOrder => {
        console.log('Novo pedido recebido via WebSocket:', newOrder);
        this.handleNewOrder(newOrder);
      });

    // Escuta por pedidos removidos
    this.orderService.onOrderDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orderId => {
        console.log('Pedido removido:', orderId);
        this.orders = this.orders.filter(o => o.id !== orderId);
      });
  }

  private handleOrderUpdate(updatedOrder: Order): void {
    const index = this.orders.findIndex(o => o.id === updatedOrder.id);
    
    if (index !== -1) {
      if (updatedOrder.status !== OrderStatus.PENDING && 
          updatedOrder.status !== OrderStatus.ASSEMBLY) {
        this.orders = this.orders.filter(o => o.id !== updatedOrder.id);
      } else {
        this.orders[index] = updatedOrder;
        this.orders = this.sortOrders([...this.orders]);
      }
    } else if (updatedOrder.status === OrderStatus.PENDING) {
      this.handleNewOrder(updatedOrder);
    }
  }

  private handleNewOrder(newOrder: Order): void {
    if (newOrder.status === OrderStatus.PENDING) {
      console.log('Adicionando novo pedido pendente à lista:', newOrder);
      this.orders = this.sortOrders([...this.orders, newOrder]);
    }
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    console.log('Atualizando status do pedido:', { orderId: order.id, oldStatus: order.status, newStatus });
    
    const updatedOrder = { ...order, status: newStatus };
    this.orderService.updateOrderStatus(order.id!, newStatus).subscribe({
      next: (updatedOrder) => {
        console.log('Status atualizado com sucesso:', updatedOrder);
        
        // Emite o evento de atualização antes de atualizar o estado local
        this.websocketService.emitOrderStatusUpdate(updatedOrder);
        
        // Atualiza o estado local
        this.handleOrderUpdate(updatedOrder);
        
        this.snackBar.open('Status atualizado com sucesso!', 'OK', { duration: 3000 });
      },
      error: (error) => {
        console.error('Erro ao atualizar status:', error);
        this.snackBar.open('Erro ao atualizar status. Por favor, tente novamente.', 'OK', { duration: 3000 });
      }
    });
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
} 