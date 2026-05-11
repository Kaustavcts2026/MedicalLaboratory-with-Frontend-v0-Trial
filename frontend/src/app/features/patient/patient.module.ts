import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { PatientRoutingModule } from './patient-routing.module';
import { PatientService } from './services/patient.service';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileSetupComponent } from './components/profile-setup/profile-setup.component';
import { AddressMapPickerComponent } from './components/address-map-picker/address-map-picker.component';

@NgModule({
  declarations: [ProfileComponent, ProfileSetupComponent, AddressMapPickerComponent],
  imports: [SharedModule, PatientRoutingModule],
  providers: [PatientService]
})
export class PatientModule {}
