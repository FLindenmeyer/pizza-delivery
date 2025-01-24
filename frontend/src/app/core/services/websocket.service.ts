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
  private orderStatusUpdatedSource = new Subject<Order>();
  private orderCreatedSource = new Subject<Order>();
  
  orderStatusUpdated$ = this.orderStatusUpdatedSource.asObservable();
  orderCreated$ = this.orderCreatedSource.asObservable();

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
      setTimeout(() => {
        this.socket.connect();
      }, 1000);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
    });

    // Configurar listener para atualizações de status
    this.socket.on('orderStatusUpdated', (order: Order) => {
      console.log('Status do pedido atualizado via WebSocket:', order);
      this.orderStatusUpdatedSource.next(order);
    });

    // Configurar listener para atualizações gerais
    this.socket.on('orderUpdated', (order: Order) => {
      console.log('Pedido atualizado via WebSocket:', order);
      this.orderStatusUpdatedSource.next(order);
    });

    // Configurar listener para novos pedidos
    this.socket.on('orderCreated', (order: Order) => {
      console.log('Novo pedido recebido via WebSocket:', order);
      this.orderCreatedSource.next(order);
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
    console.log('Emitindo atualização de pedido:', order);
    this.socket.emit('orderUpdated', order);
    this.orderStatusUpdatedSource.next(order);
  }

  onOrderUpdated(): Observable<Order> {
    return this.orderStatusUpdated$;
  }

  emitOrderCreated(order: Order): void {
    console.log('Emitindo novo pedido:', order);
    this.socket.emit('orderCreated', order);
    this.orderCreatedSource.next(order);
  }

  onOrderCreated(): Observable<Order> {
    return this.orderCreated$;
  }

  emitOrderDeleted(orderId: string): void {
    console.log('Emitindo exclusão de pedido:', orderId);
    this.socket.emit('orderDeleted', orderId);
  }

  onOrderDeleted(): Observable<string> {
    return fromEvent(this.socket, 'orderDeleted');
  }

  emitOrderStatusUpdate(order: Order): void {
    console.log('Emitindo atualização de status:', order);
    this.socket.emit('orderStatusUpdated', order);
    this.orderStatusUpdatedSource.next(order);
  }

  onInitialOrders(): Observable<Order[]> {
    return fromEvent(this.socket, 'initialOrders');
  }
} 