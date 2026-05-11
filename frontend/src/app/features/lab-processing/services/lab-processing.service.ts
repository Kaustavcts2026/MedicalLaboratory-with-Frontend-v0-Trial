import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProcessingJob, EnterResultRequest, LabResult } from '../models/job.model';
import { LabTest } from '../../order/models/order.model';

@Injectable()
export class LabProcessingService {
  private base = `${environment.apiBase}/api/jobs`;

  constructor(private http: HttpClient) {}

  getAllJobs(): Observable<ProcessingJob[]> {
    return this.http.get<ProcessingJob[]>(this.base);
  }

  startJob(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/start`, {});
  }

  markQC(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/qc`, {});
  }

  completeJob(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/complete`, {});
  }

  cancelJob(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/cancel`, {});
  }

  enterResult(sampleId: number, req: EnterResultRequest): Observable<any> {
    // Backend expects { testId, result, enteredBy } — all three fields required
    return this.http.post(`${this.base}/processing/${sampleId}/result`, req);
  }

  approveResult(sampleId: number, testId: number): Observable<any> {
    return this.http.put(`${this.base}/processing/${sampleId}/approve`, {}, {
      params: { testId: testId.toString() },
      responseType: 'text' as 'json'
    });
  }

  getResultBySample(sampleId: number): Observable<LabResult> {
    return this.http.get<LabResult>(`${this.base}/results/by-sample/${sampleId}`);
  }

  getLabTests(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${environment.apiBase}/tests`, {
      headers: { 'X-Skip-Error-Toast': 'true' }
    }).pipe(catchError(() => of([])));
  }
}
