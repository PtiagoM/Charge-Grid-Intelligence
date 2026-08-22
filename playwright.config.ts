import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./apps/admin-web/tests/e2e",
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev --workspace @chargegrid/admin-web -- --host 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } }
    }
  ],
  reporter: [["dot"], ["html", { outputFolder: "output/playwright/report", open: "never" }]],
  outputDir: "output/playwright/results"
});
