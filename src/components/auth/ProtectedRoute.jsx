import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import NSButton from "@/components/ui/NSButton";
import ConnectionIssue from "@/components/fallbacks/ConnectionIssue";
import RouteLoader from "@/components/fallbacks/RouteLoader";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, redirectTo = "/sign-in" }) {
  const DISABLE_PROTECTION = import.meta.env.VITE_DISABLE_PROTECTION === "true";
  const { user, initializing, error, demoMode } = useAuth();
  const DEMO_INIT_TIMEOUT_MS = Number(
    import.meta.env.VITE_DEMO_INIT_TIMEOUT_MS || 3000
  );
  const location = useLocation();
  const redirectTarget = redirectTo || "/sign-in";
  const shouldStoreReturnPath = location.pathname !== redirectTarget;

  // Demo mode: skip auth checks and render immediately
  if (DISABLE_PROTECTION || demoMode === true) {
    return children || <Outlet />;
  }

  // In case initialization hangs due to backend issues, allow a timed bypass in demo builds
  if (initializing && DEMO_INIT_TIMEOUT_MS > 0) {
    const [expired, setExpired] = React.useState(false);
    React.useEffect(() => {
      const t = setTimeout(() => setExpired(true), DEMO_INIT_TIMEOUT_MS);
      return () => clearTimeout(t);
    }, [DEMO_INIT_TIMEOUT_MS]);
    if (expired) {
      return children || <Outlet />;
    }
  }

  const errorStatus =
    error?.status || error?.statusCode || error?.response?.status || null;
  const errorMessage = typeof error === "string" ? error : error?.message || "";
  const normalizedMessage = errorMessage?.trim();
  const normalizedMessageLower = normalizedMessage
    ? normalizedMessage.toLowerCase()
    : "";
  const isNetworkError = Boolean(
    error &&
      (error?.code === "ERR_NETWORK" ||
        normalizedMessageLower.includes("network") ||
        normalizedMessageLower.includes("failed to fetch"))
  );
  const isNotFoundError =
    errorStatus === 404 || error?.code === "auth/user-not-found";
  const showErrorState = !initializing && (isNetworkError || isNotFoundError);

  if (showErrorState) {
    return (
      <ConnectionIssue
        status={isNetworkError ? "offline" : "error"}
        title={
          isNetworkError
            ? "Unable to reach mission control"
            : "Session unavailable"
        }
        subtitle={
          normalizedMessage ||
          "A transient network error prevented us from verifying your session."
        }
        details={
          isNetworkError
            ? "Check your connection or VPN, then retry."
            : "Your session may have expired. Sign in again to continue."
        }
        onRetry={() => window.location.reload()}
        action={
          <NSButton asChild size="lg" fullWidth>
            <Link to={redirectTarget}>Return to sign in</Link>
          </NSButton>
        }
      />
    );
  }

  if (initializing) {
    return <RouteLoader message="Verifying your mission credentials..." />;
  }

  if (!user) {
    return (
      <Navigate
        to={redirectTarget}
        replace
        state={shouldStoreReturnPath ? { from: location } : undefined}
      />
    );
  }

  return children || <Outlet />;
}
