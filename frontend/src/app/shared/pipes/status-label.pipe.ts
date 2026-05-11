import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  // Order status
  CREATED:          'Awaiting Sample',
  SAMPLE_COLLECTED: 'Sample Collected',
  RESULT_READY:     'Result Ready',
  CANCELLED:        'Cancelled',
  // Job status
  SAMPLE_RECEIVED:  'Sample Received',
  IN_PROCESS:       'In Process',
  QC_PENDING:       'QC Pending',
  COMPLETED:        'Completed',
  ENTERED:          'Result Entered',
  // Result / invoice status
  APPROVED:  'Approved',
  DRAFT:     'Draft',
  VERIFIED:  'Verified',
  REPORTED:  'Reported',
  PENDING:   'Pending',
  PAID:      'Paid',
  // Priority
  ROUTINE: 'Routine',
  STAT:    'STAT',
};

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return LABELS[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
