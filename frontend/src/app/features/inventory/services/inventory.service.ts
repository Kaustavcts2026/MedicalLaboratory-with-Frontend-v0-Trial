import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InventoryItem, AdjustInventoryRequest, AddInventoryItemRequest, LabTest, LabTestRequest } from '../models/inventory.model';

@Injectable()
export class InventoryService {
  private invBase  = `${environment.apiBase}/inventory`;
  private testBase = `${environment.apiBase}/tests`;

  constructor(private http: HttpClient) {}

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.invBase);
  }

  addInventoryItem(req: AddInventoryItemRequest): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.invBase, req);
  }

  adjustInventory(req: AdjustInventoryRequest): Observable<any> {
    return this.http.post(`${this.invBase}/adjust`, req);
  }

  getTests(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(this.testBase);
  }

  getTest(id: number): Observable<LabTest> {
    return this.http.get<LabTest>(`${this.testBase}/${id}`);
  }

  createTest(req: LabTestRequest): Observable<LabTest> {
    return this.http.post<LabTest>(this.testBase, req);
  }

  updateTest(id: number, req: LabTestRequest): Observable<LabTest> {
    return this.http.put<LabTest>(`${this.testBase}/${id}`, req);
  }
}
