import { test, expect } from "@playwright/test";
import { AUTH_STATE_FILE, ensureAuthState } from "./helpers/authState";

test.describe("Dashboard Experience", () => {
  test.beforeAll(async ({ browser }) => {
    await ensureAuthState(browser);
  });

  test.use({ storageState: AUTH_STATE_FILE });

  test("renders personalized widgets and summaries", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /welcome back/i })
    ).toBeVisible();
    await expect(page.getByText(/life score/i)).toBeVisible();
    await expect(page.getByText(/pillars/i)).toBeVisible();
  });

  test("allows authenticated API requests from the UI session", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const meResponse = await page.request.get("/api/auth/me");
    expect(meResponse.ok()).toBeTruthy();
    const mePayload = await meResponse.json();
    expect(mePayload?.email).toBeTruthy();

    const entriesResponse = await page.request.get("/api/entries");
    expect(entriesResponse.status()).toBeLessThan(500);
  });
});
