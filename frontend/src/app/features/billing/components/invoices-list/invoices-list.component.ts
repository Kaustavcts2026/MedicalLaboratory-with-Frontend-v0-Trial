import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../../patient/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Invoice } from '../../models/billing.model';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss']
})
export class InvoicesListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<Invoice>();
  displayedColumns = ['invoiceNumber', 'orderId', 'amount', 'status', 'dueDate', 'actions'];
  loading = true;
  role: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private billingService: BillingService,
    private patientService: PatientService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    this.loadByRole();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadByRole(): void {
    if (this.role === 'PATIENT') {
      this.patientService.getProfile().subscribe({
        next: profile => this.loadByPatientId(profile.id),
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  loadByOrderId(orderId: number): void {
    this.loading = true;
    this.billingService.getInvoiceByOrder(orderId).subscribe({
      next: inv => {
        this.dataSource.data = [inv];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadByPatientId(patientId: number): void {
    this.loading = true;
    this.billingService.getInvoicesByPatient(patientId).subscribe({
      next: invs => {
        this.dataSource.data = invs;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  viewInvoice(id: number): void { this.router.navigate(['/billing/invoice', id]); }
  pay(invoiceId: number): void { this.router.navigate(['/billing/pay', invoiceId]); }

  statusColor(s: string): string {
    const m: Record<string, string> = { PENDING: 'st--pending', PAID: 'st--paid', CANCELLED: 'st--cancelled' };
    return m[s] ?? '';
  }
}
