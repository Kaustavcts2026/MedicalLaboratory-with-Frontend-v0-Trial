import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { BillingRoutingModule } from './billing-routing.module';
import { BillingService } from './services/billing.service';
import { PatientService } from '../patient/services/patient.service';
import { InvoicesListComponent } from './components/invoices-list/invoices-list.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { PaymentComponent } from './components/payment/payment.component';

@NgModule({
  declarations: [InvoicesListComponent, InvoiceDetailComponent, PaymentComponent],
  imports: [SharedModule, BillingRoutingModule],
  providers: [BillingService, PatientService]
})
export class BillingModule {}
