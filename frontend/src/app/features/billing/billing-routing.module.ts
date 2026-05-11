import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoicesListComponent } from './components/invoices-list/invoices-list.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { PaymentComponent } from './components/payment/payment.component';

const routes: Routes = [
  { path: '',           component: InvoicesListComponent },
  { path: 'invoice/:id', component: InvoiceDetailComponent },
  { path: 'pay/:invoiceId', component: PaymentComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillingRoutingModule {}
