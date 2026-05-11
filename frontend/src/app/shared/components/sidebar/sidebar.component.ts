import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  role: string | null = null;
  private destroy$ = new Subject<void>();

  readonly navLinks: NavLink[] = [
    { label: 'Dashboard',    icon: 'dashboard',        route: '/dashboard',       roles: ['ADMIN','PATIENT','LAB_TECH'] },
    { label: 'My Orders',    icon: 'science',           route: '/orders',          roles: ['PATIENT'] },
    { label: 'Orders',       icon: 'list_alt',          route: '/orders',          roles: ['ADMIN'] },
    { label: 'My Results',   icon: 'article',           route: '/lab/results',     roles: ['PATIENT'] },
    { label: 'Lab Jobs',     icon: 'biotech',           route: '/lab',             roles: ['LAB_TECH','ADMIN'] },
    { label: 'Inventory',    icon: 'inventory_2',       route: '/inventory',       roles: ['ADMIN','LAB_TECH'] },
    { label: 'Billing',      icon: 'receipt_long',      route: '/billing',         roles: ['ADMIN','PATIENT','LAB_TECH'] },
    { label: 'Notifications',icon: 'notifications',     route: '/notifications',   roles: ['PATIENT'] },
    { label: 'Admin Panel',  icon: 'admin_panel_settings', route: '/admin',        roles: ['ADMIN'] },
    { label: 'My Profile',   icon: 'person',            route: '/patient/profile', roles: ['PATIENT'] },
  ];

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.role = u?.role ?? null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleLinks(): NavLink[] {
    if (!this.role) return [];
    return this.navLinks.filter(l => l.roles.includes(this.role!));
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  logout(): void {
    this.authService.logout();
    this.close.emit();
  }
}
