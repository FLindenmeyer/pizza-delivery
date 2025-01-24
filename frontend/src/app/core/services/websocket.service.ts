import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';
import { Observable, Subject, fromEvent } from 'rxjs';
import { Order } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket!: Socket;
  private orderStatusUpdatedSource = new Subject<any>();
  orderStatusUpdated$ = this.orderStatusUpdatedSource.asObservable();

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    const options = {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true
    };

    this.socket = io(environment.wsUrl, options);

    this.socket.on('connect', () => {
      console.log('WebSocket conectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro na conexão WebSocket:', error);
      // Tentar reconectar após erro
      setTimeout(() => {
        this.socket.connect();
      }, 1000);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
      if (reason === 'io server disconnect') {
        // Reconecta se a desconexão foi iniciada pelo servidor
        this.socket.connect();
      }
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  emitOrderUpdated(order: Order): void {
    this.socket.emit('orderUpdated', order);
  }

  onOrderUpdated(): Observable<Order> {
    return fromEvent(this.socket, 'orderUpdated');
  }

  emitOrderCreated(order: Order): void {
    this.socket.emit('orderCreated', order);
  }

  onOrderCreated(): Observable<Order> {
    return fromEvent(this.socket, 'orderCreated');
  }

  emitOrderDeleted(orderId: string): void {
    this.socket.emit('orderDeleted', orderId);
  }

  onOrderDeleted(): Observable<string> {
    return fromEvent(this.socket, 'orderDeleted');
  }

  emitOrderStatusUpdate(order: Order): void {
    this.socket.emit('orderStatusUpdated', order);
    this.orderStatusUpdatedSource.next(order);
  }

  onInitialOrders(): Observable<Order[]> {
    return fromEvent(this.socket, 'initialOrders');
  }
} 