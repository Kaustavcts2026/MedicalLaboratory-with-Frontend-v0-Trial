import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { COUNTRY_CODES } from '../profile-setup/profile-setup.component';
import { AddressMapPickerComponent } from '../address-map-picker/address-map-picker.component';
import { patientAgeValidator, patientEmailValidator } from '../../validators/patient-form.validators';

const NAME_PATTERN = /^[A-Za-z\s'-]+$/;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: Patient | null = null;
  form!: FormGroup;
  editMode = false;
  loading = true;
  saving = false;
  countryCodes = COUNTRY_CODES;
  avatarUrl: string | null = null;
  private savedAvatarUrl: string | null = null;
  private pendingAvatarUrl: string | null = null;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => { if (p['edit']) this.editMode = true; });
    this.loadProfile();
  }

  private avatarKey(): string {
    return `medlab_avatar_${this.profile?.username ?? 'user'}`;
  }

  private loadAvatar(): void {
    try { this.savedAvatarUrl = localStorage.getItem(this.avatarKey()); } catch { this.savedAvatarUrl = null; }
    this.avatarUrl = this.savedAvatarUrl;
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.pendingAvatarUrl = reader.result as string;
      this.avatarUrl = this.pendingAvatarUrl; // preview only — not saved yet
    };
    reader.readAsDataURL(file);
  }

  private loadProfile(): void {
    this.loading = true;
    this.patientService.getProfile().subscribe({
      next: p => {
        this.profile = p;
        this.buildForm(p);
        this.loadAvatar();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildForm(p: Patient): void {
    // Split stored phone into country code + digits if it starts with a known code
    const stored = p.phoneNumber ?? '';
    const matched = COUNTRY_CODES.find(c => stored.startsWith(c.code));
    const countryCode = matched ? matched.code : '+91';
    const digits = matched ? stored.slice(matched.code.length) : stored;

    this.form = this.fb.group({
      firstName:   [p.firstName ?? '', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      lastName:    [p.lastName  ?? '', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      age:         [p.age       ?? null, [Validators.required, patientAgeValidator]],
      gender:      [p.gender    ?? '', Validators.required],
      email:       [p.email     ?? '', [Validators.required, patientEmailValidator]],
      countryCode: [countryCode, Validators.required],
      phoneNumber: [digits, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address:     [p.address   ?? '', Validators.required]
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const { countryCode, phoneNumber, ...rest } = this.form.value;
    this.patientService.updateProfile({ ...rest, phoneNumber: `${countryCode}${phoneNumber}` }).subscribe({
      next: () => {
        if (this.pendingAvatarUrl) {
          try { localStorage.setItem(this.avatarKey(), this.pendingAvatarUrl); } catch {}
          this.savedAvatarUrl = this.pendingAvatarUrl;
          this.pendingAvatarUrl = null;
        } else if (!this.avatarUrl && !this.savedAvatarUrl) {
          try { localStorage.removeItem(this.avatarKey()); } catch {}
        }
        if (this.fileInput) this.fileInput.nativeElement.value = '';
        this.editMode = false;
        this.saving = false;
        this.snack.open('Profile updated successfully', 'Close', { duration: 3000 });
        this.loadProfile();
      },
      error: () => { this.saving = false; }
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

  removeAvatar(): void {
    this.pendingAvatarUrl = null;
    this.avatarUrl = null;
    this.savedAvatarUrl = null;
    try { localStorage.removeItem(this.avatarKey()); } catch {}
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  cancel(): void {
    this.pendingAvatarUrl = null;
    this.avatarUrl = this.savedAvatarUrl;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    if (this.profile) this.buildForm(this.profile);
    this.editMode = false;
  }
}
