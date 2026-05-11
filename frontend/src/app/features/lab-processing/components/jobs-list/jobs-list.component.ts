import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LabProcessingService } from '../../services/lab-processing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProcessingJob } from '../../models/job.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss']
})
export class JobsListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<ProcessingJob>();
  displayedColumns = ['id', 'sampleId', 'testName', 'status', 'createdAt', 'actions'];
  loading = true;
  role: string | null = null;
  testNameMap: Record<number, string> = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private labService: LabProcessingService,
    public auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    this.labService.getLabTests().subscribe({
      next: tests => { tests.forEach(t => this.testNameMap[t.id] = t.name); }
    });
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  testName(testId: number): string {
    return this.testNameMap[testId] ?? `Test #${testId}`;
  }

  load(): void {
    this.loading = true;
    this.labService.getAllJobs().subscribe({
      next: jobs => {
        this.dataSource.data = jobs;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  clearFilter(): void { this.dataSource.filter = ''; }

  viewJob(job: ProcessingJob): void {
    this.router.navigate(['/lab/job', job.id], { state: { job } });
  }

  enterResult(job: ProcessingJob): void {
    this.router.navigate(['/lab/result-entry', job.sampleId], { state: { testId: job.testId }, queryParams: { testId: job.testId } });
  }

  startJob(id: number): void {
    this.labService.startJob(id).subscribe(() => {
      this.snack.open('Job started — status: IN_PROCESS', 'Close', { duration: 3000 });
      this.load();
    });
  }

  markQC(id: number): void {
    this.labService.markQC(id).subscribe(() => {
      this.snack.open('QC marked — status: QC_PENDING', 'Close', { duration: 3000 });
      this.load();
    });
  }

  completeJob(id: number): void {
    this.labService.completeJob(id).subscribe(() => {
      this.snack.open('Job completed — ready for result entry.', 'Close', { duration: 3000 });
      this.load();
    });
  }

  approveResult(job: ProcessingJob): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Approve Result?',
        message: `Approve the entered result for Sample #${job.sampleId}? This will mark it as APPROVED and generate the patient invoice.`,
        confirmLabel: 'Approve',
        confirmColor: 'primary'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.labService.approveResult(job.sampleId, job.testId).subscribe({
        next: () => {
          this.snack.open('Result approved — patient invoice generated.', 'Close', { panelClass: 'snack-success' });
          // Optimistic update — remove the ENTERED status immediately so approve button vanishes
          this.dataSource.data = this.dataSource.data.map(j =>
            j.id === job.id ? { ...j, status: 'RESULT_APPROVED' } : j
          );
          // Sync true status from server
          this.load();
        },
        error: () => {
          this.snack.open('Failed to approve result. Please try again.', 'Close', { panelClass: 'snack-error' });
        }
      });
    });
  }

  cancelJob(id: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Job?',
        message: 'This processing job will be cancelled. The sample will need to be re-collected.',
        confirmLabel: 'Cancel Job',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.labService.cancelJob(id).subscribe(() => {
        this.snack.open('Job cancelled.', 'Close', { duration: 3000 });
        this.load();
      });
    });
  }

  statusColor(s: string): string {
    const m: Record<string, string> = {
      CREATED: 'st--created', SAMPLE_RECEIVED: 'st--received', IN_PROCESS: 'st--processing',
      QC_PENDING: 'st--qc', COMPLETED: 'st--done', CANCELLED: 'st--cancelled', ENTERED: 'st--entered'
    };
    return m[s] ?? '';
  }
}
