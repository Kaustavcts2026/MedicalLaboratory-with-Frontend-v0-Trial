import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Patient, PatientRequest } from '../models/patient.model';

const SKIP_TOAST = new HttpHeaders({ 'X-Skip-Error-Toast': '1' });

@Injectable()
export class PatientService {
  private base = `${environment.apiBase}/patient`;

  constructor(private http: HttpClient) {}

  getProfile(silent = false): Observable<Patient> {
    return this.http.get<Patient>(`${this.base}/profile`, silent ? { headers: SKIP_TOAST } : {});
  }

  createProfile(req: PatientRequest): Observable<string> {
    return this.http.post(`${this.base}/addProfile`, req, { responseType: 'text' });
  }

  updateProfile(req: PatientRequest): Observable<string> {
    return this.http.put(`${this.base}/updateProfile`, req, { responseType: 'text' });
  }
}
