import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
    });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 0) {
      return 'Cannot reach the server. Make sure the backend services are running.';
    }
    const body = err.error;
    // Plain string body
    if (typeof body === 'string' && body.length) return body;
    if (body && typeof body === 'object') {
      // { message: "..." }  — Spring standard
      if (typeof body.message === 'string' && body.message) return body.message;
      // { error: "User not found" }  — MedLab GlobalExceptionHandler (RuntimeException)
      if (typeof body.error === 'string' && body.error) {
        // Clean up common error messages for display
        const errorMsg = body.error.toLowerCase();
        if (errorMsg.includes('username') && errorMsg.includes('already')) {
          return 'Username is already taken. Please choose a different username.';
        }
        return body.error;
      }
      // { password: "Must be 8+ chars..." }  — bean-validation field error map
      const fieldMsgs = Object.values(body).filter((v): v is string => typeof v === 'string');
      if (fieldMsgs.length) return fieldMsgs.join('. ');
    }
    if (err.message) return err.message;
    return fallback;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.register(this.form.value).subscribe({
      next: () => {
        this.success = 'Account created! Redirecting to login…';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: err => {
        this.error = this.extractError(err, 'Registration failed. Username may already exist.');
        this.loading = false;
      }
    });
  }
}
