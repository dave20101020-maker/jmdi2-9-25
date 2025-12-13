import { defineConfig, devices } from "@playwright/test";

const IS_CI = !!process.env.CI;
const DEV_SERVER_PORT = process.env.PLAYWRIGHT_PORT || 5173;
const DEV_SERVER_HOST = process.env.PLAYWRIGHT_HOST || "127.0.0.1";
const BASE_URL =
  process.env.BASE_URL || `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: 2,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    headless: IS_CI,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${DEV_SERVER_HOST} --port ${DEV_SERVER_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 180 * 1000,
  },
});
