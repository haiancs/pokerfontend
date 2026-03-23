import { defineConfig, devices } from '@playwright/test';

const backendPort = Number(process.env.E2E_UI_BACKEND_PORT || 3901);
const frontendPort = Number(process.env.E2E_UI_FRONTEND_PORT || 5174);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const useExistingServer = process.env.E2E_UI_USE_EXISTING_SERVER === '1';

export default defineConfig({
  testDir: './tests/ui_e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 90 * 1000,
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],

  webServer: useExistingServer
    ? undefined
    : [
        {
          command: `python3 -m uvicorn main:app_asgi --host 127.0.0.1 --port ${backendPort} --app-dir ../pokerbackend`,
          url: `${backendUrl}/`,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
        {
          command: `VITE_API_URL=${backendUrl} npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
          url: frontendUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      ],
});
