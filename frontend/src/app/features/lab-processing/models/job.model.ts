export type JobStatus = 'CREATED' | 'SAMPLE_RECEIVED' | 'IN_PROCESS' | 'QC_PENDING' | 'COMPLETED' | 'CANCELLED' | 'ENTERED' | 'RESULT_APPROVED';
// Full backend ResultStatus enum
export type ResultStatus = 'DRAFT' | 'VERIFIED' | 'REPORTED' | 'ENTERED' | 'APPROVED';

export interface ProcessingJob {
  id:           number;
  sampleId:     number;
  testId:       number;
  status:       JobStatus;
  startedAt?:   string;
  completedAt?: string;
  createdAt:    string;
  updatedAt?:   string;
}

// Matches backend ResultResponse DTO exactly — no enteredBy field in backend
export interface LabResult {
  sampleId:  number;
  testId:    number;
  result:    string;
  enteredAt: string;
  status:    ResultStatus;
}

// Matches backend EnterResultRequest DTO
export interface EnterResultRequest {
  testId:    number;
  result:    string;
  enteredBy: number;  // backend derives from JWT; 0 is a safe placeholder
}
