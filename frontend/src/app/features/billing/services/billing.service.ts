import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Invoice, Payment, PaymentRequest } from '../models/billing.model';

@Injectable()
export class BillingService {
  private invBase  = `${environment.apiBase}/invoices`;
  private payBase  = `${environment.apiBase}/payments`;

  constructor(private http: HttpClient) {}

  getInvoiceById(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.invBase}/${id}`);
  }

  getInvoiceByOrder(orderId: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.invBase}/order/${orderId}`);
  }

  getInvoiceByOrderSafe(orderId: number): Observable<Invoice | null> {
    return this.http.get<Invoice>(`${this.invBase}/order/${orderId}`, {
      headers: { 'X-Skip-Error-Toast': 'true' }
    });
  }

  getInvoicesByPatient(patientId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.invBase}/patient/${patientId}`);
  }

  submitPayment(req: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.payBase, req);
  }

  getPaymentHistory(invoiceId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.payBase}/${invoiceId}`);
  }
}
