import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Clock, AlertCircle } from "lucide-react";

const formatRecency = (days) => {
  if (days === null || days === undefined) return "No recent logs";
  if (days === 0) return "Logged today";
  if (days === 1) return "Logged yesterday";
  return `${days} days ago`;
};

export default function AIInsightFeed({ items = [], primaryFocus }) {
  const ordered = useMemo(() => {
    return [...items].sort((a, b) => (b.sortScore || 0) - (a.sortScore || 0));
  }, [items]);

  const empty = ordered.length === 0;

  return (
    <div className="ns-card mb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            AI Insight Feed
          </p>
          <p className="text-white/80 text-sm">
            Recent AI calls across pillars, sorted by relevance and recency.
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-ns-gold" aria-hidden />
      </div>

      {primaryFocus && (
        <div className="mt-4 rounded-xl border border-ns-gold/40 bg-ns-gold/10 px-4 py-3 text-sm text-white shadow-inner">
          <p className="text-xs uppercase tracking-[0.25em] text-ns-gold/80 mb-1">
            Primary focus
          </p>
          <p className="font-semibold text-white">
            {primaryFocus.pillarName}: {primaryFocus.focusArea}
          </p>
          <p className="text-white/80 text-sm mt-1">{primaryFocus.reasoning}</p>
        </div>
      )}

      {empty ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-white/70 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-white/50" aria-hidden />
          <div>
            <p className="font-semibold text-white">No AI insights yet</p>
            <p className="text-sm text-white/70">
              Log a few entries or habits to see AI-generated insights appear
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {ordered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span className="inline-flex items-center gap-2 rounded-full bg-ns-gold/15 px-2 py-0.5 text-xs font-semibold text-ns-gold">
                      {item.pillarName}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                      {item.focusArea}
                    </span>
                  </div>
                  <p className="font-semibold text-white mt-1">{item.title}</p>
                  <p className="text-sm text-white/80 mt-1">{item.summary}</p>
                </div>
                <div className="text-right text-xs text-white/60">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    <span>{formatRecency(item.lastEntryDays)}</span>
                  </div>
                  {item.pillarPath && (
                    <Link
                      to={item.pillarPath}
                      className="block mt-2 text-xs text-ns-gold hover:underline"
                    >
                      View pillar
                    </Link>
                  )}
                </div>
              </div>
              {item.microActions?.length > 0 && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {item.microActions.slice(0, 2).map((micro) => (
                    <div
                      key={micro.id || micro.label}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"
                    >
                      <p className="font-semibold text-white text-sm">
                        {micro.label}
                      </p>
                      <p className="text-white/70 mt-0.5">
                        {micro.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
