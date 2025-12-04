import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, redirectTo = "/sign-in" }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}
