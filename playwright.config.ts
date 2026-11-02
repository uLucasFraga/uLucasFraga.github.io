import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Optional: PW_CHANNEL=chrome uses the locally installed Google Chrome.
    channel: process.env.PW_CHANNEL,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  // Skipped when BASE_URL points at the published site.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npx http-server . -p ${port} -c-1 --silent`,
        url: baseURL,
        reuseExistingServer: !isCI,
      },
});
