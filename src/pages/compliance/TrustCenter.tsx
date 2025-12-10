import React from "react";
import { themeTokens } from "@/components/ThemeProvider";

export default function TrustCenter() {
  return (
    <div className={`${themeTokens.card} space-y-4`}>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          NorthStar
        </p>
        <h1 className="text-2xl font-semibold text-white">Trust Center</h1>
        <p className="text-sm text-white/70">
          Security, reliability, and responsible AI practices.
        </p>
      </header>
      <div className="space-y-3 text-white/80 leading-relaxed">
        <p>
          We prioritize encryption in transit and at rest, role-based access
          controls, and regular audits of critical services.
        </p>
        <p>
          AI systems are monitored for safety and bias; escalations surface to
          humans-in-the-loop where needed.
        </p>
        <p>
          Report security concerns to security@northstar.app for a rapid review.
        </p>
      </div>
    </div>
  );
}
