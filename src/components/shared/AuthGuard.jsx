import React from "react";
import SignIn from "@/pages/auth/SignIn";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_MODE } from "@/config/authMode";

export default function AuthGuard({ children }) {
  const { user, isAuthenticated, initializing } = useAuth();

  if (AUTH_MODE === "PARKED") {
    const parkedUser = user || { id: "parked-user", name: "Parked User" };
    return (
      <>{typeof children === "function" ? children(parkedUser) : children}</>
    );
  }

  if (initializing) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <SignIn />;
  }

  return <>{typeof children === "function" ? children(user) : children}</>;
}
