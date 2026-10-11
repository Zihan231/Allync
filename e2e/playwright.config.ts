import { defineConfig, devices } from "@playwright/test";
import { API_URL, APP_URL, BACKEND_DIR, FRONTEND_DIR } from "./lib/env";

/**
 * End-to-end tests for Allynq: the NestJS API (port 3001) and the Next.js app (port 3000),
 * run against the dev database with throwaway `e2e+…@allynq.test` users.
 *
 * Order: `setup` builds the cast (every role) → `api` and `ui` suites → `teardown` cleans up.
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Money, transfers and loans share clubs and wallets: one worker keeps the numbers exact.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: APP_URL,
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/, teardown: "teardown" },
    { name: "teardown", testMatch: /global\.teardown\.ts/ },
    { name: "api", testMatch: /api\/.*\.spec\.ts/, dependencies: ["setup"] },
    {
      name: "ui",
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ["setup", "api"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "ui-mobile",
      testMatch: /ui\/smoke\.spec\.ts/,
      dependencies: ["setup", "ui"],
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: [
    {
      command: "npm run start:dev",
      cwd: BACKEND_DIR,
      url: `${API_URL}/health`,
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm run dev",
      cwd: FRONTEND_DIR,
      url: `${APP_URL}/login`,
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
