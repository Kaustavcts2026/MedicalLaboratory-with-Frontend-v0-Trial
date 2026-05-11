import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LabProcessingService } from '../../services/lab-processing.service';

@Component({
  selector: 'app-result-entry',
  templateUrl: './result-entry.component.html',
  styleUrls: ['./result-entry.component.scss']
})
export class ResultEntryComponent implements OnInit {
  form!: FormGroup;
  sampleId!: number;
  testId = 0;
  testName = '';
  loading = false;
  badTestId = false;
  resultFields: { key: string; value: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private labService: LabProcessingService
  ) {}

  ngOnInit(): void {
    this.sampleId = Number(this.route.snapshot.paramMap.get('sampleId'));
    const nav = this.router.getCurrentNavigation()?.extras?.state;
    const stateTestId = (nav?.['testId'] as number) ?? 0;
    const queryTestId = Number(this.route.snapshot.queryParamMap.get('testId')) ?? 0;
    this.testId = stateTestId || queryTestId;

    if (this.testId === 0) {
      this.badTestId = true;
      return;
    }

    this.form = this.fb.group({
      result: ['']
    });

    this.addField();

    this.labService.getLabTests().subscribe({
      next: tests => {
        const found = tests.find(t => t.id === this.testId);
        this.testName = found ? found.name : `Test #${this.testId}`;
      }
    });
  }

  get hasValidField(): boolean {
    return this.resultFields.some(f => f.key.trim().length > 0 && f.value.trim().length > 0);
  }

  addField(): void {
    this.resultFields.push({ key: '', value: '' });
  }

  removeField(index: number): void {
    this.resultFields.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  submit(): void {
    const validFields = this.resultFields.filter(f => f.key.trim() && f.value.trim());
    if (validFields.length === 0) return;

    const json: Record<string, string> = {};
    validFields.forEach(f => json[f.key.trim()] = f.value.trim());

    this.loading = true;
    this.labService.enterResult(this.sampleId, {
      testId:    this.testId,
      result:    JSON.stringify(json),
      enteredBy: 0
    }).subscribe({
      next: () => this.router.navigate(['/lab']),
      error: () => { this.loading = false; }
    });
  }
}
