import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results' }],
  ],
  use: {
    baseURL: `file://${process.cwd()}/`,
    headless: true,
    viewport: { width: 800, height: 600 },
    actionTimeout: 5000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
