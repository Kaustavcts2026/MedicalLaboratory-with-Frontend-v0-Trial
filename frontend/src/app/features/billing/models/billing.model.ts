export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentStatus = 'PAID';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI';

export interface Invoice {
  id:            number;
  invoiceNumber: string;
  orderId:       number;
  patientId:     number;
  amount:        number;
  currency:      string;
  status:        InvoiceStatus;
  dueDate:       string;
  createdAt:     string;
}

export interface Payment {
  transactionId: string;
  invoiceId:     number;
  amount:        number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt:        string;
  message:       string;
}

export interface PaymentRequest {
  invoiceId:     number;
  paymentMethod: PaymentMethod;
  amount:        number;
}
