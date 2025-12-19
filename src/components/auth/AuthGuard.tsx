import React from "react";
import Login from "@/pages/Login";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_MODE } from "@/config/authMode";

export default function AuthGuard({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  if (AUTH_MODE === "PARKED") {
    return <>{children}</>;
  }
  const { user, isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm opacity-80">Verifying your NorthStar session…</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return <>{children}</>;
}
