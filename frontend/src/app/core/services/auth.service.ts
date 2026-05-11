import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

const TOKEN_KEY = 'medlab_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBase}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  get role(): string | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  get username(): string | null {
    return this.currentUserSubject.value?.username ?? null;
  }

  get token(): string | null {
    return this.currentUserSubject.value?.token ?? null;
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req).pipe(
      tap(res => this.storeToken(res.token))
    );
  }

  register(req: RegisterRequest): Observable<string> {
    return this.http.post(`${this.base}/register`, req, { responseType: 'text' });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    const user = this.decodeToken(token);
    this.currentUserSubject.next(user);
  }

  private loadFromStorage(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const user = this.decodeToken(token);
      if (this.isTokenExpired(token)) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return user;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }

  private decodeToken(token: string): AuthUser {
    // JWT uses base64url (- and _ instead of + and /), atob needs standard base64 with padding
    let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (!payload.role) throw new Error('JWT missing role claim');
    return { username: payload.sub, role: payload.role, token };
  }

  isTokenExpired(token?: string): boolean {
    const t = token ?? this.currentUserSubject.value?.token;
    if (!t) return true;
    try {
      let b64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const payload = JSON.parse(atob(b64));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
