import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 items-start rounded-xl border border-[var(--ns-color-border)] bg-[var(--ns-color-card)]/60 px-4 py-3 text-sm text-[var(--ns-color-card-foreground)] ${className}`}
      role="note"
      aria-label="Non-diagnostic disclaimer"
    >
      <AlertTriangle className="h-5 w-5 text-ns-gold shrink-0" aria-hidden />
      <p>
        NorthStar provides non-diagnostic wellbeing guidance. It does not
        replace professional medical, financial, or mental health advice. If you
        are experiencing an emergency, please seek immediate in-person support.
      </p>
    </div>
  );
}
