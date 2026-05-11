import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PatientService } from '../../../patient/services/patient.service';
import { BillingService } from '../../../billing/services/billing.service';
import { Order } from '../../models/order.model';
import { Invoice } from '../../../billing/models/billing.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<Order>();
  loading = true;
  role: string | null = null;
  labTechView = false;
  paidOrderIds = new Set<number>();

  get displayedColumns(): string[] {
    return ['orderNumber', 'priority', 'status', 'actions'];
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private orderService: OrderService,
    public auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private patientService: PatientService,
    private billingService: BillingService
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  load(): void {
    if (this.role === 'LAB_TECH') {
      this.labTechView = true;
      this.loading = false;
      return;
    }

    if (this.role === 'PATIENT') {
      this.loading = true;
      this.patientService.getProfile(true).pipe(
        catchError(() => of(null)),
        switchMap((profile: any) => forkJoin({
          orders: this.orderService.getMyOrders().pipe(catchError(() => of([]))),
          invs: profile?.id
            ? this.billingService.getInvoicesByPatient(profile.id).pipe(catchError(() => of([])))
            : of([])
        }))
      ).subscribe(({ orders, invs }: { orders: Order[], invs: Invoice[] }) => {
        this.paidOrderIds = new Set(invs.filter(i => i.status === 'PAID').map(i => i.orderId));
        this.dataSource.data = orders;
        this.loading = false;
      });
      return;
    }

    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.dataSource.data = orders;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.dataSource.filter = val.trim().toLowerCase();
  }

  clearFilter(): void { this.dataSource.filter = ''; }

  viewOrder(id: number): void { this.router.navigate(['/orders', id]); }
  newOrder(): void { this.router.navigate(['/orders/new']); }

  effectiveStatus(o: Order): string {
    if (o.status === 'SAMPLE_COLLECTED' && this.paidOrderIds.has(o.id)) return 'RESULT_READY';
    return o.status;
  }

  cancelOrder(id: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Order?',
        message: 'This order will be permanently cancelled and cannot be reactivated.',
        confirmLabel: 'Cancel Order',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderService.cancelOrder(id).subscribe(() => {
        this.snack.open('Order cancelled.', 'Close', { duration: 3000 });
        this.load();
      });
    });
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      CREATED: 'status--pending', SAMPLE_COLLECTED: 'status--collected',
      RESULT_READY: 'status--done', CANCELLED: 'status--cancelled'
    };
    return map[status] ?? '';
  }
}
