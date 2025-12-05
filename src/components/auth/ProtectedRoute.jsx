import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, redirectTo = "/sign-in" }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  const redirectTarget = redirectTo || "/sign-in";
  const shouldStoreReturnPath = location.pathname !== redirectTarget;

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
  const showErrorState = !loading && (isNetworkError || isNotFoundError);

  if (showErrorState) {
    return (
      <div className="ns-auth-shell" role="alert" aria-live="assertive">
        <div className="ns-auth-card space-y-4">
          <p className="ns-eyebrow">Session unavailable</p>
          <h1 className="ns-auth-title">We can't reach mission control</h1>
          <p className="text-sm text-white/70">
            {normalizedMessage ||
              "A network or access error prevented us from verifying your session."}
          </p>
          <div className="flex flex-col gap-3">
            <NSButton
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => window.location.reload()}
            >
              Retry connection
            </NSButton>
            <NSButton asChild size="lg" fullWidth>
              <Link to={redirectTarget}>Go to sign in</Link>
            </NSButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ns-auth-shell" role="status" aria-live="polite">
        <div className="ns-auth-card">
          <p className="ns-eyebrow">Syncing</p>
          <h1 className="ns-auth-title">Checking your session...</h1>
          <p className="text-sm text-white/70">
            Hold tight while we verify your mission credentials.
          </p>
        </div>
      </div>
    );
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
