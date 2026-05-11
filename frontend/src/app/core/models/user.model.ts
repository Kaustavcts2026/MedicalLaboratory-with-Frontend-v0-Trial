export type UserRole = 'ADMIN' | 'PATIENT' | 'LAB_TECH';

export interface AuthUser {
  username: string;
  role: UserRole;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface CreateLabTechRequest {
  username: string;
  password: string;
}

export interface UserListItem {
  id: number;
  username: string;
  role: UserRole;
}
