import { Component } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  template: `
    <div class="not-found">
      <mat-icon class="not-found-icon">search_off</mat-icon>
      <h1>404</h1>
      <p>Page not found.</p>
      <a mat-raised-button color="primary" routerLink="/dashboard">Go to Dashboard</a>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 60vh; gap: 12px; text-align: center;
    }
    .not-found-icon { font-size: 72px; width: 72px; height: 72px; color: #9e9e9e; }
    h1 { font-size: 4rem; margin: 0; color: #9e9e9e; }
    p { font-size: 1.125rem; color: #757575; margin: 0; }
  `]
})
export class PageNotFoundComponent {}
