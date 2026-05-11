import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order, OrderDetail, CreateOrderRequest, LabTest } from '../models/order.model';

@Injectable()
export class OrderService {
  private base  = `${environment.apiBase}/orders`;
  private tests = `${environment.apiBase}/tests`;

  constructor(private http: HttpClient) {}

  getAvailableTests(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(this.tests);
  }

  placeOrder(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/addOrder`, req);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/viewOrderByPatientId`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/viewAllOrders`);
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.base}/viewOrder/${id}`);
  }

  getOrderDetail(id: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.base}/${id}/detail`);
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.post(`${this.base}/cancelOrder/${id}`, {});
  }

  collectSample(id: number, collectedBy: number): Observable<any> {
    return this.http.post(`${this.base}/collectSample/${id}`, null, {
      params: { collectedBy: String(collectedBy) }
    });
  }
}
