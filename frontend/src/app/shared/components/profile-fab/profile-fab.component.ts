import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-fab',
  templateUrl: './profile-fab.component.html',
  styleUrls: ['./profile-fab.component.scss']
})
export class ProfileFabComponent implements OnInit, OnDestroy {
  role: string | null = null;
  username: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => {
      this.role = u?.role ?? null;
      this.username = u?.username ?? null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  viewProfile(): void { this.router.navigate(['/patient/profile']); }
  editProfile(): void { this.router.navigate(['/patient/profile'], { queryParams: { edit: true } }); }
  logout(): void { this.authService.logout(); }
}
