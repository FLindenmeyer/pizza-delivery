import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { OrderService } from '@core/services';
import { Order } from '@core/models';
import { OrderStatus } from '@core/models/order-status-translation.enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
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
    this.orders = orders.filter(order => 
      order.status === OrderStatus.PENDING || 
      order.status === OrderStatus.ASSEMBLY
    ).sort((a, b) => {
      // Ordena por data de criação (mais antigo primeiro)
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    });
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
    // Escuta por novos pedidos
    this.orderService.onOrderCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(newOrder => {
        console.log('Novo pedido recebido:', newOrder);
        if (newOrder.status === OrderStatus.PENDING) {
          this.orders = [...this.orders, newOrder].sort((a, b) => 
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          );
        }
      });

    // Escuta por atualizações de pedidos
    this.orderService.onOrderUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedOrder => {
        // Adicionado log para debug
        console.debug('Pedido atualizado recebido no OrderAssembly:', updatedOrder);
        const index = this.orders.findIndex(o => o.id === updatedOrder.id);
        
        if (index !== -1) {
          if (updatedOrder.status !== OrderStatus.PENDING && 
              updatedOrder.status !== OrderStatus.ASSEMBLY) {
            this.orders = this.orders.filter(o => o.id !== updatedOrder.id);
          } else {
            this.orders[index] = updatedOrder;
            this.orders = [...this.orders].sort((a, b) => 
              new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
            );
          }
        } else if (updatedOrder.status === OrderStatus.PENDING) {
          this.orders = [...this.orders, updatedOrder].sort((a, b) => 
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          );
        }
      });

    // Escuta por pedidos removidos
    this.orderService.onOrderDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orderId => {
        console.log('Pedido removido recebido:', orderId);
        this.orders = this.orders.filter(o => o.id !== orderId);
      });
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    const updatedOrder = { ...order, status: newStatus };
    this.orderService.updateOrderStatus(order.id!, newStatus).subscribe({
      next: (updatedOrder) => {
        // Emite o evento de atualização antes de atualizar o estado local
        this.websocketService.emitOrderStatusUpdate(updatedOrder);
        
        // Atualiza o estado local
        const index = this.orders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          if (updatedOrder.status !== OrderStatus.PENDING && 
              updatedOrder.status !== OrderStatus.ASSEMBLY) {
            this.orders = this.orders.filter(o => o.id !== updatedOrder.id);
          } else {
            this.orders[index] = updatedOrder;
            this.orders = [...this.orders].sort((a, b) => 
              new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
            );
          }
        }
        
        this.snackBar.open('Status atualizado com sucesso!', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar status', 'OK', { duration: 3000 });
      }
    });
  }
} 