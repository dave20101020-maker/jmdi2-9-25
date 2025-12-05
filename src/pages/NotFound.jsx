import React from "react";
import { Link, useLocation } from "react-router-dom";
import NSButton from "@/components/ui/NSButton";
import { NAMED_ROUTES } from "@/config/routes";

export default function NotFound() {
  const location = useLocation();
  const displayPath = location.pathname || "this page";

  return (
    <div
      className="ns-auth-shell min-h-screen"
      role="alert"
      aria-live="assertive"
    >
      <div className="ns-auth-card space-y-4 text-center">
        <p className="ns-eyebrow">Course deviation</p>
        <h1 className="ns-auth-title">We lost these coordinates</h1>
        <p className="text-sm text-white/70">
          We can't find{" "}
          <span className="text-white font-medium">{displayPath}</span>. Try
          heading back to a safe waypoint.
        </p>
        <div className="flex flex-col gap-3">
          <NSButton asChild size="lg" fullWidth>
            <Link to={NAMED_ROUTES.Dashboard}>Back to dashboard</Link>
          </NSButton>
          <NSButton asChild variant="ghost" size="lg" fullWidth>
            <Link to={NAMED_ROUTES.Pricing}>Browse plans</Link>
          </NSButton>
        </div>
      </div>
    </div>
  );
}
