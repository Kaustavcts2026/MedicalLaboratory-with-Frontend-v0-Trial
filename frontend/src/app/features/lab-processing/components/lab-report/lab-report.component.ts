import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LabProcessingService } from '../../services/lab-processing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LabResult } from '../../models/job.model';

@Component({
  selector: 'app-lab-report',
  templateUrl: './lab-report.component.html',
  styleUrls: ['./lab-report.component.scss']
})
export class LabReportComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  result: LabResult | null = null;
  parsedResult: Record<string, string> | null = null;
  loading = true;
  downloading = false;
  sampleId!: number;
  username: string | null = null;
  generatedAt = new Date();

  constructor(
    private route: ActivatedRoute,
    public location: Location,
    private labService: LabProcessingService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.username = this.auth.username;
    this.sampleId = Number(this.route.snapshot.paramMap.get('sampleId')) || 0;
    if (this.sampleId > 0) {
      this.loadResult(this.sampleId);
    } else {
      this.loading = false;
    }
  }

  loadResult(sampleId: number): void {
    this.labService.getResultBySample(sampleId).subscribe({
      next: r => {
        this.result = r;
        this.tryParseResult(r.result);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private tryParseResult(raw: string): void {
    try {
      this.parsedResult = JSON.parse(raw);
    } catch {
      this.parsedResult = null;
    }
  }

  get resultEntries(): { key: string; value: string }[] {
    if (!this.parsedResult) return [];
    return Object.entries(this.parsedResult).map(([key, value]) => ({ key, value: String(value) }));
  }

  printReport(): void {
    window.print();
  }

  async downloadPdf(): Promise<void> {
    this.downloading = true;
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const element = this.reportContent.nativeElement as HTMLElement;
      element.classList.add('pdf-export');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      element.classList.remove('pdf-export');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const imgW   = pageW;
      const imgH   = (canvas.height * pageW) / canvas.width;

      // Multi-page: slice the canvas image across A4 pages
      let yOffset = 0;
      let pageIndex = 0;

      while (yOffset < imgH) {
        if (pageIndex > 0) pdf.addPage();
        // addImage with negative y shifts the image up on subsequent pages
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -yOffset, imgW, imgH);
        yOffset += pageH;
        pageIndex++;
      }

      const dateStr = this.generatedAt.toISOString().slice(0, 10).replace(/-/g, '');
      pdf.save(`LabReport_Sample${this.sampleId}_${dateStr}.pdf`);
    } finally {
      this.downloading = false;
    }
  }
}
