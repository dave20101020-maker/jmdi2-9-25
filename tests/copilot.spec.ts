import { expect, test } from "@playwright/test";

const prompt = "How can you help with sleep?";
const mockReply = "Mocked provider response";

test.describe("Floating Copilot", () => {
  test("opens chat and shows mocked provider reply", async ({ page }) => {
    await page.route("**/api/ai/unified/chat", async (route) => {
      let body: Record<string, unknown> = {};
      try {
        body = route.request().postDataJSON();
      } catch {
        body = {};
      }
      const message = typeof body.message === "string" ? body.message : prompt;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reply: `${mockReply}: ${message}` }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const openButton = page.getByRole("button", { name: /open copilot chat/i });
    await expect(openButton).toBeVisible();
    await openButton.click();

    await expect(
      page.getByText(/powered by \/api\/ai\/unified\/chat/i)
    ).toBeVisible();

    await page.getByPlaceholder("Ask Copilot...").fill(prompt);

    const responsePromise = page.waitForResponse("**/api/ai/unified/chat");
    await page.getByRole("button", { name: /send/i }).click();
    await responsePromise;

    await expect(page.getByText(prompt)).toBeVisible();
    await expect(page.getByText(mockReply, { exact: false })).toBeVisible();
  });
});
