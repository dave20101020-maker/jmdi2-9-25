import React from "react";
import { themeTokens } from "@/components/ThemeProvider";

export default function Privacy() {
  return (
    <div className={`${themeTokens.card} space-y-4`}>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          NorthStar
        </p>
        <h1 className="text-2xl font-semibold text-white">Privacy Policy</h1>
        <p className="text-sm text-white/70">
          How we handle your data, consent, and platform safeguards.
        </p>
      </header>
      <div className="space-y-3 text-white/80 leading-relaxed">
        <p>
          We collect only what is necessary to deliver personalized guidance.
          All data is transmitted over TLS and stored using encrypted services.
        </p>
        <p>
          You can request export or deletion of your data at any time. Session
          cookies are used solely for secure authentication.
        </p>
        <p>
          AI-generated suggestions are non-diagnostic and should not replace
          professional advice.
        </p>
      </div>
    </div>
  );
}
