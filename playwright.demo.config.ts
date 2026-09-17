import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests/integration",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev:demo",
    url: "http://127.0.0.1:5173",
    // Never reset a user's running demo: tests own these ports and their state file.
    reuseExistingServer: false,
    timeout: 120_000,
    env: { CHARGEGRID_DEMO_STATE_PATH: resolve(".local/demo/e2e-state.json") }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
  reporter: [["dot"], ["html", { outputFolder: "output/playwright/demo-report", open: "never" }]],
  outputDir: "output/playwright/demo-results"
});
