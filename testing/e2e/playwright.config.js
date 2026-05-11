// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout:  30_000,
  retries:  0,
  workers:  1,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../playwright-report', open: 'never' }]
  ],
  use: {
    baseURL:           'http://localhost:4200',
    headless:          true,
    viewport:          { width: 1280, height: 800 },
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    ignoreHTTPSErrors: true,
    bypassCSP:         true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: '../../playwright-results',
});
