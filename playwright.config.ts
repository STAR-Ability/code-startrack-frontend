import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  // Gateway and UI tests deliberately share/reset one isolated upstream log.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testIgnore: /gateway\.spec\.ts/,
    },
  ],
  webServer: {
    command: "node tests/gateway-server.mjs",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
