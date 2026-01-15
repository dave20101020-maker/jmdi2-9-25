import React from "react";
import { useLocation } from "react-router-dom";
import AITestPanel from "@/components/ai/AITestPanel";
import AuthDebugPanel from "@/components/auth/AuthDebugPanel";
import { AUTH_MODE } from "@/config/authMode";
import AIChatSurface from "@/ai/AIChatSurface";

export default function AppOverlays() {
  const location = useLocation();
  const pathname = location?.pathname || "";
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/sign-in" ||
    pathname === "/sign-up";

  if (isAuthRoute) return null;

  return (
    <>
      <AIChatSurface />
      <AITestPanel />
      {AUTH_MODE !== "PARKED" ? <AuthDebugPanel /> : null}
    </>
  );
}
