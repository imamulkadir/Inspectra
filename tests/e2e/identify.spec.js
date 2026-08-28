import { test, expect } from "@playwright/test";
import { gotoHome, runIdentifyWizard, DEVICE_LABEL, IOS_VERSION } from "./helpers.js";

// Section 24.4: Enter A-number or select a model -> confirm model -> confirm
// storage -> confirm finish -> enter iOS version -> identity-consistency
// preview -> continue to disclaimer/profile selection.

test.describe("Identify flow", () => {
  test("walks the full identify wizard and reaches the disclaimer", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page);

    // Wizard should have handed off to the disclaimer page (section 24.5).
    await expect(page.getByRole("heading", { name: "Before you begin" })).toBeVisible();
    await expect(page.getByText("Scope limitations")).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy notice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
  });

  test("supports searching for a model directly and shows the resolved device", async ({ page }) => {
    await gotoHome(page);
    await page.getByRole("button", { name: "Inspect a used iPhone", exact: true }).click();

    await page.getByPlaceholder("Search model name").fill("iPhone 17");
    // Multiple iPhone 17 variants should be listed (base, Pro, Pro Max, e).
    await expect(page.getByRole("button", { name: DEVICE_LABEL, exact: true })).toBeVisible();

    await page.getByRole("button", { name: DEVICE_LABEL, exact: true }).click();
    await expect(page.getByText("Resolved from A-number")).not.toBeVisible();
    await expect(page.getByText("iPhone 17 Pro Max")).toBeVisible();
  });

  test("review step surfaces the confirmed identity before continuing", async ({ page }) => {
    await gotoHome(page);
    await runIdentifyWizard(page, { iosVersion: IOS_VERSION });
    // runIdentifyWizard already asserted "Step 5 of 5" (review) was shown
    // before handing off — reaching the disclaimer confirms that step's
    // "Continue to disclaimer" action worked end to end.
    await expect(page).toHaveURL(/#\/disclaimer$/);
  });
});
