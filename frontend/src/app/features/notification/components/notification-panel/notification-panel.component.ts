import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationPollingService, Notification } from '../../../../core/services/notification-polling.service';

interface NotifGroup { label: string; items: Notification[]; }

@Component({
  selector: 'app-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  expandedId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(private pollingService: NotificationPollingService) {}

  ngOnInit(): void {
    this.pollingService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.notifications = list; });

    this.pollingService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => { this.unreadCount = count; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get groupedNotifications(): NotifGroup[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86_400_000;

    const groups: NotifGroup[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Older', items: [] }
    ];

    for (const n of this.notifications) {
      const t = new Date(n.createdAt).setHours(0, 0, 0, 0);
      if (t === todayStart)     groups[0].items.push(n);
      else if (t === yesterdayStart) groups[1].items.push(n);
      else                      groups[2].items.push(n);
    }

    return groups.filter(g => g.items.length > 0);
  }

  markAllRead(): void {
    this.pollingService.markAllRead();
  }

  toggleExpand(n: Notification): void {
    this.expandedId = this.expandedId === n.id ? null : n.id;
    if (!n.isRead) this.pollingService.markOneRead(n.id);
  }

  trackById(_: number, n: Notification): number { return n.id; }
  trackByLabel(_: number, g: NotifGroup): string { return g.label; }
}
