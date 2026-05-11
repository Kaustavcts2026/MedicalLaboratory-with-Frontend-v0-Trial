import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-create-lab-tech',
  templateUrl: './create-lab-tech.component.html',
  styleUrls: ['./create-lab-tech.component.scss']
})
export class CreateLabTechComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8),
                      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.adminService.createLabTech(this.form.value).subscribe({
      next: () => {
        this.snack.open('Lab technician created successfully!', 'Close', { duration: 4000 });
        this.router.navigate(['/admin']);
      },
      error: () => { this.loading = false; }
    });
  }
}
