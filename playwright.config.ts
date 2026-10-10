import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./playwright",
  timeout: 180_000,
  expect: { timeout: 12_000 },
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], channel: process.platform === "win32" ? "msedge" : undefined, baseURL: "http://localhost:3100", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "npm run dev -- --port 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
