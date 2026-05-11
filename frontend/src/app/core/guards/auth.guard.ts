import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    // Re-check expiry on every route activation (covers expired sessions mid-use)
    if (this.auth.isTokenExpired()) {
      this.auth.logout();
      return false;
    }
    return true;
  }
}
