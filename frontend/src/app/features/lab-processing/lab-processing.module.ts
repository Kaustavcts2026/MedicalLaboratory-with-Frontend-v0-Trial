import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { LabProcessingRoutingModule } from './lab-processing-routing.module';
import { LabProcessingService } from './services/lab-processing.service';
import { JobsListComponent }    from './components/jobs-list/jobs-list.component';
import { JobDetailComponent }   from './components/job-detail/job-detail.component';
import { ResultEntryComponent } from './components/result-entry/result-entry.component';
import { LabReportComponent }   from './components/lab-report/lab-report.component';

@NgModule({
  declarations: [JobsListComponent, JobDetailComponent, ResultEntryComponent, LabReportComponent],
  imports: [SharedModule, LabProcessingRoutingModule],
  providers: [LabProcessingService]
})
export class LabProcessingModule {}
