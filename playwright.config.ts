import { defineConfig, devices } from "@playwright/test";

process.env.NO_PROXY = [process.env.NO_PROXY, "localhost", "127.0.0.1"]
  .filter(Boolean)
  .join(",");

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/e2e",
  // Tests share/reset one isolated V0.11 backend fixture.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/e2e", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    serviceWorkers: "block",
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
