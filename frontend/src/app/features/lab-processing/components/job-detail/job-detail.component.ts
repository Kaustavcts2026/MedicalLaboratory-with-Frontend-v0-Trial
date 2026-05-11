import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LabProcessingService } from '../../services/lab-processing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProcessingJob } from '../../models/job.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})
export class JobDetailComponent implements OnInit {
  job: ProcessingJob | null = null;
  loading = true;
  role: string | null = null;
  testName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private labService: LabProcessingService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const resolveTestName = (testId: number) => {
      this.labService.getLabTests().subscribe({
        next: tests => {
          const found = tests.find(t => t.id === testId);
          this.testName = found ? found.name : `Test #${testId}`;
        }
      });
    };

    const nav = this.router.getCurrentNavigation()?.extras?.state;
    const stateJob = nav?.['job'] as ProcessingJob | undefined;
    if (stateJob && stateJob.id === id) {
      this.job = stateJob;
      this.loading = false;
      resolveTestName(stateJob.testId);
    } else {
      this.labService.getAllJobs().subscribe({
        next: jobs => {
          this.job = jobs.find(j => j.id === id) ?? null;
          this.loading = false;
          if (this.job) resolveTestName(this.job.testId);
        },
        error: () => { this.loading = false; }
      });
    }
  }

  start():    void { this.labService.startJob(this.job!.id).subscribe({ next: u => this.patchJob(u) }); }
  markQC():   void { this.labService.markQC(this.job!.id).subscribe({ next: u => this.patchJob(u) }); }
  complete(): void { this.labService.completeJob(this.job!.id).subscribe({ next: u => this.patchJob(u) }); }
  cancel():   void { this.labService.cancelJob(this.job!.id).subscribe({ next: u => this.patchJob(u) }); }

  private patchJob(updated: Partial<ProcessingJob>): void {
    this.job = { ...this.job!, ...updated };
  }

  enterResult(): void {
    this.router.navigate(['/lab/result-entry', this.job!.sampleId], {
      state: { testId: this.job!.testId },
      queryParams: { testId: this.job!.testId }
    });
  }

  // G14: Confirm before approving — approval immediately triggers invoice generation in billing service
  approveResult(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Approve Result & Generate Invoice?',
        message: `Approving this result will immediately generate a billing invoice for the patient. This cannot be undone.`,
        confirmLabel: 'Approve & Bill',
        confirmColor: 'primary'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.labService.approveResult(this.job!.sampleId, this.job!.testId).subscribe({
        next: () => {
          this.patchJob({ status: 'COMPLETED' });
          this.snack.open('Result approved. Invoice generated for patient.', 'Close', { duration: 4000 });
        }
      });
    });
  }
}
