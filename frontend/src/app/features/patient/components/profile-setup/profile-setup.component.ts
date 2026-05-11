import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PatientService } from '../../services/patient.service';
import { AddressMapPickerComponent } from '../address-map-picker/address-map-picker.component';
import { patientAgeValidator, patientEmailValidator } from '../../validators/patient-form.validators';

const NAME_PATTERN = /^[A-Za-z\s'-]+$/;

export const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
];

@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.component.html',
  styleUrls: ['./profile-setup.component.scss']
})
export class ProfileSetupComponent implements OnInit {
  form: FormGroup;
  loading = false;
  checking = true;
  countryCodes = COUNTRY_CODES;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      firstName:   ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      middleName:  ['', [Validators.pattern(NAME_PATTERN)]],
      lastName:    ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      age:         [null, [Validators.required, patientAgeValidator]],
      gender:      ['', Validators.required],
      email:       ['', [Validators.required, patientEmailValidator]],
      countryCode: ['+91', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address:     ['', Validators.required]
    });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
    this.form.get('phoneNumber')!.setValue(input.value, { emitEvent: false });
  }

  onAgeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 3);
    this.form.get('age')!.setValue(input.value, { emitEvent: false });
  }

  get fullPhone(): string {
    const cc = this.form.get('countryCode')?.value ?? '+91';
    const num = this.form.get('phoneNumber')?.value ?? '';
    return num ? `${cc}${num}` : '';
  }

  ngOnInit(): void {
    // If the patient already has a profile (e.g., browser back after setup),
    // redirect to the profile page instead of allowing a duplicate POST.
    this.patientService.getProfile(true).subscribe({
      next: () => this.router.navigate(['/patient/profile'], { replaceUrl: true }),
      error: () => { this.checking = false; }
    });
  }

  openMapPicker(): void {
    const ref = this.dialog.open(AddressMapPickerComponent, {
      data: this.form.get('address')?.value ?? '',
      maxWidth: '700px',
      width: '95vw'
    });
    ref.afterClosed().subscribe((address: string | null) => {
      if (address) this.form.get('address')!.setValue(address);
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { countryCode, phoneNumber, middleName, firstName, ...rest } = this.form.value;
    const fullFirstName = middleName?.trim() ? `${firstName} ${middleName.trim()}` : firstName;
    this.patientService.createProfile({ ...rest, firstName: fullFirstName, phoneNumber: `${countryCode}${phoneNumber}` }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.loading = false; }
    });
  }
}
