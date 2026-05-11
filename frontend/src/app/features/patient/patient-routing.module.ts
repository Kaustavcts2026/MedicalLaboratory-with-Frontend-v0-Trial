import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileSetupComponent } from './components/profile-setup/profile-setup.component';
import { ProfileComponent } from './components/profile/profile.component';

const routes: Routes = [
  { path: 'setup',   component: ProfileSetupComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '',        redirectTo: 'profile', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientRoutingModule {}
