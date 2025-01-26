import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sidenav') sidenav?: MatSidenav;
  isMobile = false;
  isOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupBreakpointObserver();
  }

  ngAfterViewInit(): void {
    // Detecta mudanças após a view ser inicializada para evitar ExpressionChangedAfterItHasBeenCheckedError
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupBreakpointObserver(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        if (!this.isMobile && this.sidenav?.opened) {
          this.closeSidenav();
        }
        this.cdr.detectChanges();
      });
  }

  openSidenav(): void {
    this.isOpen = true;
    this.sidenav?.open();
  }

  closeSidenav(): void {
    this.sidenav?.close();
  }

  onNewOrder(): void {
    if (this.isMobile && this.sidenav?.opened) {
      this.closeSidenav();
    }
    this.router.navigate(['/orders/new']);
  }

  onLogout(): void {
    if (this.isMobile && this.sidenav?.opened) {
      this.closeSidenav();
    }
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
} 