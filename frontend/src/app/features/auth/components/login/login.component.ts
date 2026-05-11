import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 0) {
      // Network error: connection refused, CORS blocked, offline, etc.
      // err.error is a ProgressEvent here -- never display it directly.
      return 'Cannot reach the server. Make sure the backend services are running.';
    }
    const body = err.error;
    // Plain string body
    if (typeof body === 'string' && body.length) return body;
    if (body && typeof body === 'object') {
      // { message: "..." }  — Spring standard
      if (typeof body.message === 'string' && body.message) return body.message;
      // { error: "User not found" }  — MedLab GlobalExceptionHandler (RuntimeException)
      if (typeof body.error === 'string' && body.error) return body.error;
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
    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.error = this.extractError(err, 'Login failed. Please check your credentials.');
        this.loading = false;
      }
    });
  }
}
