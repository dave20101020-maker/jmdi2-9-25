import React from "react";
import RouteLoader from "@/components/fallbacks/RouteLoader";
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
    return <RouteLoader message="Verifying your NorthStar session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return <>{children}</>;
}
