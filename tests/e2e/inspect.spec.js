import { test, expect } from "@playwright/test";
import { gotoHome, runIdentifyWizard, acceptDisclaimer, startInspection, answerCurrentQuestion, clickContinueOrFinish } from "./helpers.js";

// Section 24.6/24.7: profile selection (Quick/Standard/Deep), then one
// question at a time with header (category, progress, save status) and a
// bottom action bar (Previous/Continue).

test.describe("Inspect flow", () => {
  test("selects a profile, starts the inspection, and answers questions one at a time", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);

    await expect(page.getByRole("heading", { name: "Inspection setup" })).toBeVisible();
    await expect(page.getByText("Inspection depth")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Quick check/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Standard inspection/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Deep inspection/ })).toBeVisible();

    const inspectionId = await startInspection(page, { profileLabel: "Standard inspection" });
    expect(inspectionId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`#/inspection/${inspectionId}$`));

    // One question at a time: header shows category + progress, body shows
    // a single question with large answer controls.
    await expect(page.locator("#inspection-body h2").first()).toBeVisible();
    const progress = page.locator('#inspection-body [role="progressbar"]');
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute("aria-valuenow", "0");

    const firstQuestionTitle = await page.locator("#inspection-body h2").first().textContent();

    await answerCurrentQuestion(page);
    await clickContinueOrFinish(page);

    // Progress should have advanced and a new (or the next) question shown.
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    const secondQuestionTitle = await page.locator("#inspection-body h2").first().textContent();
    expect(secondQuestionTitle).not.toBeNull();

    // Answer a couple more to confirm the flow keeps advancing.
    await answerCurrentQuestion(page);
    await clickContinueOrFinish(page);
    await expect(progress).toHaveAttribute("aria-valuenow", "2");

    void firstQuestionTitle;
  });

  test("shows the persistent analytical qualifier and a save-status toast after answering", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    await startInspection(page, { profileLabel: "Quick check" });

    await expect(page.getByText(/analytical assessment/i)).toBeVisible();

    await answerCurrentQuestion(page);

    // Autosave (section 22.2) surfaces a subtle, non-blocking status toast.
    await expect(page.getByText("Saved on this device")).toBeVisible();
  });

  test("Previous button is unavailable on the first question and appears after advancing", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    await startInspection(page, { profileLabel: "Quick check" });

    await expect(page.getByRole("button", { name: "Previous", exact: true })).toHaveCount(0);

    await answerCurrentQuestion(page);
    await clickContinueOrFinish(page);

    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeVisible();
  });
});
