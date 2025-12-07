import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import api from "@/utils/apiClient";
import { redirectToGoogleOAuth } from "@/lib/oauth/google";
import { redirectToFacebookOAuth } from "@/lib/oauth/facebook";

const noop = async () => null;

const AuthContext = createContext({
  user: null,
  initializing: true,
  loading: true,
  error: null,
  signIn: noop,
  signUp: noop,
  signOut: noop,
  signInWithGoogle: noop,
  signInWithFacebook: noop,
  resetPassword: noop,
  refreshUser: noop,
});

const extractUser = (payload) =>
  payload?.data ?? payload?.user ?? payload ?? null;

const sanitizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const buildUsername = (email, profile = {}) => {
  const baseSource =
    profile.username ||
    profile.displayName ||
    profile.fullName ||
    (email ? email.split("@")[0] : "") ||
    "pilot";

  const normalized = baseSource
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);

  const suffix = Math.random().toString(36).slice(2, 6);
  const candidate = `${normalized || "pilot"}${suffix}`.slice(0, 30);
  return candidate;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const loadingRef = useRef(false);

  const syncUser = useCallback((nextUser) => {
    setUser(nextUser ?? null);
    return nextUser ?? null;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.authMe();
      const sessionUser = extractUser(response);
      return syncUser(sessionUser);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        syncUser(null);
        return null;
      }
      setAuthError(error);
      throw error;
    }
  }, [syncUser]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        await refreshUser();
        setAuthError(null);
      } catch (error) {
        if (!(error?.status === 401 || error?.status === 403)) {
          console.error("[AuthProvider] Unable to resolve auth state", error);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
        loadingRef.current = false;
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const signIn = useCallback(
    async (emailOrUsername, password) => {
      try {
        setAuthError(null);
        const response = await api.authLogin(emailOrUsername.trim(), password);
        const sessionUser = extractUser(response);
        return syncUser(sessionUser);
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [syncUser]
  );

  const signUp = useCallback(
    async (email, password, profile = {}) => {
      const normalizedEmail = sanitizeEmail(email);
      const username = buildUsername(normalizedEmail, profile);
      try {
        setAuthError(null);
        const response = await api.authRegister({
          username,
          email: normalizedEmail,
          password,
          subscriptionTier: profile.subscriptionTier || "free",
          role: profile.role || "user",
        });
        const sessionUser = extractUser(response);
        return syncUser(sessionUser);
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [syncUser]
  );

  const signOut = useCallback(async () => {
    try {
      setAuthError(null);
      await api.logout();
    } catch (error) {
      setAuthError(error);
      throw error;
    } finally {
      syncUser(null);
    }
  }, [syncUser]);

  const signInWithGoogle = useCallback(async (options = {}) => {
    redirectToGoogleOAuth(options);
    return null;
  }, []);

  const signInWithFacebook = useCallback(async (options = {}) => {
    redirectToFacebookOAuth(options);
    return null;
  }, []);

  const resetPassword = useCallback(async () => {
    throw new Error(
      "Password reset via email is not yet available. Please contact support."
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      loading: initializing,
      error: authError,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithFacebook,
      resetPassword,
      refreshUser,
    }),
    [
      user,
      initializing,
      authError,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithFacebook,
      resetPassword,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthContext;
