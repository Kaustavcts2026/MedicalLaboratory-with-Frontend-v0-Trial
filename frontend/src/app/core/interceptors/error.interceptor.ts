import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.headers.has('X-Skip-Error-Toast') && this.auth.isLoggedIn) {
          this.snackBar.open('Session expired. Please log in again.', 'OK', { duration: 5000, panelClass: 'snack-error' });
          this.auth.logout();
        } else if (req.headers.has('X-Skip-Error-Toast') || !this.auth.isLoggedIn) {
          // Silently swallow: caller opted out, OR user already logged out
          // (in-flight requests completing after logout should never show toasts)
        } else {
          let msg: string;
          if (err.status === 0) {
            // Network-level failure (connection refused, CORS block, offline).
            // err.error is a ProgressEvent in this case — never display it raw.
            msg = 'Cannot reach the server. Check that the backend is running.';
          } else {
            const body = err.error;
            // Plain string body
            if (typeof body === 'string' && body.length) {
              msg = body;
            } else if (body && typeof body === 'object') {
              // { message: "..." }  — Spring standard
              if (typeof body.message === 'string' && body.message) {
                msg = body.message;
              // { error: "User not found" }  — MedLab GlobalExceptionHandler (RuntimeException)
              } else if (typeof body.error === 'string' && body.error) {
                msg = body.error;
              } else {
                // { password: "Must be 8+ chars..." }  — bean-validation field error map
                const fieldMsgs = (Object.values(body) as unknown[]).filter((v): v is string => typeof v === 'string');
                msg = fieldMsgs.length ? fieldMsgs.join('. ') : (err.message ?? 'An unexpected error occurred.');
              }
            } else {
              msg = err.message ?? 'An unexpected error occurred.';
            }
          }
          // Cap length — Spring stack traces can be very long
          const display = msg.length > 200 ? msg.slice(0, 197) + '…' : msg;
          this.snackBar.open(display, 'Close', { duration: 4000, panelClass: 'snack-error' });
        }
        return throwError(() => err);
      })
    );
  }
}
