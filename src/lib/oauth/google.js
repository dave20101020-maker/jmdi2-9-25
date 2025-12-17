const STATE_STORAGE_KEY = "ns_google_oauth_state";

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

export const redirectToGoogleOAuth = ({ prompt } = {}) => {
  if (!isBrowser()) {
    throw new Error("Google sign-in is only available in the browser");
  }
  const state = generateStateValue();
  storeGoogleOAuthState(state);
  const authUrl = `/api/auth/google?mode=redirect&state=${encodeURIComponent(
    state
  )}${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ""}`;
  window.location.assign(authUrl);
  return authUrl;
};

export default {
  storeGoogleOAuthState,
  consumeGoogleOAuthState,
  peekGoogleOAuthState,
  redirectToGoogleOAuth,
};
