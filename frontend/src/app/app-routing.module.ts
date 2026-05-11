import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { ProfileCompleteGuard } from './core/guards/profile-complete.guard';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Auth (public) ──────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard, ProfileCompleteGuard]
  },

  // ── Patient ───────────────────────────────────────────────────────────────
  {
    path: 'patient',
    loadChildren: () => import('./features/patient/patient.module').then(m => m.PatientModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PATIENT'] }
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    path: 'orders',
    loadChildren: () => import('./features/order/order.module').then(m => m.OrderModule),
    canActivate: [AuthGuard, RoleGuard, ProfileCompleteGuard],
    data: { roles: ['ADMIN', 'PATIENT'] }
  },

  // ── Lab Processing ────────────────────────────────────────────────────────
  // Parent allows all authenticated roles; child routes have their own RoleGuard.
  // PATIENT needs access to /lab/results and /lab/report/:sampleId.
  {
    path: 'lab',
    loadChildren: () => import('./features/lab-processing/lab-processing.module').then(m => m.LabProcessingModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'LAB_TECH', 'PATIENT'] }
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  {
    path: 'inventory',
    loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'LAB_TECH'] }
  },

  // ── Billing ───────────────────────────────────────────────────────────────
  {
    path: 'billing',
    loadChildren: () => import('./features/billing/billing.module').then(m => m.BillingModule),
    canActivate: [AuthGuard, ProfileCompleteGuard]
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  {
    path: 'notifications',
    loadChildren: () => import('./features/notification/notification.module').then(m => m.NotificationModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PATIENT'] }
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
