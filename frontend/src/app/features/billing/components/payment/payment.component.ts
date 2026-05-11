import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillingService } from '../../services/billing.service';
import { Invoice } from '../../models/billing.model';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  form!: FormGroup;
  invoice: Invoice | null = null;
  loading = false;
  fetching = true;
  invoiceId!: number;
  step: 'form' | 'confirm' | 'success' = 'form';
  methods = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI'];

  readonly methodLabels: Record<string, string> = {
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
    UPI: 'UPI'
  };

  readonly methodIcons: Record<string, string> = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'credit_card',
    UPI: 'account_balance_wallet'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private billingService: BillingService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.invoiceId = Number(this.route.snapshot.paramMap.get('invoiceId'));
    this.form = this.fb.group({
      invoiceId:     [this.invoiceId],
      paymentMethod: ['UPI', Validators.required],
      amount:        [null, [Validators.required, Validators.min(1)]]
    });

    this.billingService.getInvoiceById(this.invoiceId).subscribe({
      next: inv => {
        this.invoice = inv;
        this.form.patchValue({ amount: inv.amount });
        this.fetching = false;
      },
      error: () => { this.fetching = false; }
    });
  }

  get isCardMethod(): boolean {
    const m = this.form?.get('paymentMethod')?.value as string;
    return m === 'CREDIT_CARD' || m === 'DEBIT_CARD';
  }

  get selectedMethodLabel(): string {
    return this.methodLabels[this.form?.get('paymentMethod')?.value] ?? '';
  }

  get selectedMethodIcon(): string {
    return this.methodIcons[this.form?.get('paymentMethod')?.value] ?? 'payment';
  }

  review(): void {
    if (this.form.invalid) return;
    this.step = 'confirm';
  }

  goBack(): void {
    this.step = 'form';
  }

  pay(): void {
    this.loading = true;
    this.billingService.submitPayment(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'success';
      },
      error: () => {
        this.loading = false;
        this.snack.open('Payment failed. Please try again.', 'Close', { panelClass: 'snack-error' });
      }
    });
  }

  viewInvoices(): void {
    this.router.navigate(['/billing']);
  }
}
