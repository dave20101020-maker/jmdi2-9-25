import { test, expect } from "@playwright/test";

const REQUIRED_PILLARS = ["Sleep", "Diet", "Exercise"];

async function reachSelectionStep(page) {
  await page.goto("/onboarding");
  await page.waitForLoadState("networkidle");

  const advanceButtons = [
    /begin your journey/i,
    /better way/i,
    /show me how it works/i,
    /i'm ready to start/i,
  ];

  for (const label of advanceButtons) {
    const button = page.getByRole("button", { name: label }).first();
    await expect(button).toBeVisible();
    await button.click();
    await page.waitForLoadState("networkidle");
  }
}

test.describe("Onboarding Experience", () => {
  test("requires selecting three pillars before continuing", async ({
    page,
  }) => {
    await reachSelectionStep(page);

    const continueButton = page
      .getByRole("button", { name: /continue/i })
      .first();
    await expect(continueButton).toBeDisabled();

    for (const pillar of REQUIRED_PILLARS) {
      await page.getByRole("button", { name: new RegExp(pillar, "i") }).click();
    }

    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/let's set your first goal/i)).toBeVisible();
  });

  test("collects goal, reminders, and first entry details", async ({
    page,
  }) => {
    await reachSelectionStep(page);

    for (const pillar of REQUIRED_PILLARS) {
      await page.getByRole("button", { name: new RegExp(pillar, "i") }).click();
    }

    await page
      .getByRole("button", { name: /continue/i })
      .first()
      .click();

    const goalInput = page.getByPlaceholder(/what do you want to achieve/i);
    await goalInput.fill("Improve my sleep quality to 8/10");
    await page.getByLabel(/target date/i).fill("2099-12-31");
    await page.getByRole("button", { name: /set my goal/i }).click();

    await expect(page.getByText(/daily reminders/i)).toBeVisible();
    await page
      .getByRole("button", { name: /enable notifications|continue/i })
      .click();

    await expect(page.getByText(/log your first entry/i)).toBeVisible();
    const sliderHandle = page.locator('[role="slider"]');
    if (await sliderHandle.isVisible()) {
      await sliderHandle
        .click({ position: { x: 200, y: 0 } })
        .catch(() => undefined);
    }

    await page.getByRole("button", { name: /save my first entry/i }).click();
    await expect(page.getByText(/start exploring/i)).toBeVisible();
  });
});
