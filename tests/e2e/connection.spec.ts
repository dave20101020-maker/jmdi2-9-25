import { test, expect } from "@playwright/test";
import { AUTH_STATE_FILE, ensureAuthState } from "./helpers/authState";

test.describe("Backend Connectivity", () => {
  test.beforeAll(async ({ browser }) => {
    await ensureAuthState(browser);
  });
  test.use({ storageState: AUTH_STATE_FILE });

  test("reports backend health endpoint as healthy", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.status).toBe("ok");
  });

  test("surfaces graceful UI when backend health fails", async ({ page }) => {
    await page.route("**/api/health", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ status: "down", message: "maintenance" }),
      });
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const fallbackMessage = page.locator(
      "text=/connection issue|failed to fetch|temporarily unavailable/i"
    );
    await expect(fallbackMessage.first()).toBeVisible();

    await page.unroute("**/api/health");
  });
});
