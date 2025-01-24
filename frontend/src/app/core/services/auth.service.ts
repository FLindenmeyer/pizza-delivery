import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginCredentials, AuthResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService
  ) {
    if (this.hasToken()) {
      this.websocketService.connect();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const credentials: LoginCredentials = { email, password };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.isAuthenticatedSubject.next(true);
          this.websocketService.connect();
        })
      );
  }

  logout(): void {
    this.websocketService.disconnect();
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
} 