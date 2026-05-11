import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-test-form',
  templateUrl: './test-form.component.html',
  styleUrls: ['./test-form.component.scss']
})
export class TestFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  testId!: number;
  loading = false;
  fetching = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private invService: InventoryService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code:            ['', Validators.required],
      name:            ['', Validators.required],
      price:           [null, [Validators.required, Validators.min(0)]],
      turnaroundHours: [null, [Validators.required, Validators.min(1)]],
      description:     ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.testId = Number(id);
      this.fetching = true;
      this.invService.getTest(this.testId).subscribe({
        next: t => { this.form.patchValue(t); this.fetching = false; },
        error: () => { this.fetching = false; }
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const req$ = this.isEdit
      ? this.invService.updateTest(this.testId, this.form.value)
      : this.invService.createTest(this.form.value);
    req$.subscribe({
      next: () => this.router.navigate(['/inventory/tests']),
      error: () => { this.loading = false; }
    });
  }
}
