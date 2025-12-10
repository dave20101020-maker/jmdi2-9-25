import React from "react";
import { themeTokens } from "@/components/ThemeProvider";

export default function Terms() {
  return (
    <div className={`${themeTokens.card} space-y-4`}>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          NorthStar
        </p>
        <h1 className="text-2xl font-semibold text-white">Terms of Service</h1>
        <p className="text-sm text-white/70">
          Key expectations for account use, billing, and consent.
        </p>
      </header>
      <div className="space-y-3 text-white/80 leading-relaxed">
        <p>
          By using NorthStar you agree to keep your account secure and to
          refrain from sharing login credentials. You may cancel subscriptions
          at any time; renewals follow your billing cycle.
        </p>
        <p>
          The platform is provided as-is with non-diagnostic guidance. Always
          consult licensed professionals for medical, mental health, or
          financial decisions.
        </p>
        <p>Continued use constitutes acceptance of updates to these terms.</p>
      </div>
    </div>
  );
}
