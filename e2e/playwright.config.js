// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout:  30_000,          // 30 s per test
  retries:  0,               // no auto-retry in CI-style run
  workers:  1,               // sequential -- Angular + 10 services on same machine
  reporter: [
    ['list'],                // live PASS/FAIL output
    ['html', { outputFolder: '../playwright-report', open: 'never' }]
  ],
  use: {
    baseURL:            'http://localhost:4200',
    headless:           true,
    viewport:           { width: 1280, height: 800 },
    screenshot:         'only-on-failure',   // saved to test-results/
    video:              'retain-on-failure',
    ignoreHTTPSErrors:  true,
    // Capture browser console errors so tests can assert on them
    bypassCSP:          true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // HTML report output
  outputDir: '../playwright-results',
});
