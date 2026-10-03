import { defineConfig, devices } from "@playwright/test";

process.env.NO_PROXY = [process.env.NO_PROXY, "localhost", "127.0.0.1"]
  .filter(Boolean)
  .join(",");

export default defineConfig({
  testDir: "./tests/storybook",
  outputDir: "test-results/storybook",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 30_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/storybook", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:6007",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "storybook-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "storybook-mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 320, height: 800 } },
    },
  ],
  webServer: {
    command: "node tests/storybook/server.mjs",
    url: "http://127.0.0.1:6007",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
