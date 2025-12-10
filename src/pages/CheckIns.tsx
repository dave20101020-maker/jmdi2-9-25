import React from "react";
import { themeTokens } from "@/components/ThemeProvider";

export default function CheckIns() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            NorthStar
          </p>
          <h1 className="text-2xl font-semibold text-white">Check-ins</h1>
          <p className="text-sm text-white/70">
            Record daily and weekly reflections to keep your streaks healthy.
          </p>
        </div>
        <div className={`${themeTokens.buttonPrimary} hidden md:inline-flex`}>
          New check-in
        </div>
      </header>

      <section className={`${themeTokens.card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">Today</p>
            <p className="text-lg font-semibold text-white">No entries yet</p>
          </div>
          <button className={themeTokens.buttonGhost}>
            Log a quick check-in
          </button>
        </div>
        <div className="rounded-xl border border-[var(--ns-color-border)] bg-[var(--ns-color-surface)]/60 p-4 text-white/80">
          Check-in data will sync with your habits and pillar dashboards once
          the API endpoints are connected.
        </div>
      </section>
    </div>
  );
}
