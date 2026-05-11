export interface InventoryItem {
  id:                number;
  itemName:          string;
  quantity:          number;
  unit:              string;
  description:       string;
  lowStockThreshold: number;
  lowStock:          boolean;
}

export interface AdjustInventoryRequest {
  itemId:         number;
  quantityChange: number;
  reason:         string;
}

export interface AddInventoryItemRequest {
  itemName:          string;
  quantity:          number;
  unit:              string;
  description?:      string;
  lowStockThreshold?: number;
}

export interface LabTest {
  id:              number;
  code:            string;
  name:            string;
  price:           number;
  turnaroundHours: number;
  description:     string;
}

export interface LabTestRequest {
  code:            string;
  name:            string;
  price:           number;
  turnaroundHours: number;
  description:     string;
}
