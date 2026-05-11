import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Invoice, Payment } from '../../models/billing.model';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  payments: Payment[] = [];
  loading = true;
  role: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billingService: BillingService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.billingService.getInvoiceById(id).subscribe({
      next: inv => {
        this.invoice = inv;
        this.billingService.getPaymentHistory(inv.id).subscribe({
          next: p => { this.payments = p; this.loading = false; },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  pay(): void { this.router.navigate(['/billing/pay', this.invoice!.id]); }
}
