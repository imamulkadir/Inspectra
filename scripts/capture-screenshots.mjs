// One-off documentation tool: captures targeted screenshots of the running
// app for README.md. Not part of the build or test pipeline — re-run
// manually (`node scripts/capture-screenshots.mjs`) against a local dev
// server whenever the UI changes enough that the README images go stale.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE_URL = process.env.CAPTURE_BASE_URL ?? "http://localhost:5183";
const OUT_DIR = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));

function outPath(file) {
  return path.join(OUT_DIR, file);
}

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 390, height: 780 };

async function shootViewport(page, path, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE_URL}/#${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: outPath(file) });
}

async function shootElement(page, path, viewport, selector, file, { last = false } = {}) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE_URL}/#${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const locator = page.locator(selector);
  const handle = last ? locator.last() : locator.first();
  await handle.waitFor({ state: "visible" });
  await handle.screenshot({ path: outPath(file) });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await shootViewport(page, "/", DESKTOP_VIEWPORT, "home-desktop.png");
  await shootViewport(page, "/", MOBILE_VIEWPORT, "home-mobile.png");
  await shootViewport(page, "/explore", DESKTOP_VIEWPORT, "explore-desktop.png");
  await shootViewport(page, "/identify", MOBILE_VIEWPORT, "identify-mobile.png");

  // Just the nav chrome itself, cropped tight — desktop's tab strip lives
  // inside the <nav> landmark; mobile's tab bar is a plain div rendered
  // after it in the DOM, so `last()` reliably picks it regardless of which
  // one CSS happens to be hiding at the current viewport.
  await shootElement(page, "/", DESKTOP_VIEWPORT, 'nav[aria-label="Primary"] [role="tablist"]', "nav-desktop.png");
  await shootElement(page, "/", MOBILE_VIEWPORT, '[role="tablist"]', "nav-mobile.png", { last: true });

  await browser.close();
  console.log(`Saved screenshots to ${OUT_DIR.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
