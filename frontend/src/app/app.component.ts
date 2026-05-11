import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  sidebarOpen = false;
  isLoggedIn$!: Observable<boolean>;
  showShell$!: Observable<boolean>;
  isNavigating = false;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.init();
    this.isLoggedIn$ = this.authService.currentUser$.pipe(map(u => !!u));

    // Only show the app shell (navbar + sidebar) when logged in AND the current
    // route is NOT under /auth. This prevents the navbar flashing over the login
    // page during the brief moment between token storage and navigation completing.
    const notOnAuth$ = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => !e.urlAfterRedirects.startsWith('/auth')),
      startWith(!this.router.url.startsWith('/auth'))
    );
    this.showShell$ = combineLatest([this.isLoggedIn$, notOnAuth$]).pipe(
      map(([loggedIn, notOnAuth]) => loggedIn && notOnAuth)
    );

    // Auth pages (login / register) are always light — dark theme only applies
    // when the user is authenticated. currentUser$ is a BehaviorSubject so this
    // fires synchronously on startup, overriding init() before the first paint.
    this.isLoggedIn$.subscribe(loggedIn => {
      this.themeService.applyToBody(loggedIn && this.themeService.isDark);
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating = false;
      }
    });
  }
}
