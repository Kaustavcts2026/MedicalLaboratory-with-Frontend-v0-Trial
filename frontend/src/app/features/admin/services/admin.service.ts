import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppUser, CreateLabTechRequest } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.base}/admin/users`);
  }

  createLabTech(payload: CreateLabTechRequest): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.base}/admin/create-lab-tech`, payload);
  }

  broadcast(message: string): Observable<string> {
    return this.http.post(`${this.base}/notification/broadcast`, { message }, { responseType: 'text' });
  }
}
