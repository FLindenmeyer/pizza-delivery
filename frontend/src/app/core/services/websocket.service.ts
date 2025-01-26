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
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_INTERVAL = 1000;
  private readonly MAX_RECONNECT_INTERVAL = 30000;
  private reconnectTimeout: any;
  private heartbeatInterval: any;
  
  orderStatusUpdated$ = this.orderStatusUpdatedSource.asObservable();
  orderCreated$ = this.orderCreatedSource.asObservable();

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    const options = {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_INTERVAL,
      timeout: 10000
    };

    this.socket = io(environment.wsUrl, options);

    this.socket.on('connect', () => {
      console.log('WebSocket conectado');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro na conexão WebSocket:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
      this.stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        console.log('Servidor forçou a desconexão - tentando reconectar...');
      } else if (reason === 'transport close') {
        console.log('Conexão de transporte fechada - tentando reconectar...');
      } else if (reason === 'ping timeout') {
        console.log('Timeout de ping detectado - tentando reconectar...');
      }
      
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconectado com sucesso após ${attemptNumber} tentativas`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Tentativa de reconexão ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Erro durante a tentativa de reconexão:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Falha em todas as tentativas de reconexão');
    });

    this.socket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
      this.handleReconnect();
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

    // Configurar heartbeat response
    this.socket.on('pong', () => {
      console.log('Heartbeat recebido do servidor');
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      // Calcula o delay com backoff exponencial
      const backoffDelay = Math.min(
        this.RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts - 1),
        this.MAX_RECONNECT_INTERVAL
      );

      console.log(`Próxima tentativa em ${backoffDelay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (!this.socket.connected) {
          console.log('Tentando reconectar...');
          this.socket.connect();
        }
      }, backoffDelay);
    } else {
      console.error('Número máximo de tentativas de reconexão atingido');
      // Notifica o usuário sobre o problema de conexão
      this.orderStatusUpdatedSource.error(new Error('Falha na conexão WebSocket - Tentando reconectar...'));
      this.orderCreatedSource.error(new Error('Falha na conexão WebSocket - Tentando reconectar...'));
      
      // Reseta as tentativas após um intervalo maior
      setTimeout(() => {
        console.log('Resetando contador de tentativas de reconexão');
        this.reconnectAttempts = 0;
        this.handleReconnect();
      }, this.MAX_RECONNECT_INTERVAL);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Heartbeat a cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  connect(): void {
    if (!this.socket.connected) {
      this.reconnectAttempts = 0;
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
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