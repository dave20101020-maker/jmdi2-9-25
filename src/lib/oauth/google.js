import api from "@/utils/apiClient";

const STATE_STORAGE_KEY = "ns_google_oauth_state";
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

const isBrowser = () => typeof window !== "undefined";

const generateStateValue = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
};

export const storeGoogleOAuthState = (state) => {
  if (!isBrowser()) return;
  try {
    window.sessionStorage?.setItem(STATE_STORAGE_KEY, state);
  } catch (error) {
    console.warn("[google-oauth] Unable to store state", error);
  }
};

export const consumeGoogleOAuthState = () => {
  if (!isBrowser()) return null;
  try {
    const stored = window.sessionStorage?.getItem(STATE_STORAGE_KEY);
    if (stored) {
      window.sessionStorage.removeItem(STATE_STORAGE_KEY);
    }
    return stored;
  } catch (error) {
    console.warn("[google-oauth] Unable to read state", error);
    return null;
  }
};

export const peekGoogleOAuthState = () => {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage?.getItem(STATE_STORAGE_KEY);
  } catch (error) {
    console.warn("[google-oauth] Unable to peek state", error);
    return null;
  }
};

export const buildGoogleRedirectUrl = ({
  redirectUri,
  state,
  prompt = "select_account",
} = {}) => {
  if (!api?.baseUrl) {
    throw new Error("Backend base URL is not configured");
  }
  const url = new URL("/api/auth/google", api.baseUrl);
  if (redirectUri) {
    url.searchParams.set("redirect_uri", redirectUri);
  }
  if (state) {
    url.searchParams.set("state", state);
  }
  if (prompt) {
    url.searchParams.set("prompt", prompt);
  }
  url.searchParams.set("mode", "redirect");
  return url.toString();
};

export const getGoogleCallbackUrl = (callbackPath = GOOGLE_CALLBACK_PATH) => {
  if (!isBrowser()) return null;
  const normalizedPath = callbackPath.startsWith("/")
    ? callbackPath
    : `/${callbackPath}`;
  return `${window.location.origin}${normalizedPath}`;
};

export const redirectToGoogleOAuth = ({
  callbackPath = GOOGLE_CALLBACK_PATH,
  prompt,
} = {}) => {
  if (!isBrowser()) {
    throw new Error("Google sign-in is only available in the browser");
  }
  const redirectUri = getGoogleCallbackUrl(callbackPath);
  if (!redirectUri) {
    throw new Error("Unable to determine OAuth callback URL");
  }
  const state = generateStateValue();
  storeGoogleOAuthState(state);
  const authUrl = buildGoogleRedirectUrl({ redirectUri, state, prompt });
  window.location.assign(authUrl);
  return authUrl;
};

export default {
  GOOGLE_CALLBACK_PATH,
  storeGoogleOAuthState,
  consumeGoogleOAuthState,
  peekGoogleOAuthState,
  buildGoogleRedirectUrl,
  getGoogleCallbackUrl,
  redirectToGoogleOAuth,
};
