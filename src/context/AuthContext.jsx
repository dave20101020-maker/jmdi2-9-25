import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { useAuth0 } from "@auth0/auth0-react";
import { api } from "@/utils/apiClient";
import { redirectToGoogleOAuth } from "@/lib/oauth/google";
import { redirectToFacebookOAuth } from "@/lib/oauth/facebook";
import { AUTH_MODE } from "@/config/authMode";

let parkedLogEmitted = false;
const logParkedOnce = () => {
  if (parkedLogEmitted) return;
  parkedLogEmitted = true;
  console.info("[AUTH] Auth is PARKED — authentication bypassed");
};

const noop = async () => null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
const PARKED_MODE = AUTH_MODE === "PARKED";
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
  if (PARKED_MODE) logParkedOnce();

  const {
    isLoading: auth0Loading,
    isAuthenticated: auth0Authenticated,
    getIdTokenClaims,
  } = useAuth0();

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
  const exchangeDoneRef = useRef(false);
  const exchangeInFlightRef = useRef(false);

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
    if (PARKED_MODE) {
      logParkedOnce();
      const parkedUser = { id: "parked-user", name: "Parked User" };
      setAuthError(null);
      setUser(parkedUser);
      setIsAuthenticated(true);
      setAuthStatus("authenticated");
      setLastAuthCheck({
        at: new Date().toISOString(),
        status: "ok",
        error: null,
      });
      setInitializing(false);
      return parkedUser;
    }

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

  const hydrateFromBackend = useCallback(async (signal) => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      });

      if (!res.ok) {
        return { ok: false, status: res.status };
      }

      const data = await res.json().catch(() => null);
      return { ok: true, user: extractUser(data) };
    } catch (error) {
      if (error?.name === "AbortError") return { ok: false, aborted: true };
      return { ok: false, error };
    }
  }, []);

  const exchangeSession = useCallback(
    async (signal) => {
      if (exchangeDoneRef.current) return { ok: true, skipped: true };
      if (exchangeInFlightRef.current) return { ok: false, inFlight: true };
      exchangeInFlightRef.current = true;

      try {
        const claims = await getIdTokenClaims();
        const raw = claims?.__raw;
        if (!raw) return { ok: false, error: "missing_id_token" };

        const res = await fetch("/api/auth/auth0/exchange", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${raw}`,
            Accept: "application/json",
          },
          signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          return {
            ok: false,
            error: `exchange_failed:${res.status}`,
            details: txt,
          };
        }

        exchangeDoneRef.current = true;
        return { ok: true };
      } finally {
        exchangeInFlightRef.current = false;
      }
    },
    [getIdTokenClaims]
  );

  useEffect(() => {
    if (PARKED_MODE) {
      const parkedUser = { id: "parked-user", name: "Parked User" };
      setAuthError(null);
      setUser(parkedUser);
      setIsAuthenticated(true);
      setAuthStatus("authenticated");
      setLastAuthCheck({
        at: new Date().toISOString(),
        status: "ok",
        error: null,
      });
      setInitializing(false);
      setLoading(false);
      return undefined;
    }

    const ac = new AbortController();
    let cancelled = false;

    const load = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setInitializing(true);
      setAuthError(null);
      setAuthStatus("checking");

      try {
        // 1) Try backend session first (fast path)
        const first = await hydrateFromBackend(ac.signal);
        if (!cancelled && first.ok) {
          syncUser(first.user);
          setLastAuthCheck({
            at: new Date().toISOString(),
            status: "ok",
            error: null,
          });
          return;
        }

        // 2) If Auth0 isn't ready yet, wait briefly (prevents race)
        if (auth0Loading) {
          await sleep(50);
        }

        // 3) If Auth0 says logged in, do ONE exchange then re-hydrate backend
        if (!auth0Loading && auth0Authenticated) {
          setAuthStatus("exchanging");
          const ex = await exchangeSession(ac.signal);
          if (ex.ok) {
            const second = await hydrateFromBackend(ac.signal);
            if (!cancelled && second.ok) {
              syncUser(second.user);
              setLastAuthCheck({
                at: new Date().toISOString(),
                status: "ok",
                error: null,
              });
              return;
            }
          }
        }

        // 4) Otherwise: logged out
        if (!cancelled) {
          syncUser(null);
          setLastAuthCheck({
            at: new Date().toISOString(),
            status: "unauthenticated",
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[auth] init failed:", error);
          syncUser(null);
          setLastAuthCheck({
            at: new Date().toISOString(),
            status: "error",
            error: error?.message || "unknown",
          });
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
          setLoading(false);
          if (!lastKnownUserRef.current) {
            setAuthStatus("guest");
          }
        }
        loadingRef.current = false;
      }
    };

    load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [
    auth0Loading,
    auth0Authenticated,
    exchangeSession,
    hydrateFromBackend,
    syncUser,
  ]);

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
    if (PARKED_MODE) {
      logParkedOnce();
      return {
        user: { id: "parked-user", name: "Parked User" },
        isAuthenticated: true,
        authStatus: "authenticated",
        initializing: false,
        loading: false,
        error: null,
        authMechanism: "parked",
        lastAuthCheck: {
          at: new Date().toISOString(),
          status: "ok",
          error: null,
        },
        demoMode: false,
        parkedMode: true,
        signIn: noop,
        signUp: noop,
        signOut: noop,
        signInWithGoogle: noop,
        signInWithFacebook: noop,
        resetPassword: noop,
        refreshUser: noop,
      };
    }

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
        parkedMode: false,
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
      parkedMode: false,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithFacebook,
      resetPassword,
      refreshUser,
    };
  }, [
    // NOTE: PARKED_MODE is a build-time constant; included for clarity.
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
