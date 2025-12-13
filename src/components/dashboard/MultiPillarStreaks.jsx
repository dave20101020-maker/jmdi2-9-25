import React from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, Clock } from "lucide-react";

const formatLastDate = (dateStr) => {
  if (!dateStr) return "No recent logs";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "No recent logs";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Logged today";
  if (diffDays === 1) return "Logged yesterday";
  return `${diffDays} days ago`;
};

export default function MultiPillarStreaks({
  overallCurrent,
  overallLongest,
  pillarStreaks = [],
}) {
  const hasData = pillarStreaks.some((p) => p.current > 0 || p.longest > 0);
  const topPillars = pillarStreaks
    .slice()
    .sort((a, b) => b.current - a.current || b.longest - a.longest)
    .slice(0, 4);

  return (
    <div className="ns-card mb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Streak tracker
          </p>
          <p className="text-white/80 text-sm">
            Current and personal-best streaks across your pillars.
          </p>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <div className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-sm">
            <Flame className="h-4 w-4 text-orange-300" aria-hidden />
            <span className="font-semibold">{overallCurrent ?? 0}d</span>
            <span className="text-white/60 text-xs">current</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-sm">
            <Trophy className="h-4 w-4 text-ns-gold" aria-hidden />
            <span className="font-semibold">{overallLongest ?? 0}d</span>
            <span className="text-white/60 text-xs">best</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/80">
          No streak data yet. Log entries or habits to start tracking streaks.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {topPillars.map((pillar) => (
            <div
              key={pillar.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-white">
                    {pillar.name}
                  </p>
                  <p className="text-xs text-white/60">
                    {formatLastDate(pillar.lastDate)}
                  </p>
                </div>
                <div className="flex gap-2 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-1">
                    <Flame
                      className="h-3.5 w-3.5 text-orange-300"
                      aria-hidden
                    />
                    <span className="font-semibold">{pillar.current}d</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-ns-gold/15 px-2 py-1">
                    <Trophy className="h-3.5 w-3.5 text-ns-gold" aria-hidden />
                    <span className="font-semibold">{pillar.longest}d</span>
                  </span>
                </div>
              </div>
              {pillar.path && (
                <Link
                  to={pillar.path}
                  className="mt-2 inline-flex items-center gap-2 text-xs text-ns-gold hover:underline"
                >
                  View pillar
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
