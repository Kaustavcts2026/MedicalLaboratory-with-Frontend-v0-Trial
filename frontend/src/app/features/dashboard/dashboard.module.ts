import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OrderService } from '../order/services/order.service';
import { LabProcessingService } from '../lab-processing/services/lab-processing.service';
import { InventoryService } from '../inventory/services/inventory.service';
import { PatientService } from '../patient/services/patient.service';
import { BillingService } from '../billing/services/billing.service';

@NgModule({
  declarations: [DashboardComponent],
  imports: [SharedModule, DashboardRoutingModule],
  providers: [OrderService, LabProcessingService, InventoryService, PatientService, BillingService]
})
export class DashboardModule {}
