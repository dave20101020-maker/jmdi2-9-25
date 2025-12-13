import React from "react";
import { themeTokens } from "@/components/ThemeProvider";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PillarScaffold({
  id,
  title,
  scoreLabel = "Pillar Score",
  score,
  intent,
  aiNote,
  sections,
  roadmapHint,
}) {
  return (
    <div className="space-y-6">
      <header
        className={`${themeTokens.card} p-4 flex flex-wrap items-start justify-between gap-4`}
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            {title}
          </p>
          <h1 className="text-2xl font-semibold text-white">{intent}</h1>
          <p className="text-sm text-white/70">Goal roadmap: {roadmapHint}</p>
        </div>
        <div className={`${themeTokens.panel} px-4 py-3 text-right`}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            {scoreLabel}
          </p>
          <p className="text-3xl font-bold text-white">{score}</p>
          <p className="text-[11px] text-white/60">
            Mocked · linked to AI insights
          </p>
        </div>
      </header>

      <section
        className={`${themeTokens.panel} p-4 flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2 text-white/80">
          <Sparkles className="h-4 w-4 text-ns-gold" />
          <span className="text-sm">
            Context-aware AI chat ready for {title.toLowerCase()}
          </span>
        </div>
        <a
          href="#northstar-ai"
          className={`${themeTokens.buttonPrimary} inline-flex items-center gap-2`}
        >
          Ask NorthStar <ArrowRight className="h-4 w-4" />
        </a>
      </section>

      <div className="grid gap-4">
        {sections.map((section) => (
          <article
            key={section.title}
            className={`${themeTokens.card} p-4 space-y-3`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  {section.kicker}
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-sm text-white/70">{section.subtitle}</p>
                )}
              </div>
              {section.action}
            </div>
            <div className="space-y-3 text-sm text-white/80">
              {section.content}
            </div>
          </article>
        ))}
      </div>

      {aiNote && (
        <div className={`${themeTokens.panel} p-3 text-xs text-white/70`}>
          {aiNote}
        </div>
      )}
    </div>
  );
}
