import { defineConfig } from '@playwright/test';

// Plays the built site (npm run build first) in Chromium.
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.ts',
  timeout: 60_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    env: { PORT: '4173' },
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
