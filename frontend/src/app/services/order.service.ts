import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/pizza.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) {}

  getTodayOrders(): Observable<Order[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<Order[]>(`${this.apiUrl}/today`);
  }

  getOrders(startDate?: Date, endDate?: Date): Observable<Order[]> {
    let url = this.apiUrl;
    if (startDate && endDate) {
      url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    return this.http.get<Order[]>(url);
  }

  createOrder(order: Omit<Order, 'id'>): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, { status });
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }
} 