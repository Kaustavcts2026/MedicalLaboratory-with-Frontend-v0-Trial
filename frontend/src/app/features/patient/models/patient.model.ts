export interface Patient {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  email: string;
  phoneNumber: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientRequest {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  email: string;
  address: string;
}
