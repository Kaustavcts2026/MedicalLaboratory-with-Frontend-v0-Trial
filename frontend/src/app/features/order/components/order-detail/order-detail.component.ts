import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LabTest } from '../../models/order.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BillingService } from '../../../billing/services/billing.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order: any = null;
  loading = true;
  role: string | null = null;
  testNameMap: Record<number, string> = {};
  invoicePaid = false;
  errorMessage = '';
  private orderId = 0;

  constructor(
    private route: ActivatedRoute,
    public location: Location,
    private orderService: OrderService,
    public auth: AuthService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private billingService: BillingService
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.errorMessage = 'Invalid order selected.';
      this.loading = false;
      return;
    }
    this.orderId = id;

    this.orderService.getAvailableTests().subscribe({
      next: (tests: LabTest[]) => tests.forEach(t => this.testNameMap[t.id] = t.name)
    });

    this.loadOrder();
  }

  private loadOrder(): void {
    this.loading = true;
    forkJoin({
      basic:  this.orderService.getOrder(this.orderId),
      detail: this.orderService.getOrderDetail(this.orderId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ basic, detail }) => {
        this.order = { ...basic, testIds: detail?.testIds ?? [], sampleId: detail?.sampleId ?? null };
        if (this.role === 'PATIENT') {
          this.billingService.getInvoiceByOrderSafe(this.orderId).pipe(catchError(() => of(null))).subscribe(inv => {
            this.invoicePaid = inv?.status === 'PAID';
          });
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load order details.';
        this.loading = false;
      }
    });
  }

  private reloadOrder(): void {
    forkJoin({
      basic:  this.orderService.getOrder(this.orderId),
      detail: this.orderService.getOrderDetail(this.orderId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ basic, detail }) => {
        this.order = { ...basic, testIds: detail?.testIds ?? [], sampleId: detail?.sampleId ?? null };
      }
    });
  }

  testName(id: number): string {
    return this.testNameMap[id] ?? `Test #${id}`;
  }

  statusColor(status: string): string {
    const m: Record<string, string> = {
      CREATED: 'status--pending',
      SAMPLE_COLLECTED: 'status--collected',
      CANCELLED: 'status--cancelled'
    };
    return m[status] ?? '';
  }

  collectSample(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Collect Sample?',
        message: 'This will mark the sample as collected and create a processing job in the Lab queue. This action cannot be undone.',
        confirmLabel: 'Collect Sample',
        confirmColor: 'primary'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderService.collectSample(this.order.id, 0).subscribe({
        next: () => {
          this.snack.open('Sample collected — job created in Lab queue.', 'Close', { duration: 4000, panelClass: 'snack-success' });
          // Optimistic update — button disappears immediately
          this.order = { ...this.order, status: 'SAMPLE_COLLECTED' };
          // Then confirm from server
          this.reloadOrder();
        },
        error: () => {
          // Error toast already shown by interceptor; reload to confirm current state
          this.reloadOrder();
        }
      });
    });
  }
}
