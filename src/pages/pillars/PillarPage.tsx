import React from "react";
import { useParams } from "react-router-dom";
import { themeTokens } from "@/components/ThemeProvider";
import { PILLARS } from "@/config/pillars";
import { getPillarContent } from "./pillarContent";

const findPillar = (id: string | undefined) =>
  PILLARS.find((pillar) => pillar.id === id?.toLowerCase());

type PillarPageProps = {
  pillarId?: string;
};

export default function PillarPage({ pillarId: pillarIdProp }: PillarPageProps) {
  const { pillarId: routePillarId } = useParams();
  const activePillarId = (pillarIdProp ?? routePillarId ?? "").toLowerCase();
  const pillar = findPillar(activePillarId);
  const content = getPillarContent(pillar?.id);

  return (
    <div className="space-y-6">
      <header className={`${themeTokens.panel} space-y-3 p-4`}>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">Pillar</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">{pillar?.label || "Pillar overview"}</h1>
            <p className="text-sm text-white/70">{content.intent}</p>
          </div>
          <div className="rounded-xl border border-[var(--ns-color-border)] bg-white/5 px-4 py-3 text-right shadow-ns-card">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">NorthStar Score</p>
            <p className="text-3xl font-bold text-white">Coming soon</p>
            <p className="text-xs text-white/60">Live data from /api/pillars/{pillar?.id ?? "id"}</p>
          </div>
        </div>
      </header>
      <section className={`${themeTokens.card} space-y-4 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Today's intent</p>
            <p className="text-lg font-semibold text-white">{content.hero}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={themeTokens.buttonGhost}>View habits</button>
            <button className={themeTokens.buttonPrimary}>Add quick win</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} space-y-1 p-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Readiness</p>
            <p className="text-lg font-semibold text-white">Balanced</p>
            <p className="text-xs text-white/60">COM-B mix loads evenly across capability, opportunity, and motivation.</p>
          </div>
          <div className={`${themeTokens.panel} space-y-1 p-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Streak</p>
            <p className="text-lg font-semibold text-white">3 days</p>
            <p className="text-xs text-white/60">Keep streaks gentle—no pressure mechanics.</p>
          </div>
          <div className={`${themeTokens.panel} space-y-1 p-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Next review</p>
            <p className="text-lg font-semibold text-white">Weekly</p>
            <p className="text-xs text-white/60">AI summaries will appear after check-ins sync.</p>
          </div>
        </div>
      </section>
      <section className={`${themeTokens.card} space-y-3 p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Focus areas</h2>
          <span className="rounded-full bg-ns-gold/10 px-3 py-1 text-xs font-semibold text-ns-gold">Preview</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {content.focusAreas.map((area) => (
            <div