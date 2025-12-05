import { Browser } from "@playwright/test";
import fs from "node:fs";
import { login } from "./login";

export const AUTH_STATE_FILE = "auth.json";
const VALID_EMAIL = process.env.E2E_EMAIL || "pilot@northstar.app";
const VALID_PASSWORD = process.env.E2E_PASSWORD || "Password123!";

export async function ensureAuthState(browser: Browser): Promise<string> {
  if (fs.existsSync(AUTH_STATE_FILE)) {
    return AUTH_STATE_FILE;
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, VALID_EMAIL, VALID_PASSWORD);
  await context.storageState({ path: AUTH_STATE_FILE });
  await context.close();
  return AUTH_STATE_FILE;
}
