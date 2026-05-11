export type OrderPriority = 'ROUTINE' | 'STAT';
export type OrderStatus   = 'CREATED' | 'SAMPLE_COLLECTED' | 'CANCELLED';

export interface Order {
  id:          number;
  orderNumber: string;
  status:      string;
  priority:    string;
  patientId?:  number;
  createdAt?:  string;
}

export interface OrderDetail {
  orderId:   number;
  patientId: number;
  testIds:   number[];
  sampleId:  number;
}

export interface CreateOrderRequest {
  requestedBy: number;
  tests:        number[];
  priority:     OrderPriority;
}

export interface LabTest {
  id:               number;
  code:             string;
  name:             string;
  price:            number;
  turnaroundHours:  number;
  description:      string;
}
