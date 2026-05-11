import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { OrderRoutingModule } from './order-routing.module';
import { OrderService } from './services/order.service';
import { OrderListComponent }   from './components/order-list/order-list.component';
import { OrderCreateComponent } from './components/order-create/order-create.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { BillingService } from '../billing/services/billing.service';
import { PatientService } from '../patient/services/patient.service';

@NgModule({
  declarations: [OrderListComponent, OrderCreateComponent, OrderDetailComponent],
  imports: [SharedModule, OrderRoutingModule],
  providers: [OrderService, BillingService, PatientService]
})
export class OrderModule {}
