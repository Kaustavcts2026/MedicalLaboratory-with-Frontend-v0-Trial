// @ts-check
/**
 * MedLab Angular Frontend -- End-to-End Tests
 *
 * Tests three user roles across 6 categories:
 *   PUB  -- Public pages (no login required)
 *   AUTH -- Authentication flows
 *   ADMIN -- Admin role pages & actions
 *   LAB  -- Lab Technician role pages
 *   PAT  -- Patient role pages
 *   VIS  -- Visual / runtime sanity (console errors, layout)
 *
 * Credentials (must exist in the running backend):
 *   admin@lab.com   / Admin123       role=ADMIN
 *   labtech@lab.com / Technician123  role=LAB_TECH
 *   patient@lab.com / Patient123     role=PATIENT
 *
 * Run:  npx playwright test  (from the testing/e2e/ directory)
 */

const { test, expect } = require('@playwright/test');

// ── Shared credentials ────────────────────────────────────────────────────────
const ADMIN   = { user: 'admin@lab.com',   pass: 'Admin123' };
const LABTECH = { user: 'labtech@lab.com', pass: 'Technician123' };
const PATIENT = { user: 'patient@lab.com', pass: 'Patient123' };

// ── Helper: collect console errors during a page session ─────────────────────
function watchConsole(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

// ── Helper: login and wait for redirect away from /auth ───────────────────────
async function login(page, creds) {
  await page.goto('/auth/login');
  await page.waitForSelector('app-login', { timeout: 15_000 });
  await page.fill('input[formControlName="username"]', creds.user);
  await page.fill('input[formControlName="password"]', creds.pass);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/auth'),
    { timeout: 15_000 }
  );
}

// ── Helper: logout (clears localStorage, goes to login) ──────────────────────
async function logout(page) {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/auth/login');
  await page.waitForSelector('app-login', { timeout: 10_000 });
}

// =============================================================================
//  PUB -- Public pages (no token required)
// =============================================================================

test.describe('PUB -- Public pages', () => {

  test('PUB-1  Login page renders correctly', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });

    const heading = await page.textContent('h1, h2, mat-card-title, .login-title');
    expect(heading?.toLowerCase()).toMatch(/login|sign in|medlab/i);

    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR_')
    );
    expect(criticalErrors, `Console errors: ${criticalErrors.join(' | ')}`).toHaveLength(0);
  });

  test('PUB-2  Register page renders correctly', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForSelector('app-register', { timeout: 15_000 });

    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('PUB-3  Unknown route shows 404 / not-found page', async ({ page }) => {
    await page.goto('/this/route/does/not/exist');
    const url  = page.url();
    const body = await page.content();
    const is404   = body.toLowerCase().includes('not found') ||
                    body.toLowerCase().includes('404');
    const isLogin = url.includes('/auth/login');
    expect(is404 || isLogin,
      'Expected 404 component or redirect to login for unknown route'
    ).toBe(true);
  });

  test('PUB-4  /dashboard redirects unauthenticated users to /auth/login', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard');
    await page.waitForURL('**/auth/login', { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('PUB-5  /admin redirects unauthenticated users to /auth/login', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/admin');
    await page.waitForURL('**/auth/login', { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

});

// =============================================================================
//  AUTH -- Authentication flows
// =============================================================================

test.describe('AUTH -- Authentication flows', () => {

  test('AUTH-1  Wrong password shows error message (no crash)', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });

    await page.fill('input[formControlName="username"]', ADMIN.user);
    await page.fill('input[formControlName="password"]', 'WRONGPASSWORD');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/auth/login');
    const errorVisible =
      await page.locator('mat-error, .error-message, [class*="error"]').count() > 0 ||
      await page.locator('text=/invalid|incorrect|wrong|failed|unauthorized/i').count() > 0;
    expect(errorVisible, 'Expected an error message after wrong password').toBe(true);

    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS exceptions: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('AUTH-2  Empty form submission shows validation errors', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/auth/login');
    const errors = await page.locator('mat-error').count();
    expect(errors, 'Expected at least one mat-error for empty form').toBeGreaterThan(0);
  });

  test('AUTH-3  Admin login succeeds and lands on dashboard', async ({ page }) => {
    const consoleErrors = watchConsole(page);
    await login(page, ADMIN);

    const url = page.url();
    expect(url).toMatch(/dashboard|profile|patient/i);

    const token = await page.evaluate(() =>
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('token')
    );
    expect(token, 'JWT must be stored in localStorage after login').toBeTruthy();

    const jsExceptions = consoleErrors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsExceptions, `JS exceptions: ${jsExceptions.join(' | ')}`).toHaveLength(0);
  });

  test('AUTH-4  Lab Tech login succeeds', async ({ page }) => {
    await login(page, LABTECH);
    expect(page.url()).toMatch(/dashboard|profile|patient/i);
  });

  test('AUTH-5  Patient login succeeds', async ({ page }) => {
    await login(page, PATIENT);
    expect(page.url()).toMatch(/dashboard|profile|patient/i);
  });

  test('AUTH-6  Logout clears token and redirects to login', async ({ page }) => {
    await login(page, ADMIN);
    const logoutBtn = page.locator(
      'button:has-text("Logout"), a:has-text("Logout"), [aria-label="Logout"], button:has-text("Sign out"), mat-icon:has-text("logout")'
    ).first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
    } else {
      await page.evaluate(() => localStorage.clear());
      await page.goto('/auth/login');
    }
    await page.waitForURL('**/auth/login', { timeout: 10_000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token, 'Token should be cleared after logout').toBeFalsy();
  });

});

// =============================================================================
//  ADMIN -- Admin role pages
// =============================================================================

test.describe('ADMIN -- Admin pages', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('ADMIN-1  Dashboard renders stats/cards without JS errors', async ({ page }) => {
    const errors = watchConsole(page);
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
      await page.waitForSelector('app-dashboard', { timeout: 15_000 });
    }
    const hasCards = await page.locator('mat-card, .stat-card, .dashboard-card, [class*="card"]').count() > 0;
    expect(hasCards, 'Dashboard should show at least one card/stat').toBe(true);

    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError') || e.includes('ERROR'));
    expect(jsErrors, `JS errors on dashboard: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('ADMIN-2  Sidenav / navigation is visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('app-dashboard', { timeout: 15_000 });
    const navVisible = await page.locator('mat-sidenav, mat-nav-list, nav, [role="navigation"]').count() > 0;
    expect(navVisible, 'Navigation menu should be visible after login').toBe(true);
  });

  test('ADMIN-3  /admin page renders user list', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/admin');
    await page.waitForSelector('app-user-list', { timeout: 15_000 });
    const hasTable = await page.locator('mat-table, table, mat-list, [role="table"]').count() > 0;
    expect(hasTable, '/admin should render a user table or list').toBe(true);

    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors on /admin: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('ADMIN-4  /admin/create-lab-tech form renders correctly', async ({ page }) => {
    await page.goto('/admin/create-lab-tech');
    await page.waitForSelector('app-create-lab-tech', { timeout: 15_000 });
    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('ADMIN-5  /admin/create-lab-tech empty form shows validation errors', async ({ page }) => {
    await page.goto('/admin/create-lab-tech');
    await page.waitForSelector('app-create-lab-tech', { timeout: 15_000 });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    const errors = await page.locator('mat-error').count();
    expect(errors, 'Should show validation errors on empty submit').toBeGreaterThan(0);
  });

  test('ADMIN-6  /inventory page renders test catalog', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/inventory');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('mat-table, table, mat-card, mat-list-item').count() > 0;
    expect(hasContent, '/inventory should render test catalog items').toBe(true);

    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('ADMIN-7  /orders page renders order list', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/orders');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('mat-table, table, mat-list, [class*="empty"], [class*="no-data"]').count() > 0;
    expect(hasContent, '/orders should render some content (table or empty state)').toBe(true);

    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('ADMIN-8  /billing page renders invoice list', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/billing');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('mat-table, table, mat-card, [class*="empty"]').count() > 0;
    expect(hasContent, '/billing should render content').toBe(true);

    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('ADMIN-9  /lab page renders lab processing view', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/lab');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors on /lab: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('ADMIN-10  PATIENT-only pages do not crash for ADMIN', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    const body = await page.content();
    expect(body).not.toContain('ERROR TypeError');
  });

});

// =============================================================================
//  LAB -- Lab Technician role pages
// =============================================================================

test.describe('LAB -- Lab Technician pages', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, LABTECH);
  });

  test('LAB-1  Dashboard renders after lab tech login', async ({ page }) => {
    const errors = watchConsole(page);
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
      await page.waitForSelector('app-dashboard', { timeout: 15_000 });
    }
    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('LAB-2  /lab page renders for lab tech', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/lab');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors on /lab: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('LAB-3  /admin page is blocked for lab tech', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const hasAdminContent = await page.locator('app-user-list').count() > 0;
    expect(hasAdminContent, 'Lab tech should NOT see the admin user list').toBe(false);
  });

});

// =============================================================================
//  PAT -- Patient role pages
// =============================================================================

test.describe('PAT -- Patient pages', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, PATIENT);
  });

  test('PAT-1  Dashboard renders after patient login (or profile prompt)', async ({ page }) => {
    const errors = watchConsole(page);
    expect(page.url()).toMatch(/dashboard|profile|patient/i);
    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('PAT-2  /notifications page renders for patient', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/notifications');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('PAT-3  /orders page renders for patient', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/orders');
    await page.waitForSelector('app-root', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const jsErrors = errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
    expect(jsErrors, `JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('PAT-4  /admin page is blocked for patient', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const hasAdminContent = await page.locator('app-user-list').count() > 0;
    expect(hasAdminContent, 'Patient should NOT see the admin user list').toBe(false);
  });

});

// =============================================================================
//  VIS -- Visual / runtime sanity
// =============================================================================

test.describe('VIS -- Visual and runtime sanity', () => {

  test('VIS-1  Login page: mat-form-field has non-zero dimensions', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });
    const formField = page.locator('mat-form-field').first();
    if (await formField.count() > 0) {
      const box = await formField.boundingBox();
      expect(box?.width,  'mat-form-field width should be > 50px').toBeGreaterThan(50);
      expect(box?.height, 'mat-form-field height should be > 20px').toBeGreaterThan(20);
    }
    const btnBox = await page.locator('button[type="submit"]').boundingBox();
    expect(btnBox?.width, 'Submit button should be visible').toBeGreaterThan(0);
  });

  test('VIS-2  Login page has no horizontal overflow (no scrollbar)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow, 'Login page should not have a horizontal scrollbar').toBe(false);
  });

  test('VIS-3  Dashboard (admin) has no horizontal overflow', async ({ page }) => {
    await login(page, ADMIN);
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
      await page.waitForSelector('app-dashboard', { timeout: 15_000 });
    }
    await page.waitForTimeout(1000);
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow, 'Dashboard should not have horizontal scrollbar').toBe(false);
  });

  test('VIS-4  Mobile viewport (375px) -- login page not broken', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
    );
    expect(hasOverflow, 'Login page should not overflow on 375px mobile viewport').toBe(false);
  });

  test('VIS-5  No uncaught JS errors across all admin pages', async ({ page }) => {
    const errors = watchConsole(page);
    await login(page, ADMIN);
    for (const route of ['/dashboard', '/orders', '/billing', '/inventory', '/lab', '/admin']) {
      await page.goto(route);
      await page.waitForSelector('app-root', { timeout: 15_000 });
      await page.waitForTimeout(1500);
    }
    const criticalErrors = errors.filter(e =>
      (e.includes('Uncaught') || e.includes('TypeError') || e.includes('is not a function')) &&
      !e.includes('favicon')
    );
    expect(criticalErrors, `Uncaught JS errors:\n${criticalErrors.join('\n')}`).toHaveLength(0);
  });

  test('VIS-6  Page title is not blank', async ({ page }) => {
    await page.goto('/auth/login');
    const title = await page.title();
    expect(title.trim().length, 'Page title should not be blank').toBeGreaterThan(0);
  });

  test('VIS-7  Angular Material toolbar has non-zero height on dashboard', async ({ page }) => {
    await login(page, ADMIN);
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
      await page.waitForSelector('app-dashboard', { timeout: 15_000 });
    }
    const toolbar = page.locator('mat-toolbar').first();
    if (await toolbar.count() > 0) {
      const box = await toolbar.boundingBox();
      expect(box?.height, 'Toolbar should have a non-zero height').toBeGreaterThan(10);
    }
  });

  test('VIS-8  No broken images on login page', async ({ page }) => {
    const brokenImages = [];
    page.on('response', res => {
      if (res.request().resourceType() === 'image' && !res.ok()) {
        brokenImages.push(res.url());
      }
    });
    await page.goto('/auth/login');
    await page.waitForSelector('app-login', { timeout: 15_000 });
    expect(brokenImages, `Broken images: ${brokenImages.join(', ')}`).toHaveLength(0);
  });

  test('VIS-9  API calls from browser reach gateway (no 5xx on dashboard)', async ({ page }) => {
    const apiErrors = [];
    page.on('response', res => {
      if (res.url().includes('localhost:8090') && res.status() >= 500) {
        apiErrors.push(`${res.status()} ${res.url()}`);
      }
    });
    await login(page, ADMIN);
    await page.goto('/dashboard');
    await page.waitForSelector('app-dashboard', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    expect(apiErrors, `API 5xx errors from browser: ${apiErrors.join(', ')}`).toHaveLength(0);
  });

  test('VIS-10  Register form -- mismatched passwords show validation error', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForSelector('app-register', { timeout: 15_000 });
    await page.fill('input[formControlName="username"]', 'test@example.com');
    await page.fill('input[formControlName="password"]', 'Password1!');
    const confirmInput = page.locator('input[formControlName="confirmPassword"]');
    if (await confirmInput.count() > 0) {
      await confirmInput.fill('DifferentPass99!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
      const errors = await page.locator('mat-error').count();
      expect(errors, 'Should show error for mismatched passwords').toBeGreaterThan(0);
    }
  });

});
