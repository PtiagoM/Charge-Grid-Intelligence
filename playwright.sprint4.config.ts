import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  testMatch: "sprint4-*.spec.ts",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", serviceWorkers: "block" },
  webServer: [
    { command: "node tests/integration/sprint4-api-server.mjs", url: "http://127.0.0.1:3433/health", reuseExistingServer: false, timeout: 120_000 },
    { command: "npm run dev --workspace @chargegrid/admin-web -- --port 5273 --host 127.0.0.1", url: "http://127.0.0.1:5273", reuseExistingServer: false, timeout: 120_000, env: { VITE_CHARGEGRID_API_URL: "http://127.0.0.1:3433" } },
    { command: "npm run dev --workspace @chargegrid/driver-pwa -- --port 5274 --host 127.0.0.1", url: "http://127.0.0.1:5274", reuseExistingServer: false, timeout: 120_000, env: { VITE_CHARGEGRID_API_URL: "http://127.0.0.1:3433" } }
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: [["dot"], ["html", { outputFolder: "output/playwright/sprint4-report", open: "never" }]],
  outputDir: "output/playwright/sprint4-results"
});
