import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8888',
    headless: true,
  },
  timeout: 60000,
});
