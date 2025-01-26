import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models';
import { OrderStatus } from '../models/order-status-translation.enum';
import { environment } from '@env/environment';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly websocket = inject(WebsocketService);
  private readonly baseUrl = environment.apiUrl;

  private getUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalizedPath}`;
  }

  getTodayOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.getUrl('/orders/today'));
  }

  getAssemblyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.getUrl('/orders/today')).pipe(
      map(orders => orders.filter(order => 
        order.status === OrderStatus.PENDING || 
        order.status === OrderStatus.ASSEMBLY
      ))
    );
  }

  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Observable<Order> {
    return this.http.post<Order>(this.getUrl('/orders'), order).pipe(
      tap(newOrder => {
        console.log('Pedido criado, emitindo evento...');
        this.websocket.emitOrderCreated(newOrder);
      })
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    console.log('Atualizando status do pedido:', { orderId, status });
    return this.http.patch<Order>(this.getUrl(`/orders/${orderId}/status`), { status }).pipe(
      tap(updatedOrder => {
        console.log('Status atualizado no backend, emitindo evento...');
        this.websocket.emitOrderStatusUpdate(updatedOrder);
      })
    );
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(this.getUrl(`/orders/${id}`)).pipe(
      map(order => ({
        ...order,
        pizzas: order.pizzas || []
      }))
    );
  }

  deleteOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(`/orders/${orderId}`)).pipe(
      tap(() => {
        console.log('Pedido removido, emitindo evento...');
        this.websocket.emitOrderDeleted(orderId);
      })
    );
  }

  // WebSocket Events
  onOrderUpdated(): Observable<Order> {
    return this.websocket.onOrderUpdated();
  }

  onOrderCreated(): Observable<Order> {
    return this.websocket.onOrderCreated();
  }

  onOrderDeleted(): Observable<string> {
    return this.websocket.onOrderDeleted();
  }

  onOrderStatusUpdated(): Observable<Order> {
    return this.websocket.orderStatusUpdated$;
  }

  getOrders(startDate?: Date, endDate?: Date): Observable<Order[]> {
    let url = this.getUrl('/orders');
    if (startDate && endDate) {
      url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    return this.http.get<Order[]>(url);
  }
} 