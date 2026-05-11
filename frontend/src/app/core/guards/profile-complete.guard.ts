import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileCompleteGuard implements CanActivate {
  // Cached per session — cleared when the user identity changes
  private cachedUsername: string | null = null;
  private cachedResult: boolean | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) {
    // Auto-clear cache when the logged-in user changes (login/logout)
    this.auth.currentUser$.subscribe(u => {
      if (u?.username !== this.cachedUsername) {
        this.cachedUsername = null;
        this.cachedResult = null;
      }
    });
  }

  canActivate(): Observable<boolean> {
    if (this.auth.role !== 'PATIENT') return of(true);

    // Return cached result if the same user is still logged in
    if (this.cachedUsername === this.auth.username && this.cachedResult !== null) {
      return of(this.cachedResult);
    }

    return this.http.get(`${environment.apiBase}/patient/profile`, {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(() => true),
      catchError(err => {
        // 404 = no profile row yet
        // 403 = endpoint returns Forbidden when no patient record exists (backend variation)
        // 400 = no patient record (some backends return Bad Request)
        // All three mean "profile not set up" for a PATIENT — send to setup wizard.
        if (err.status === 404 || err.status === 403 || err.status === 400) {
          if (this.auth.role === 'PATIENT') {
            this.router.navigate(['/patient/setup']);
          } else {
            // Non-patient somehow hit this path — let through rather than loop.
            this.router.navigate(['/dashboard']);
          }
          return of(false);
        }
        // Any other error (network, 500, etc.) — allow through so the user isn't locked out.
        return of(true);
      }),
      tap(result => {
        this.cachedUsername = this.auth.username;
        this.cachedResult = result;
      })
    );
  }

  clearCache(): void {
    this.cachedUsername = null;
    this.cachedResult = null;
  }
}
