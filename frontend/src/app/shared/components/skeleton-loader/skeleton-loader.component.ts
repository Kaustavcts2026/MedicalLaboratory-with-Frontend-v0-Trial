import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
  @Input() type: 'table' | 'card' | 'list' = 'table';
  @Input() rows = 6;
  @Input() cols = 5;

  get rowArray(): number[] { return Array(this.rows).fill(0); }
  get colArray(): number[] { return Array(this.cols).fill(0); }
}
