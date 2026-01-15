import { OAuth2Client } from "google-auth-library";

const tokenStore = new Map();

const resolveRedirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI ||
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  process.env.GOOGLE_CALLBACK_URL ||
  "";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = resolveRedirectUri();
  return new OAuth2Client(clientId, clientSecret, redirectUri || undefined);
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCode(code) {
  const client = getOAuthClient();
  const response = await client.getToken(code);
  return response.tokens;
}

export function storeTokens(userId, tokens) {
  if (!userId || !tokens) return;
  tokenStore.set(userId, {
    tokens,
    updatedAt: new Date().toISOString(),
  });
}

export function getTokens(userId) {
  return tokenStore.get(userId) || null;
}

export async function getAccessToken(userId) {
  const entry = getTokens(userId);
  if (!entry?.tokens) return null;

  const client = getOAuthClient();
  client.setCredentials(entry.tokens);
  const accessToken = await client.getAccessToken();
  if (accessToken?.token) {
    return accessToken.token;
  }
  return entry.tokens.access_token || null;
}

export function getStatus(userId) {
  const entry = getTokens(userId);
  if (!entry?.tokens?.access_token && !entry?.tokens?.refresh_token) {
    return { connected: false };
  }
  return {
    connected: true,
    updatedAt: entry.updatedAt,
  };
}
