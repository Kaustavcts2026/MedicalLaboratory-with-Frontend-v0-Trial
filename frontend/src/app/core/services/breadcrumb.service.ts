import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface BreadcrumbItem { label: string; url: string; }

const SEGMENT_LABELS: Record<string, string> = {
  dashboard:      'Dashboard',
  orders:         'Orders',
  new:            'New Order',
  lab:            'Lab Jobs',
  job:            'Job',
  'result-entry': 'Enter Result',
  results:        'My Results',
  report:         'Report',
  billing:        'Billing',
  invoice:        'Invoice',
  pay:            'Payment',
  notifications:  'Notifications',
  admin:          'Admin',
  inventory:      'Inventory',
  patient:        'Profile',
};

function isId(seg: string): boolean {
  return /^\d+$/.test(seg);
}

function labelFor(seg: string, prevSeg?: string): string {
  if (isId(seg)) {
    const prefix = prevSeg ? SEGMENT_LABELS[prevSeg] ?? '' : '';
    return prefix ? `${prefix} #${seg}` : `#${seg}`;
  }
  return SEGMENT_LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildCrumbs(url: string): BreadcrumbItem[] {
  const clean = url.split('?')[0];
  const parts = clean.split('/').filter(Boolean);
  if (parts.length <= 1) return [];

  const crumbs: BreadcrumbItem[] = [];
  let path = '';

  for (let i = 0; i < parts.length; i++) {
    path += '/' + parts[i];
    const label = labelFor(parts[i], parts[i - 1]);
    // Skip duplicate labels (e.g. /billing/invoice/3 → don't double "Invoice")
    if (isId(parts[i]) && crumbs.length > 0) {
      crumbs[crumbs.length - 1] = { label, url: path };
    } else {
      crumbs.push({ label, url: path });
    }
  }

  return crumbs;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private _crumbs$ = new BehaviorSubject<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this._crumbs$.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => buildCrumbs((e as NavigationEnd).urlAfterRedirects))
    ).subscribe(crumbs => this._crumbs$.next(crumbs));
  }
}
