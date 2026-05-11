import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryService } from './services/inventory.service';
import { InventoryListComponent }  from './components/inventory-list/inventory-list.component';
import { LabTestCatalogComponent } from './components/lab-test-catalog/lab-test-catalog.component';
import { TestFormComponent }       from './components/test-form/test-form.component';

@NgModule({
  declarations: [InventoryListComponent, LabTestCatalogComponent, TestFormComponent],
  imports: [SharedModule, InventoryRoutingModule],
  providers: [InventoryService]
})
export class InventoryModule {}
