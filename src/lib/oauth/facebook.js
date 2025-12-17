const STATE_STORAGE_KEY = "ns_facebook_oauth_state";

const isBrowser = () => typeof window !== "undefined";

const generateStateValue = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
};

const persistState = (value) => {
  if (!isBrowser()) return;
  try {
    window.sessionStorage?.setItem(STATE_STORAGE_KEY, value);
  } catch (error) {
    console.warn("[facebook-oauth] Unable to store state", error);
  }
};

export const consumeFacebookOAuthState = () => {
  if (!isBrowser()) return null;
  try {
    const stored = window.sessionStorage?.getItem(STATE_STORAGE_KEY);
    if (stored) {
      window.sessionStorage.removeItem(STATE_STORAGE_KEY);
    }
    return stored;
  } catch (error) {
    console.warn("[facebook-oauth] Unable to consume state", error);
    return null;
  }
};

export const peekFacebookOAuthState = () => {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage?.getItem(STATE_STORAGE_KEY);
  } catch (error) {
    console.warn("[facebook-oauth] Unable to read state", error);
    return null;
  }
};

export const redirectToFacebookOAuth = ({ scope, authType } = {}) => {
  if (!isBrowser()) {
    throw new Error("Facebook sign-in is only available in the browser");
  }
  const state = generateStateValue();
  persistState(state);
  const authUrl = `/api/auth/facebook?mode=redirect&state=${encodeURIComponent(
    state
  )}${scope ? `&scope=${encodeURIComponent(scope)}` : ""}${
    authType ? `&auth_type=${encodeURIComponent(authType)}` : ""
  }`;
  window.location.assign(authUrl);
  return authUrl;
};

export default {
  redirectToFacebookOAuth,
  consumeFacebookOAuthState,
  peekFacebookOAuthState,
};
