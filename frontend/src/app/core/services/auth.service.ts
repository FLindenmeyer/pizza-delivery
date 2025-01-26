import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginCredentials, AuthResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly baseUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    if (this.hasToken()) {
      this.websocketService.connect();
    }
  }

  private getUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalizedPath}`;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const credentials: LoginCredentials = { email, password };
    return this.http.post<AuthResponse>(this.getUrl('/login'), credentials)
      .pipe(
        tap(response => {
          console.log('Login successful, saving token:', response.token);
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
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('Getting token from storage:', token);
    return token;
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  handleAuthError(error: HttpErrorResponse): void {
    console.error('Auth error:', error);
    if (error.status === 401) {
      console.log('Token inválido ou expirado, redirecionando para login');
      this.logout();
    }
  }

  private hasToken(): boolean {
    const hasToken = !!this.getToken();
    console.log('Checking if has token:', hasToken);
    return hasToken;
  }
} 