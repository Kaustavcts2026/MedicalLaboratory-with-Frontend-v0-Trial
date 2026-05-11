import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { JobsListComponent }   from './components/jobs-list/jobs-list.component';
import { JobDetailComponent }  from './components/job-detail/job-detail.component';
import { ResultEntryComponent } from './components/result-entry/result-entry.component';
import { LabReportComponent }  from './components/lab-report/lab-report.component';

const routes: Routes = [
  {
    path: '',
    component: JobsListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['LAB_TECH', 'ADMIN'] }
  },
  {
    path: 'job/:id',
    component: JobDetailComponent,
    canActivate: [RoleGuard],
    data: { roles: ['LAB_TECH', 'ADMIN'] }
  },
  {
    path: 'result-entry/:sampleId',
    component: ResultEntryComponent,
    canActivate: [RoleGuard],
    data: { roles: ['LAB_TECH'] }
  },
  {
    path: 'results',
    component: LabReportComponent,
    canActivate: [RoleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'report/:sampleId',
    component: LabReportComponent,
    canActivate: [RoleGuard],
    data: { roles: ['PATIENT', 'ADMIN', 'LAB_TECH'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LabProcessingRoutingModule {}
