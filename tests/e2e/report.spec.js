import { test, expect } from "@playwright/test";
import {
  gotoHome,
  runIdentifyWizard,
  acceptDisclaimer,
  startInspection,
  completeMainInspection,
  completeResetVerification,
  DEVICE_LABEL,
} from "./helpers.js";

// Section 24.10: report hierarchy while scoring is uncalibrated — device
// identity, official stop conditions, final-reset completion, findings,
// identity inconsistencies, checklist completion, category summary,
// disclaimer, etc. Section 18.1: no numeric score may render while the
// dataset's calibration is uncalibrated.

test.describe("Report flow", () => {
  test("a fully completed inspection renders a report with the required sections and no numeric score", async ({ page }) => {
    test.setTimeout(150_000);
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    await startInspection(page, { profileLabel: "Quick check" });
    await completeMainInspection(page);
    await page.getByRole("button", { name: "Final reset verification", exact: true }).click();
    await completeResetVerification(page);

    await expect(page).toHaveURL(/#\/report\/[^/]+$/);
    // The device-identity heading is an h2 — the page's sole h1 is "Report"
    // in the sticky header (section 26: one H1 per page), which is also
    // deliberately hidden when printed (it isn't part of the saved report).
    await expect(page.locator("#report-body").getByRole("heading", { level: 2 }).first()).toContainText(
      DEVICE_LABEL.replace(/\s*\(\d+\)$/, ""),
    );

    // 1. Device identity.
    await expect(page.getByText(/generated/)).toBeVisible();

    // Reset verification was completed via completeResetVerification, so the
    // "not completed" warning must be absent here (contrast with the
    // reset-warning spec, which asserts it IS present when skipped).
    await expect(page.getByText("Final reset verification was not completed.")).toHaveCount(0);

    // Identity inconsistencies section (present either way).
    await expect(page.getByRole("heading", { name: "Identity", exact: true }).or(page.getByRole("heading", { name: "Identity inconsistencies", exact: true }))).toBeVisible();

    // Checklist completion — a raw count, explicitly not a weighted score.
    const checklistHeading = page.getByRole("heading", { name: "Checklist completion", exact: true });
    await expect(checklistHeading).toBeVisible();
    await expect(page.getByText(/of \d+ applicable checks completed/)).toBeVisible();
    await expect(page.getByText("Raw checklist completion, not a weighted score.")).toBeVisible();

    // Category summary — collapsed by default (section reads as a short,
    // scannable summary rather than one long dense page), so only the
    // <summary> heading (always visible/interactive) is checked here.
    await expect(page.getByRole("heading", { name: /^Category summary/ })).toBeVisible();

    // Sources / methodology / dataset version — also collapsed by default.
    await expect(page.getByRole("heading", { name: /^Sources/ })).toBeVisible();
    const methodologyHeading = page.getByRole("heading", { name: "Methodology & versions", exact: true });
    await expect(methodologyHeading).toBeVisible();
    await methodologyHeading.click();
    await expect(page.getByText(/^Dataset .+ · app /)).toBeVisible();

    // Disclaimer — persistent analytical qualifier.
    await expect(page.getByRole("heading", { name: "Disclaimer", exact: true })).toBeVisible();

    // Print-to-PDF affordance (section 24.10 print CSS requirement).
    await expect(page.getByRole("button", { name: "Print / Save as PDF", exact: true })).toBeVisible();

    // --- Section 18.1 spec-compliance check: no numeric score ring/badge. ---
    // The report must show checklist *completion*, never a calibrated
    // numeric condition score, while the dataset's scoring is uncalibrated.
    await expect(page.locator('[class*="score" i]')).toHaveCount(0);
    await expect(page.locator('[data-testid*="score" i]')).toHaveCount(0);
    await expect(page.locator("svg circle")).toHaveCount(0);
    // No bare "NN / 100" or "NN%" style score readout anywhere on the page.
    const bodyText = await page.locator("#report-body").innerText();
    expect(bodyText).not.toMatch(/\b\d{1,3}\s*\/\s*100\b/);
    expect(bodyText).not.toMatch(/condition score/i);
  });

  test("report is reachable from the saved-inspections list for a completed inspection", async ({ page }) => {
    test.setTimeout(150_000);
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    await startInspection(page, { profileLabel: "Quick check" });
    await completeMainInspection(page);
    await page.getByRole("button", { name: "Final reset verification", exact: true }).click();
    await completeResetVerification(page);

    await expect(page).toHaveURL(/#\/report\/[^/]+$/);

    // page.goto() here is a full reload (not an in-app hash change), which
    // re-runs the app boot sequence (dataset health check + fetch) — give
    // it a more generous timeout since that can be slower under parallel
    // test load than a plain in-app navigation.
    await page.goto("./#/saved");
    await expect(page.getByRole("heading", { name: "Saved inspections" })).toBeAttached({ timeout: 20_000 });
    await expect(page.getByText(/· complete/)).toBeVisible();

    await page.getByRole("button", { name: "View report", exact: true }).click();
    await expect(page).toHaveURL(/#\/report\/[^/]+$/);
    await expect(page.locator("#report-body").getByRole("heading", { level: 2 }).first()).toBeVisible();
  });
});
