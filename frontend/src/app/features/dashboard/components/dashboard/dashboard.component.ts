import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationPollingService } from '../../../../core/services/notification-polling.service';
import { OrderService } from '../../../order/services/order.service';
import { LabProcessingService } from '../../../lab-processing/services/lab-processing.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { PatientService } from '../../../patient/services/patient.service';
import { BillingService } from '../../../billing/services/billing.service';
import { UserRole } from '../../../../core/models/user.model';
import { Order } from '../../../order/models/order.model';
import { ProcessingJob } from '../../../lab-processing/models/job.model';
import { InventoryItem, LabTest } from '../../../inventory/models/inventory.model';
import { Invoice } from '../../../billing/models/billing.model';

interface StatTile {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  role: UserRole | null = null;
  username = '';
  loading = true;
  private destroy$ = new Subject<void>();

  stats: StatTile[] = [];

  // Admin / Lab Tech data
  pendingApprovalJobs: ProcessingJob[] = [];
  activeJobs: ProcessingJob[] = [];
  lowStockItems: InventoryItem[] = [];
  allInventoryItems: InventoryItem[] = [];
  totalInventoryCount = 0;
  recentTests: LabTest[] = [];

  // Patient data
  recentOrders: Order[] = [];
  pendingInvoices: Invoice[] = [];
  unreadCount = 0;

  // Patient showcase marquee
  tagline = '';
  private readonly taglines = [
    'Your health data, securely managed — anytime, anywhere.',
    'Fast, accurate lab results delivered right to you.',
    'Trusted diagnostics. Transparent results. Zero hassle.',
    'Smart lab testing for a healthier tomorrow.',
    'From sample to report — we\'ve got every step covered.',
    'Precision diagnostics, compassionate care.',
    'Lab results you can trust. Peace of mind you deserve.',
    'Seamless testing. Reliable reporting. Modern healthcare.',
    'Because your health deserves the best science has to offer.',
    'Know your numbers. Own your health.',
  ];
  readonly marqueeImages: string[] = (() => {
    const imgs = Array.from({ length: 10 }, (_, i) => `assets/lab-images/img${i + 1}.jpg`);
    return [...imgs, ...imgs]; // doubled for seamless infinite scroll
  })();

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifService: NotificationPollingService,
    private orderService: OrderService,
    private labService: LabProcessingService,
    private invService: InventoryService,
    private patientService: PatientService,
    private billingService: BillingService
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role as UserRole;
    this.username = this.auth.username ?? '';
    this.notifService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(c => this.unreadCount = c);
    this.tagline = this.taglines[Math.floor(Math.random() * this.taglines.length)];
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboard(): void {
    if (this.role === 'ADMIN')    this.loadAdmin();
    else if (this.role === 'LAB_TECH') this.loadLabTech();
    else if (this.role === 'PATIENT')  this.loadPatient();
    else this.loading = false;
  }

  private loadAdmin(): void {
    forkJoin({
      orders:    this.orderService.getAllOrders().pipe(catchError(() => of([]))),
      jobs:      this.labService.getAllJobs().pipe(catchError(() => of([]))),
      inventory: this.invService.getInventory().pipe(catchError(() => of([]))),
      tests:     this.invService.getTests().pipe(catchError(() => of([])))
    }).subscribe(({ orders, jobs, inventory, tests }) => {
      const active       = jobs.filter((j: ProcessingJob) => !['CANCELLED','COMPLETED','ENTERED'].includes(j.status));
      const needsApproval = jobs.filter((j: ProcessingJob) => j.status === 'ENTERED');
      const lowStock      = inventory.filter((i: InventoryItem) => i.lowStock);

      this.stats = [
        { label: 'Total Orders',     value: orders.length,        icon: 'receipt',      color: '#1565c0', route: '/orders' },
        { label: 'Active Lab Jobs',  value: active.length,        icon: 'biotech',      color: '#2e7d32', route: '/lab' },
        { label: 'Pending Approval', value: needsApproval.length, icon: 'task_alt',     color: '#e65100', route: '/lab' },
        { label: 'Low Stock Alerts', value: lowStock.length,      icon: 'inventory_2',  color: '#c62828', route: '/inventory' },
      ];

      this.pendingApprovalJobs = needsApproval.slice(0, 5);
      this.activeJobs          = active.slice(0, 5);
      this.lowStockItems       = lowStock.slice(0, 5);
      this.recentTests         = tests.slice(0, 6);
      this.totalInventoryCount = inventory.length;
      this.allInventoryItems   = [...inventory]
        .sort((a, b) => (b.lowStock ? 1 : 0) - (a.lowStock ? 1 : 0))
        .slice(0, 9);
      this.loading = false;
    });
  }

  private loadLabTech(): void {
    forkJoin({
      jobs:      this.labService.getAllJobs().pipe(catchError(() => of([]))),
      inventory: this.invService.getInventory().pipe(catchError(() => of([]))),
      tests:     this.invService.getTests().pipe(catchError(() => of([])))
    }).subscribe(({ jobs, inventory, tests }) => {
      this.stats = [
        { label: 'In Queue',          value: jobs.filter((j: ProcessingJob) => j.status === 'CREATED' || j.status === 'SAMPLE_RECEIVED').length, icon: 'pending_actions', color: '#1565c0', route: '/lab' },
        { label: 'In Process',        value: jobs.filter((j: ProcessingJob) => j.status === 'IN_PROCESS').length,      icon: 'biotech',         color: '#6a1b9a', route: '/lab' },
        { label: 'Awaiting QC',       value: jobs.filter((j: ProcessingJob) => j.status === 'QC_PENDING').length,      icon: 'verified',        color: '#e65100', route: '/lab' },
        { label: 'Ready for Entry',   value: jobs.filter((j: ProcessingJob) => j.status === 'COMPLETED').length,       icon: 'edit_note',       color: '#2e7d32', route: '/lab' },
      ];

      this.activeJobs    = jobs.filter((j: ProcessingJob) => !['CANCELLED','COMPLETED','ENTERED'].includes(j.status)).slice(0, 6);
      this.lowStockItems = inventory.filter((i: InventoryItem) => i.lowStock).slice(0, 5);
      this.recentTests   = tests.slice(0, 6);
      this.loading = false;
    });
  }

  private loadPatient(): void {
    forkJoin({
      profile: this.patientService.getProfile().pipe(catchError(() => of(null))),
      orders:  this.orderService.getMyOrders().pipe(catchError(() => of([])))
    }).subscribe(({ profile, orders }: { profile: any, orders: Order[] }) => {
      this.recentOrders = orders.slice(0, 5);

      const buildStats = (invoicesCount: number, paidOrderIds: Set<number>) => {
        const activeCount = orders.filter(o => o.status !== 'CANCELLED' && !paidOrderIds.has(o.id)).length;
        this.stats = [
          { label: 'Active Orders',    value: activeCount,      icon: 'science',       color: '#1565c0', route: '/orders' },
          { label: 'Pending Invoices', value: invoicesCount,    icon: 'receipt_long',  color: '#e65100', route: '/billing' },
          { label: 'Notifications',    value: this.unreadCount, icon: 'notifications', color: '#6a1b9a', route: '/notifications' },
        ];
      };

      if (profile?.id) {
        this.billingService.getInvoicesByPatient(profile.id).pipe(catchError(() => of([]))).subscribe((invs: Invoice[]) => {
          this.pendingInvoices = invs.filter(i => i.status === 'PENDING').slice(0, 5);
          const paidOrderIds = new Set(invs.filter(i => i.status === 'PAID').map(i => i.orderId));
          buildStats(this.pendingInvoices.length, paidOrderIds);
          this.loading = false;
        });
      } else {
        buildStats(0, new Set());
        this.loading = false;
      }
    });
  }

  trackByImg(_: number, url: string): string { return url; }

  jobStatusColor(status: string): string {
    const m: Record<string, string> = {
      SAMPLE_RECEIVED: 'st--received', IN_PROCESS: 'st--processing',
      QC_PENDING: 'st--qc', COMPLETED: 'st--done', ENTERED: 'st--entered', CANCELLED: 'st--cancelled'
    };
    return m[status] ?? '';
  }

  orderStatusColor(status: string): string {
    const m: Record<string, string> = {
      CREATED: 'status--pending', SAMPLE_COLLECTED: 'status--collected', CANCELLED: 'status--cancelled'
    };
    return m[status] ?? '';
  }
}
