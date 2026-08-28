import { test, expect } from "@playwright/test";
import {
  gotoHome,
  runIdentifyWizard,
  acceptDisclaimer,
  startInspection,
  answerCurrentQuestion,
  clickContinueOrFinish,
  waitForNextAutosave,
  readInspectionRecord,
} from "./helpers.js";

// Section 22.1/22.2: inspections autosave to IndexedDB (inspectra-db) after
// every answer, so an in-progress inspection must survive both a hard page
// reload and navigating away to /#/saved and back.

test.describe("Resume flow", () => {
  test("navigating to /#/saved and back resumes the in-progress inspection", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    const inspectionId = await startInspection(page, { profileLabel: "Standard inspection" });

    await answerCurrentQuestion(page);
    // Wait for the autosave confirmation before advancing, so the resume
    // check below exercises real IndexedDB persistence rather than a race
    // with the in-flight write.
    await expect(page.getByText("Saved on this device")).toBeVisible();
    const beforeAdvance = (await readInspectionRecord(page, inspectionId))?.updatedAt;
    await clickContinueOrFinish(page);
    // "Continue" saves the new current-question position silently (no
    // toast, by design — see section 22.2's "do not interrupt" rule), so
    // wait for that specific write to land before navigating away.
    await waitForNextAutosave(page, inspectionId, beforeAdvance);
    const progress = page.locator('#inspection-body [role="progressbar"]');
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    const resumedQuestionTitle = await page.locator("#inspection-body h2").first().textContent();

    // Navigate away via the header back button, which routes to /#/saved.
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(/#\/saved$/);
    await expect(page.getByRole("heading", { name: "Saved inspections" })).toBeAttached({ timeout: 20_000 });
    await expect(page.getByText(/standard · 1\/\d+ answered/)).toBeVisible();
    await expect(page.getByText(/· complete/)).toHaveCount(0);

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/inspection/${inspectionId}$`));
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    await expect(page.locator("#inspection-body h2").first()).toHaveText(resumedQuestionTitle ?? "");
  });

  test("a hard page reload mid-inspection resumes from the same saved answer", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page);
    await acceptDisclaimer(page);
    const inspectionId = await startInspection(page, { profileLabel: "Standard inspection" });

    // Answer two questions before reloading, waiting for each write to
    // actually land in IndexedDB first — this is what makes the test a
    // genuine check of persistence rather than in-memory state. The first
    // two waits catch the (toast-visible) answer autosaves; the last one
    // catches the (silent, by design) current-position autosave that
    // "Continue" triggers when advancing to the third question.
    await answerCurrentQuestion(page);
    await expect(page.getByText("Saved on this device")).toBeVisible();
    await clickContinueOrFinish(page);
    await answerCurrentQuestion(page);
    await expect(page.getByText("Saved on this device")).toBeVisible();
    const beforeAdvance = (await readInspectionRecord(page, inspectionId))?.updatedAt;
    await clickContinueOrFinish(page);
    await waitForNextAutosave(page, inspectionId, beforeAdvance);

    const progress = page.locator('#inspection-body [role="progressbar"]');
    await expect(progress).toHaveAttribute("aria-valuenow", "2");
    const questionTitleBeforeReload = await page.locator("#inspection-body h2").first().textContent();

    await page.reload();

    await expect(page).toHaveURL(new RegExp(`#/inspection/${inspectionId}$`));
    await expect(progress).toHaveAttribute("aria-valuenow", "2", { timeout: 20_000 });
    await expect(page.locator("#inspection-body h2").first()).toHaveText(questionTitleBeforeReload ?? "");

    // The two previous answers should still be selected/recorded — advancing
    // should move straight to the third question, not re-ask an earlier one.
    await answerCurrentQuestion(page);
    await clickContinueOrFinish(page);
    await expect(progress).toHaveAttribute("aria-valuenow", "3");
  });
});
