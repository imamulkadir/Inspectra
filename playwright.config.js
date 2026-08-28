import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Capped: the webServer's `vite preview` (a single Node process) was
  // observed crashing under higher worker concurrency (both unbounded
  // default and 4) hitting it simultaneously during a full local run.
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4173/Inspectra/",
    trace: "on-first-retry",
    // These functional flows (identify/inspect/resume/reset/report) don't
    // exercise the PWA service worker or offline caching (section 23) —
    // that's covered separately (see section 30.3's "offline after
    // caching" manual/other check). Blocking SW registration here avoids a
    // real, WebKit-specific race where the app's own "update available"
    // banner (a fixed, non-dismissible overlay until reload/update) can
    // claim control on first load and intercept clicks on the sticky
    // header underneath it.
    serviceWorkers: "block",
  },
  webServer: {
    // Run `npm run build` yourself before `npm run test:e2e` (CI must too).
    // Rebuilding inline here on every invocation raced the cold vite-preview
    // boot against immediate dual-project test load and caused flaky
    // "server not ready" / dropped-connection failures unrelated to the app.
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173/Inspectra/",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "mobile-iphone",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
