import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_KEY = 'medlab_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkSubject = new BehaviorSubject<boolean>(this.loadPreference());
  isDark$ = this.darkSubject.asObservable();

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  /** Transition duration in ms — must match the CSS value below. */
  private static readonly TRANSITION_MS = 500;

  toggle(): void {
    const next = !this.darkSubject.value;
    // Mark body so the CSS transition rule engages for every element.
    document.body.classList.add('theme-transitioning');
    this.darkSubject.next(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    this.applyToBody(next);
    // Remove the marker once the transition has finished.
    setTimeout(
      () => document.body.classList.remove('theme-transitioning'),
      ThemeService.TRANSITION_MS + 50  // small buffer so the last frame finishes
    );
  }

  applyToBody(dark: boolean): void {
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  init(): void {
    this.applyToBody(this.darkSubject.value);
  }

  private loadPreference(): boolean {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
