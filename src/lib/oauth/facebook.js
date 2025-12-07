import api from "@/utils/apiClient";

const STATE_STORAGE_KEY = "ns_facebook_oauth_state";
export const FACEBOOK_CALLBACK_PATH = "/auth/facebook/callback";

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

export const buildFacebookRedirectUrl = ({
  redirectUri,
  state,
  scope = "public_profile,email",
  authType,
} = {}) => {
  if (!api?.baseUrl) {
    throw new Error("Backend base URL is not configured");
  }
  const url = new URL("/api/auth/facebook", api.baseUrl);
  if (redirectUri) {
    url.searchParams.set("redirect_uri", redirectUri);
  }
  if (state) {
    url.searchParams.set("state", state);
  }
  if (scope) {
    url.searchParams.set("scope", scope);
  }
  if (authType) {
    url.searchParams.set("auth_type", authType);
  }
  url.searchParams.set("mode", "redirect");
  return url.toString();
};

export const getFacebookCallbackUrl = (
  callbackPath = FACEBOOK_CALLBACK_PATH
) => {
  if (!isBrowser()) return null;
  const normalizedPath = callbackPath.startsWith("/")
    ? callbackPath
    : `/${callbackPath}`;
  return `${window.location.origin}${normalizedPath}`;
};

export const redirectToFacebookOAuth = ({
  callbackPath = FACEBOOK_CALLBACK_PATH,
  scope,
  authType,
} = {}) => {
  if (!isBrowser()) {
    throw new Error("Facebook sign-in is only available in the browser");
  }
  const redirectUri = getFacebookCallbackUrl(callbackPath);
  if (!redirectUri) {
    throw new Error("Unable to determine OAuth callback URL");
  }
  const state = generateStateValue();
  persistState(state);
  const authUrl = buildFacebookRedirectUrl({
    redirectUri,
    state,
    scope,
    authType,
  });
  window.location.assign(authUrl);
  return authUrl;
};

export default {
  FACEBOOK_CALLBACK_PATH,
  redirectToFacebookOAuth,
  buildFacebookRedirectUrl,
  consumeFacebookOAuthState,
  peekFacebookOAuthState,
  getFacebookCallbackUrl,
};
