import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles: UserRole[] = route.data['roles'];
    const userRole = this.auth.role;

    if (!userRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles && !allowedRoles.includes(userRole as UserRole)) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
