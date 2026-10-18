import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev:frontend', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
});
