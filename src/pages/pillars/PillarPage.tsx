import React from "react";
import { useParams } from "react-router-dom";
import { themeTokens } from "@/components/ThemeProvider";
import { PILLARS } from "@/config/pillars";

const findPillar = (id: string | undefined) =>
  PILLARS.find((pillar) => pillar.id === id?.toLowerCase());

export default function PillarPage() {
  const { pillarId } = useParams();
  const pillar = findPillar(pillarId);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          Pillar
        </p>
        <h1 className="text-2xl font-semibold text-white">
          {pillar?.label || "Pillar overview"}
        </h1>
        <p className="text-sm text-white/70">
          Trend charts and habit recommendations will appear here for
          <span className="font-semibold text-white">
            {" "}
            {pillar?.label || pillarId}
          </span>
          .
        </p>
      </header>

      <section className={`${themeTokens.card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">NorthStar Score</p>
            <p className="text-3xl font-bold text-white">Coming soon</p>
          </div>
          <button className={themeTokens.buttonPrimary}>Add quick win</button>
        </div>
        <div className="rounded-xl border border-[var(--ns-color-border)] bg-[var(--ns-color-surface)]/60 p-4 text-white/80">
          Pillar insights will fetch from `/api/pillars/:id` once the data layer
          is wired up.
        </div>
      </section>
    </div>
  );
}
