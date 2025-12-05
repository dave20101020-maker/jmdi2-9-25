import { test, expect } from "@playwright/test";
import { AUTH_STATE_FILE, ensureAuthState } from "./helpers/authState";

const VIEWPORT = { width: 1280, height: 720 } as const;

test.describe("Visual Snapshots", () => {
  test("landing page snapshot", async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      "home.png"
    );
  });
});

test.describe("Authenticated Visual Snapshots", () => {
  test.beforeAll(async ({ browser }) => {
    await ensureAuthState(browser);
  });

  test.use({ storageState: AUTH_STATE_FILE });

  const routes = [
    { name: "dashboard", path: "/dashboard" },
    { name: "sleep-pillar", path: "/pillar/sleep" },
  ];

  for (const route of routes) {
    test(`${route.name} snapshot`, async ({ page }) => {
      await page.setViewportSize(VIEWPORT);
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
        `${route.name}.png`
      );
    });
  }
});
