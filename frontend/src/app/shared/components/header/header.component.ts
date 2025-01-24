import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private websocketService: WebsocketService
  ) {}

  onNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  onLogout(): void {
    this.websocketService.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
} 