import { test, expect } from "@playwright/test";

const PRIMARY_ROUTES = [
  { label: /dashboard/i, path: "/dashboard" },
  { label: /onboarding/i, path: "/onboarding" },
  { label: /pricing/i, path: "/pricing" },
  { label: /settings/i, path: "/settings" },
];

test.describe("App Shell & Navigation", () => {
  test("renders layout chrome and has no legacy branding", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /command center/i })
    ).toBeVisible();
    await expect(page.getByText(/northstar/i)).toBeVisible();

    await expect(page.locator("text=Base44")).toHaveCount(0);
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("supports navigation between primary routes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    for (const { label, path } of PRIMARY_ROUTES) {
      const navItem = page.getByRole("link", { name: label }).first();
      if (await navItem.isVisible()) {
        await navItem.click();
      } else {
        await page.goto(path);
      }

      await page.waitForLoadState("networkidle");
      const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      await expect(page).toHaveURL(new RegExp(`${escapedPath}`, "i"));
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });
});
