import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { switchMap, catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  username: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;
const STORAGE_KEY = 'notif_read_ids';

@Injectable({ providedIn: 'root' })
export class NotificationPollingService implements OnDestroy {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private pollSub?: Subscription;
  private readIds = new Set<number>(this.loadReadIds());

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      if (user?.role === 'PATIENT') {
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.fetchOnce();
    this.pollSub = interval(POLL_INTERVAL_MS).pipe(
      filter(() => this.authService.isLoggedIn && this.authService.role === 'PATIENT'),
      switchMap(() => this.http.get<Notification[]>(`${environment.apiBase}/notification`).pipe(
        catchError(() => of([]))
      ))
    ).subscribe(notifications => this.update(notifications));
  }

  fetchOnce(): void {
    this.http.get<Notification[]>(`${environment.apiBase}/notification`).pipe(
      catchError(() => of([]))
    ).subscribe(n => this.update(n));
  }

  markAllRead(): void {
    this.notificationsSubject.value.forEach(n => this.readIds.add(n.id));
    this.saveReadIds();
    const updated = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
    this.http.put(`${environment.apiBase}/notification/mark-all-read`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  markOneRead(id: number): void {
    if (this.readIds.has(id)) return;
    this.readIds.add(id);
    this.saveReadIds();
    const updated = this.notificationsSubject.value.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(updated.filter(n => !n.isRead).length);
  }

  private loadReadIds(): number[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private saveReadIds(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.readIds)));
    } catch { /* storage quota exceeded — silently ignore */ }
  }

  private update(notifications: Notification[]): void {
    const merged = notifications.map(n =>
      this.readIds.has(n.id) ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(merged);
    this.unreadCountSubject.next(merged.filter(n => !n.isRead).length);
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
