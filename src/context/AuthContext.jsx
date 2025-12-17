import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { api } from "@/utils/apiClient";
import { redirectToGoogleOAuth } from "@/lib/oauth/google";
import { redirectToFacebookOAuth } from "@/lib/oauth/facebook";

const noop = async () => null;

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  authStatus: "checking",
  initializing: true,
  loading: true,
  error: null,
  authMechanism: "httpOnly-cookie",
  lastAuthCheck: { at: null, status: "unknown", error: null },
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

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const SESSION_TIMEOUT_MS = 8000;

const withTimeout = async (promise, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("Session verification timed out");
      error.status = "timeout";
      reject(error);
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const snapshotAuthStorage = () => {
  if (typeof window === "undefined") {
    return {
      localStorageToken: false,
      localStorageJwt: false,
      persistedUserStore: false,
    };
  }

  return {
    localStorageToken: Boolean(localStorage.getItem("token")),
    localStorageJwt: Boolean(localStorage.getItem("jwt")),
    persistedUserStore: Boolean(localStorage.getItem("northstar-user-storage")),
  };
};

const userLabel = (u) => u?._id || u?.id || u?.email || null;

const authInfo = (message, detail = {}) => {
  console.info("[AUTH]", message, detail);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState("checking");
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [lastAuthCheck, setLastAuthCheck] = useState({
    at: null,
    status: "unknown",
    error: null,
  });
  const loadingRef = useRef(false);
  const lastKnownUserRef = useRef(null);

  const syncUser = useCallback((nextUser) => {
    lastKnownUserRef.current = nextUser ?? null;
    setUser(nextUser ?? null);
    setIsAuthenticated(Boolean(nextUser));
    setAuthStatus(nextUser ? "authenticated" : "guest");
    authInfo("Auth state update", {
      isAuthenticated: Boolean(nextUser),
      user: userLabel(nextUser),
    });
    return nextUser ?? null;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      authInfo("Verify session (/api/auth/me) start", {
        mechanism: "httpOnly-cookie",
        storage: snapshotAuthStorage(),
      });
      const response = await withTimeout(api.me(), SESSION_TIMEOUT_MS);
      const sessionUser = extractUser(response);
      setAuthError(null);
      setIsAuthenticated(true);
      setLastAuthCheck({
        at: new Date().toISOString(),
        status: "ok",
        error: null,
      });
      setAuthStatus("authenticated");
      authInfo("Verify session (/api/auth/me) success", {
        isAuthenticated: true,
        user: userLabel(sessionUser),
      });
      if (sessionUser) {
        return syncUser(sessionUser);
      }
      return lastKnownUserRef.current;
    } catch (error) {
      if (error?.status === "timeout") {
        setLastAuthCheck({
          at: new Date().toISOString(),
          status: "degraded",
          error: error?.message || "timeout",
        });
        setIsAuthenticated(Boolean(lastKnownUserRef.current));
        setAuthStatus(lastKnownUserRef.current ? "authenticated" : "guest");
        authInfo("Verify session (/api/auth/me) timeout", {
          status: error?.status,
          message: error?.message,
        });
        return lastKnownUserRef.current;
      }

      if (error?.status === 401 || error?.status === 403) {
        setLastAuthCheck({
          at: new Date().toISOString(),
          status: "unauthenticated",
          error: null,
        });
        setIsAuthenticated(false);
        setAuthStatus("guest");
        setAuthError(null);
        authInfo("Verify session (/api/auth/me) unauthorized", {
          status: error?.status,
        });
        syncUser(null);
        return null;
      }
      setLastAuthCheck({
        at: new Date().toISOString(),
        status: "error",
        error: error?.message || "unknown",
      });
      setAuthError(error);
      setIsAuthenticated(Boolean(lastKnownUserRef.current));
      setAuthStatus(lastKnownUserRef.current ? "authenticated" : "guest");
      authInfo("Verify session (/api/auth/me) error", {
        message: error?.message,
        status: error?.status,
      });
      return lastKnownUserRef.current;
    } finally {
      setInitializing(false);
    }
  }, [syncUser]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      authInfo("App load: start auth rehydrate", {
        mechanism: "httpOnly-cookie",
        storage: snapshotAuthStorage(),
      });
      try {
        const resolvedUser = await refreshUser();
        setAuthError(null);
        authInfo("App load: auth rehydrate complete", {
          isAuthenticated: Boolean(resolvedUser),
          user: userLabel(resolvedUser),
        });
      } catch (error) {
        if (!(error?.status === 401 || error?.status === 403)) {
          console.error("[AuthProvider] Unable to resolve auth state", error);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
          setLoading(false);
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
        authInfo("Login submit", {
          email: (emailOrUsername || "").toString().trim(),
          mechanism: "httpOnly-cookie",
        });
        const response = await api.login(emailOrUsername.trim(), password);
        const sessionUser = extractUser(response);
        authInfo("Login API response", {
          ok: true,
          user: userLabel(sessionUser),
          storage: snapshotAuthStorage(),
          note: "httpOnly session cookie not readable via JS",
        });
        return syncUser(sessionUser);
      } catch (error) {
        setAuthError(error);
        authInfo("Login API error", {
          ok: false,
          status: error?.status || error?.statusCode || error?.response?.status,
          message: error?.message,
        });
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
        const response = await api.register(
          normalizedEmail,
          password,
          profile.fullName || username
        );
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

  const value = useMemo(() => {
    if (DEMO_MODE) {
      return {
        user: { id: "demo-user", name: "Demo User" },
        isAuthenticated: true,
        authStatus: "authenticated",
        initializing: false,
        loading: false,
        error: null,
        authMechanism: "demo",
        lastAuthCheck: {
          at: new Date().toISOString(),
          status: "ok",
          error: null,
        },
        demoMode: true,
        signIn: noop,
        signUp: noop,
        signOut: noop,
        signInWithGoogle: noop,
        signInWithFacebook: noop,
        resetPassword: noop,
        refreshUser: noop,
      };
    }
    return {
      user,
      isAuthenticated,
      authStatus,
      initializing,
      loading,
      error: authError,
      authMechanism: "httpOnly-cookie",
      lastAuthCheck,
      demoMode: false,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithFacebook,
      resetPassword,
      refreshUser,
    };
  }, [
    user,
    isAuthenticated,
    authStatus,
    initializing,
    loading,
    authError,
    lastAuthCheck,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
    refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthContext;
