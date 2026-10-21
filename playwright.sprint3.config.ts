import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  testMatch: "sprint3-normal.spec.ts",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", serviceWorkers: "block" },
  webServer: [
    {
      command: "npm run build:shared && npm run dev --workspace @chargegrid/api",
      url: "http://127.0.0.1:3333/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: "npm run dev --workspace @chargegrid/admin-web",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: "npm run dev --workspace @chargegrid/driver-pwa",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: [["dot"], ["html", { outputFolder: "output/playwright/sprint3-report", open: "never" }]],
  outputDir: "output/playwright/sprint3-results"
});
