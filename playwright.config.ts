import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
export default defineConfig({
  testDir: "./playwright",
  timeout: 180_000,
  expect: { timeout: 12_000 },
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], channel: process.platform === "win32" ? "msedge" : undefined, baseURL: `http://localhost:${port}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: `npm run dev -- --port ${port}`, url: `http://localhost:${port}`, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
