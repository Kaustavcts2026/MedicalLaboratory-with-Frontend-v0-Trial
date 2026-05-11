import { AbstractControl, ValidationErrors } from '@angular/forms';

const AGE_PATTERN = /^(?:[1-9][0-9]?|1[01][0-9]|120)$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const COMMON_DOMAIN_FIXES: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlook.con': 'outlook.com',
  'outlok.com': 'outlook.com'
};

export function patientAgeValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  return AGE_PATTERN.test(text) ? null : { patientAge: true };
}

export function patientEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim().toLowerCase();
  if (!value) return null;
  if (!EMAIL_PATTERN.test(value)) return { patientEmail: true };

  const domain = value.split('@')[1];
  if (!domain || !domain.includes('.')) return { patientEmail: true };
  if (COMMON_DOMAIN_FIXES[domain]) {
    return { emailDomainTypo: COMMON_DOMAIN_FIXES[domain] };
  }

  return null;
}
