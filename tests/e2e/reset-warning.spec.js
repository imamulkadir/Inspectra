import { test, expect } from "@playwright/test";
import {
  gotoHome,
  runIdentifyWizard,
  acceptDisclaimer,
  startInspection,
  completeMainInspection,
} from "./helpers.js";

// Section 24.9 / 21.2: the reset-verification page must visually/textually
// distinguish itself as a destructive-action, consent-gated flow, and
// skipping it must surface "Final reset verification was not completed."
// near the top of the report — not only in details.

test.describe("Reset warning flow", () => {
  test("reset-verification page shows a destructive-action consent gate", async ({ page }) => {
    test.setTimeout(120_000);
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    await startInspection(page, { profileLabel: "Quick check" });
    await completeMainInspection(page);

    await expect(page.getByRole("heading", { name: "Main inspection complete" })).toBeVisible();
    await page.getByRole("button", { name: "Final reset verification", exact: true }).click();

    await expect(page).toHaveURL(/#\/inspection\/[^/]+\/reset$/);
    await expect(page.getByRole("heading", { name: "Final reset verification" })).toBeVisible();

    // Destructive-action framing, distinct from an ordinary inspection step.
    await expect(page.getByText("This step may involve destructive device actions.")).toBeVisible();
    await expect(page.getByText(/Only proceed with the seller's consent/)).toBeVisible();
    const consentGate = page.locator(".bg-amber-50", { hasText: "destructive device actions" });
    await expect(consentGate).toBeVisible();

    // Consent checkpoint must be an explicit action, not implicit.
    const continueButton = page.getByRole("button", { name: "I understand, continue", exact: true });
    await expect(continueButton).toBeVisible();
  });

  test("skipping final reset verification surfaces the warning near the top of the report", async ({ page }) => {
    test.setTimeout(120_000);
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    const inspectionId = await startInspection(page, { profileLabel: "Quick check" });
    await completeMainInspection(page);
    await expect(page.getByRole("heading", { name: "Main inspection complete" })).toBeVisible();

    // Deliberately skip the "Final reset verification" step and navigate
    // straight to the report, as a seller/buyer might by using the URL or
    // the saved-inspections list.
    await page.goto(`./#/report/${inspectionId}`);

    // The message legitimately appears twice: once as the prominent top
    // banner, and again inside "Result limitations" further down — the
    // spec (21.2) only requires it not be *only* in details.
    const warningInstances = page.getByText("Final reset verification was not completed.");
    await expect(warningInstances).toHaveCount(2);

    // The (first) warning must appear near the top: before checklist
    // completion, category summary, and other lower-priority sections.
    const topWarning = warningInstances.first();
    const checklistHeading = page.getByRole("heading", { name: "Checklist completion", exact: true });
    const warningY = await topWarning.evaluate((node) => node.getBoundingClientRect().top);
    const checklistY = await checklistHeading.evaluate((node) => node.getBoundingClientRect().top);
    expect(warningY).toBeLessThan(checklistY);
  });
});
