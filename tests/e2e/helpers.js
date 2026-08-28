import { expect } from "@playwright/test";

// Shared fixtures/helpers for the Playwright e2e suite. These drive the real
// app (built + previewed by playwright.config.js's webServer) against the
// real dataset in data/iphone/ — nothing here is mocked.

export const DEVICE_SEARCH = "iPhone 17 Pro Max";
export const DEVICE_LABEL = "iPhone 17 Pro Max (2025)";
export const IOS_VERSION = "18.4";

/**
 * Read an inspection record straight out of IndexedDB (inspectra-db,
 * section 22.1). Used to deterministically confirm a background autosave
 * write has actually landed, since some autosaves (e.g. the current-
 * question position saved on "Continue") are intentionally silent — no
 * toast — so as not to spam the UI with save confirmations (section 22.2).
 */
export async function readInspectionRecord(page, inspectionId) {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("inspectra-db");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction("inspections", "readonly");
          const getReq = tx.objectStore("inspections").get(id);
          getReq.onsuccess = () => resolve(getReq.result ?? null);
          getReq.onerror = () => reject(getReq.error);
        };
      }),
    inspectionId,
  );
}

/** Wait until the persisted record's updatedAt timestamp advances past `after`. */
export async function waitForNextAutosave(page, inspectionId, after) {
  await expect
    .poll(async () => (await readInspectionRecord(page, inspectionId))?.updatedAt, { timeout: 10_000 })
    .not.toBe(after);
}

/** Navigate to the home page and confirm the app booted. */
export async function gotoHome(page) {
  await page.goto("./");
  // A full navigation re-runs the app boot sequence (dataset health check +
  // fetch), which can be slower under parallel test load than the default
  // assertion timeout comfortably allows — give it some headroom.
  await expect(page.getByRole("heading", { name: "Know exactly what you're buying, before you buy it." })).toBeVisible({
    timeout: 20_000,
  });
}

/**
 * Drive the full 5-step identify wizard (section 24.4): select model,
 * confirm storage, confirm finish, enter iOS version, review — ending on
 * the disclaimer page.
 */
export async function runIdentifyWizard(page, { searchTerm = DEVICE_SEARCH, deviceLabel = DEVICE_LABEL, iosVersion = IOS_VERSION } = {}) {
  await page.getByRole("button", { name: "Inspect a used iPhone", exact: true }).click();
  // The page's h1 is visually hidden (sr-only) now that the identify page
  // has no visible title bar — still present for accessibility/page-load
  // confirmation, just not something toBeVisible() will find.
  await expect(page.getByRole("heading", { name: "Identify this iPhone" })).toBeAttached();

  // Step 1: select model directly by search.
  await expect(page.locator("#identify-body").getByText("Step 1 of 5")).toBeVisible();
  await page.getByPlaceholder("Search model name").fill(searchTerm);
  await page.getByRole("button", { name: deviceLabel, exact: true }).click();
  await continueIdentify(page);

  // Step 2: observed storage capacity — pick the first official option.
  await expect(page.getByText("Observed storage capacity")).toBeVisible();
  const storageChoice = page.locator("#identify-body .grid.gap-2\\.5 button").first();
  await storageChoice.click();
  await continueIdentify(page);

  // Step 3: observed exterior finish — pick the first official option.
  await expect(page.getByText("Observed exterior finish")).toBeVisible();
  const finishChoice = page.locator("#identify-body .grid.gap-2\\.5 button").first();
  await finishChoice.click();
  await continueIdentify(page);

  // Step 4: installed iOS version.
  await expect(page.getByText("Installed iOS version")).toBeVisible();
  await page.getByPlaceholder("e.g. 18.4 or 26.1 Developer Beta").fill(iosVersion);
  await continueIdentify(page);

  // Step 5: review / identity-consistency preview.
  await expect(page.locator("#identify-body").getByText("Step 5 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Continue to disclaimer", exact: true }).click();
}

async function continueIdentify(page) {
  const continueButton = page.getByRole("button", { name: "Continue", exact: true });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}

/** Accept the disclaimer (section 24.5) — checkbox must start unchecked. */
export async function acceptDisclaimer(page) {
  await expect(page.getByRole("heading", { name: "Before you begin" })).toBeVisible();
  const checkbox = page.locator('#disclaimer-body input[type="checkbox"]');
  await expect(checkbox).not.toBeChecked();
  const acceptButton = page.getByRole("button", { name: "Accept and continue", exact: true });
  await expect(acceptButton).toBeDisabled();
  await checkbox.check();
  await expect(acceptButton).toBeEnabled();
  await acceptButton.click();
}

/**
 * Pick an inspection profile and start the inspection (section 24.6).
 * Returns the new inspection id parsed from the resulting URL.
 */
export async function startInspection(page, { profileLabel = "Quick check" } = {}) {
  await expect(page.getByRole("heading", { name: "Inspection setup" })).toBeVisible();
  // Profile buttons' accessible name includes their description paragraph
  // too, so match by the leading label rather than an exact string.
  await page.getByRole("button", { name: new RegExp(`^${profileLabel}`) }).click();
  await page.getByRole("button", { name: "Start inspection", exact: true }).click();
  // NB: "/inspection/new" (the setup page's own route) also matches a bare
  // [^/]+ pattern, so waitForURL would resolve immediately against the
  // pre-navigation URL without this exclusion — explicitly rule out "new".
  await page.waitForURL(/#\/inspection\/(?!new$)[^/]+$/);
  const match = page.url().match(/#\/inspection\/([^/?]+)$/);
  if (!match || match[1] === "new") throw new Error(`Could not parse inspection id from URL: ${page.url()}`);
  return match[1];
}

/** Answer whatever control is showing for the current question (section 24.7). */
export async function answerCurrentQuestion(page) {
  // The question card mounts asynchronously (code-split page module + an
  // IndexedDB read), and Locator#count() does not auto-wait — so wait for
  // the question title to actually be on screen before probing for a
  // control, otherwise this can race the render and see a stale/empty DOM.
  await page.locator("#inspection-body h2, #reset-body h2").first().waitFor({ state: "visible" });

  const radiogroup = page.getByRole("radiogroup");
  if (await radiogroup.count()) {
    await radiogroup.getByRole("radio").first().click();
    return;
  }
  const numberInput = page.locator('input[type="number"]');
  if (await numberInput.count()) {
    await numberInput.fill("12");
    return;
  }
  const textInput = page.locator('input[type="text"]:not([placeholder="Search model name"])');
  if (await textInput.count()) {
    await textInput.first().fill("Test observation");
    return;
  }
  throw new Error("No recognizable answer control found for the current question");
}

/** Click whichever primary progression button is showing (Continue/Finish). */
export async function clickContinueOrFinish(page) {
  await page.getByRole("button", { name: /^(Continue|Finish)$/ }).click();
}

/**
 * Answer every remaining question in the main inspection queue until the
 * "Main inspection complete" screen appears.
 */
export async function completeMainInspection(page, { maxIterations = 250 } = {}) {
  const completeHeading = page.getByRole("heading", { name: "Main inspection complete" });
  for (let i = 0; i < maxIterations; i++) {
    if (await completeHeading.isVisible().catch(() => false)) {
      return;
    }
    await answerCurrentQuestion(page);
    // Answering the very last question in the queue re-renders straight to
    // the "Main inspection complete" screen (no separate button click is
    // needed to get there), so check again before assuming a
    // Continue/Finish button is still present to click.
    if (await completeHeading.isVisible().catch(() => false)) {
      return;
    }
    await clickContinueOrFinish(page);
  }
  throw new Error("Main inspection did not reach completion within the iteration budget");
}

/**
 * Acknowledge the reset-verification consent gate and answer every
 * remaining reset/activation question until the summary screen, then
 * proceed to the report.
 */
export async function completeResetVerification(page, { maxIterations = 60 } = {}) {
  await expect(page.getByRole("heading", { name: "Final reset verification" })).toBeVisible();
  await expect(page.getByText("This step may involve destructive device actions.")).toBeVisible();
  await page.getByRole("button", { name: "I understand, continue", exact: true }).click();

  for (let i = 0; i < maxIterations; i++) {
    const viewReport = page.getByRole("button", { name: "View report", exact: true });
    if (await viewReport.isVisible().catch(() => false)) {
      await viewReport.click();
      return;
    }
    await answerCurrentQuestion(page);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  throw new Error("Reset verification did not reach the summary within the iteration budget");
}
