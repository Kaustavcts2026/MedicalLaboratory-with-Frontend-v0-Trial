import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryListComponent }  from './components/inventory-list/inventory-list.component';
import { LabTestCatalogComponent } from './components/lab-test-catalog/lab-test-catalog.component';
import { TestFormComponent }       from './components/test-form/test-form.component';

const routes: Routes = [
  { path: '',         component: InventoryListComponent },
  { path: 'tests',    component: LabTestCatalogComponent },
  { path: 'tests/new',      component: TestFormComponent },
  { path: 'tests/:id/edit', component: TestFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule {}
