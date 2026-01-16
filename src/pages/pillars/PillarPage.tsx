import React from "react";
import { useParams } from "react-router-dom";
import { themeTokens } from "@/components/ThemeProvider";
import { PILLARS } from "@/config/pillars";
import { getPillarContent } from "./pillarContent";

const findPillar = (pillarId: string | undefined) =>
  PILLARS.find((pillar) => pillar.id === pillarId?.toLowerCase());

type PillarPageProps = {
  pillarId?: string;
};

export default function PillarPage({
  pillarId: pillarIdProp,
}: PillarPageProps) {
  const { pillarId: routePillarId } = useParams();
  const activePillarId = (pillarIdProp ?? routePillarId ?? "").toLowerCase();
  const pillar = findPillar(activePillarId);
  const content = getPillarContent(pillar?.id);
  const pillarKey = (pillar?.id ?? activePillarId).toLowerCase();

  const openPillarCoach = () => {
    const label = pillar?.label || "this pillar";
    window.dispatchEvent(
      new CustomEvent("northstar:open", {
        detail: {
          mode: "pillar",
          agentId: activePillarId,
          draft: `I'm in the ${label} pillar. Help me with one concrete next step today.`,
        },
      })
    );
  };

  return (
    <div className="pillar-page space-y-6" data-pillar={pillarKey}>
      <header className={`pillar-header ${themeTokens.panel} space-y-3 p-4`}>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          Pillar
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">
              {pillar?.label || "Pillar overview"}
            </h1>
            <p className="text-sm text-white/70">{content.intent}</p>
          </div>
          <div className="pillar-header__score rounded-xl border border-[var(--ns-color-border)] bg-white/5 px-4 py-3 text-right shadow-ns-card">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              NorthStar Score
            </p>
            <p className="text-3xl font-bold text-white">Coming soon</p>
            <p className="text-xs text-white/60">
              Live data from /api/pillars/{pillar?.id ?? "id"}
            </p>
          </div>
        </div>
      </header>

      <section className={`pillar-section ${themeTokens.card} space-y-4 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              Today's intent
            </p>
            <p className="text-lg font-semibold text-white">{content.hero}</p>
            <p className="text-xs text-white/60">
              {pillar?.summary ??
                "Drop into a pillar above to read its summary."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className={themeTokens.buttonGhost}>View habits</button>
            <button className={themeTokens.buttonPrimary}>Add quick win</button>
            <button
              type="button"
              className={themeTokens.buttonGhost}
              onClick={openPillarCoach}
            >
              Ask {pillar?.label || "Pillar"} Soldier
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} space-y-1 p-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Readiness
            </p>
            <p className="text-lg font-semibold text-white">Balanced</p>
            <p className="text-xs text-white/60">
              COM-B mix loads evenly across capability, opportunity, and
              motivation.
            </p>
          </div>
          <div className={`${themeTokens.panel} space-y-1 p-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Streak
            </p>
            <p className="text-lg font-semibold text-white">3 days</p>
            <p className="text-xs text-white/60">
              Keep streaks gentle—no pressure mechanics.
            </p>
          </div>
          <div className={`${themeTokens.panel} space-y-1 p-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Next review
            </p>
            <p className="text-lg font-semibold text-white">Weekly</p>
            <p className="text-xs text-white/60">
              AI summaries will appear after check-ins sync.
            </p>
          </div>
        </div>
      </section>

      <section className={`pillar-section ${themeTokens.card} space-y-3 p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Focus areas</h2>
          <span className="rounded-full bg-ns-gold/10 px-3 py-1 text-xs font-semibold text-ns-gold">
            Preview
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {content.focusAreas.map((area) => (
            <article
              key={area.label}
              className={`${themeTokens.panel} rounded-xl p-3`}
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/50">
                {area.label}
              </p>
              <p className="mt-2 text-sm text-white/80">{area.description}</p>
              <p className="mt-3 text-xs font-semibold text-ns-gold">
                {area.metric}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`pillar-section ${themeTokens.card} space-y-3 p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Quick wins</h2>
          <p className="text-xs text-white/60">
            2-5 minute wins you can try now
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {content.quickWins.map((win) => (
            <article
              key={win.label}
              className={`${themeTokens.panel} space-y-2 rounded-xl p-3`}
            >
              <p className="text-sm font-semibold text-white">{win.label}</p>
              <p className="text-xs text-white/70">{win.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`pillar-section ${themeTokens.card} space-y-3 p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Rituals & reminders
          </h2>
          <p className="text-xs text-white/60">Make them sticky</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {content.rituals.map((ritual) => (
            <li
              key={ritual}
              className={`${themeTokens.panel} rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm text-white/70`}
            >
              {ritual}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
