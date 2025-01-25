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
  private readonly apiUrl = `${environment.apiUrl}/api/orders`;

  getTodayOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/today`);
  }

  getAssemblyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/today`).pipe(
      map(orders => orders.filter(order => 
        order.status === OrderStatus.PENDING || 
        order.status === OrderStatus.ASSEMBLY
      ))
    );
  }

  createOrder(order: Omit<Order, 'id'>): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order).pipe(
      tap(createdOrder => {
        console.log('Pedido criado, emitindo evento...');
        this.websocket.emitOrderCreated(createdOrder);
      })
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    console.log('Atualizando status do pedido:', { orderId, status });
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, { status }).pipe(
      tap(updatedOrder => {
        console.log('Status atualizado no backend, emitindo evento...');
        // Emitir tanto atualização geral quanto específica de status
        this.websocket.emitOrderStatusUpdate(updatedOrder);
      })
    );
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`).pipe(
      map(order => ({
        ...order,
        pizzas: order.pizzas || []
      }))
    );
  }

  deleteOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orderId}`).pipe(
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
} 