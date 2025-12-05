import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { AUTH_STATE_FILE } from "./helpers/authState";
import { login } from "./helpers/login";
const VALID_EMAIL = process.env.E2E_EMAIL || "pilot@northstar.app";
const VALID_PASSWORD = process.env.E2E_PASSWORD || "Password123!";
const INVALID_EMAIL = "wrong-user@example.com";
const INVALID_PASSWORD = "incorrect-password";

test.describe("Authentication Flows", () => {
  test("rejects invalid credentials and surfaces helpful errors", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/email/i).fill(INVALID_EMAIL);
    await page.getByLabel(/password/i).fill(INVALID_PASSWORD);

    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForLoadState("networkidle");

    const alert = page.locator('[role="alert"], .ns-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/invalid|incorrect|failed|error/i);
  });

  test("logs in successfully and validates /api/auth/me response", async ({
    page,
  }) => {
    const result = await login(page, VALID_EMAIL, VALID_PASSWORD);
    await expect(page).toHaveURL(/dashboard|onboarding/);

    const meResponse = await page.request.get("/api/auth/me");
    expect(meResponse.ok()).toBeTruthy();
    const payload = await meResponse.json();
    expect(payload?.email?.toLowerCase()).toContain(VALID_EMAIL.split("@")[0]);

    await page.context().storageState({ path: AUTH_STATE_FILE });
    expect(result.token).toBeTruthy();
  });

  test("logs out and redirects to sign-in", async ({ page }) => {
    await login(page, VALID_EMAIL, VALID_PASSWORD);

    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")'
    );

    if (await logoutButton.count()) {
      await logoutButton.first().click();
    } else {
      await page.request.post("/api/auth/logout").catch(() => undefined);
      await page.context().clearCookies();
    }

    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForURL("**/sign-in", { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /login|sign in/i })
    ).toBeVisible();

    if (fs.existsSync(AUTH_STATE_FILE)) {
      fs.rmSync(AUTH_STATE_FILE);
    }
  });
});
