import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests (black-box + DOM/ARIA white-box checks).
 *   npm run test:e2e:install   (once – downloads Chromium)
 *   npm run test:e2e           (starts `next dev` automatically with mock data)
 * Set E2E_BASE_URL to test a deployed environment (staging) instead.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000, env: { ISGH_USE_MOCK_API: 'true' } },
});
