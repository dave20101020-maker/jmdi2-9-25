import { test, expect } from "@playwright/test";
import { AUTH_STATE_FILE, ensureAuthState } from "./helpers/authState";

const PILLARS = [
  { id: "sleep", label: "Sleep" },
  { id: "diet", label: "Diet" },
  { id: "exercise", label: "Exercise" },
  { id: "physical-health", label: "Physical Health" },
  { id: "mental-health", label: "Mental Health" },
  { id: "finances", label: "Finances" },
  { id: "social", label: "Social" },
  { id: "spirituality", label: "Spirituality" },
];

test.describe("Pillar Navigation & Data", () => {
  test.beforeAll(async ({ browser }) => {
    await ensureAuthState(browser);
  });

  test.use({ storageState: AUTH_STATE_FILE });

  for (const pillar of PILLARS) {
    test(`${pillar.label} pillar loads contextual data`, async ({ page }) => {
      await page.goto(`/pillar/${pillar.id}`);
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: new RegExp(pillar.label, "i") })
      ).toBeVisible();
      await expect(page.getByLabel("Back to Dashboard")).toBeVisible();

      const dataLocator = page
        .locator("text=/avg|score|entries|activity|journal/i")
        .first();
      await expect(dataLocator).toBeVisible();

      const healthResponse = await page.request.get("/api/pillars");
      expect(healthResponse.ok()).toBeTruthy();
    });
  }
});
