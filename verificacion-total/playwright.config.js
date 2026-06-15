import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './suites',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../tests/test-results/verificacion-total' }],
    ['json', { outputFolder: './reports', outputFile: 'playwright-report.json' }],
  ],
  use: {
    baseURL: `file://${process.cwd()}/`,
    headless: true,
    viewport: { width: 800, height: 600 },
    actionTimeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
