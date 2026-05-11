import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationPollingService } from '../../../core/services/notification-polling.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  isDark$!: Observable<boolean>;
  unreadCount$!: Observable<number>;
  username: string | null = null;
  role: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private notifications: NotificationPollingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDark$ = this.themeService.isDark$;
    this.unreadCount$ = this.notifications.unreadCount$;
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => {
      this.username = u?.username ?? null;
      this.role = u?.role ?? null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleTheme(): void {
    this.themeService.toggle();
  }

  onUpdateProfile(): void {
    if (this.role === 'PATIENT') {
      this.router.navigate(['/patient/profile'], { queryParams: { edit: true } });
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
