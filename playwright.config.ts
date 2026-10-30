import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'msedge', headless: true },
  webServer: {
    // Native .env loading preserves existing environment values, including empty.
    // Browser checks must never reach the real provider if a timer test fails.
    command: 'npm run dev', url: 'http://127.0.0.1:5174/api/health', env: { STYLER_PORT: '5174', GEMINI_API_KEY: '' },
    reuseExistingServer: false, timeout: 30_000,
  },
});
