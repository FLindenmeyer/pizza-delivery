import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    console.log('Intercepting request to:', request.url);
    console.log('Token available:', !!token);

    // Skip adding token for login request
    if (request.url.includes('/login')) {
      console.log('Skipping token for login request');
      return next.handle(request);
    }

    if (token) {
      console.log('Adding token to request');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.log('No token available for request');
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.authService.handleAuthError(error);
        throw error;
      })
    );
  }
} 