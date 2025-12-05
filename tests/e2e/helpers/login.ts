import { expect, Page } from "@playwright/test";

export type LoginResult = {
  token?: string;
  responseBody?: Record<string, unknown>;
};

const DEFAULT_EMAIL = process.env.E2E_EMAIL || "pilot@northstar.app";
const DEFAULT_PASSWORD = process.env.E2E_PASSWORD || "Password123!";

const waitForAuthUrl = ["**/dashboard", "**/onboarding", "**/pricing"];

export async function login(
  page: Page,
  email: string = DEFAULT_EMAIL,
  password: string = DEFAULT_PASSWORD
): Promise<LoginResult> {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");

  const emailInput = page.getByLabel(/email/i).first();
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);

  const passwordInput = page.getByLabel(/password/i).first();
  await passwordInput.fill(password);

  const submitButton = page
    .getByRole("button", { name: /sign in|log in/i })
    .first();
  await expect(submitButton).toBeEnabled();

  const loginResponsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return (
      response.request().method() === "POST" && url.includes("/api/auth/login")
    );
  });

  await submitButton.click();
  const loginResponse = await loginResponsePromise;
  const responseBody = (await loginResponse.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  await Promise.race(
    waitForAuthUrl.map((pattern) =>
      page
        .waitForURL(pattern, { waitUntil: "networkidle", timeout: 20_000 })
        .catch(() => undefined)
    )
  );
  await page.waitForLoadState("networkidle");

  const cookies = await page.context().cookies();
  if (cookies.length) {
    await page.context().addCookies(cookies);
  }

  const token = cookies.find((cookie) =>
    /token|auth/i.test(cookie.name)
  )?.value;

  return {
    token,
    responseBody,
  };
}
