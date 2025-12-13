import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { themeTokens } from "@/components/ThemeProvider";
import {
  ArrowRight,
  GitBranch,
  LineChart as LineIcon,
  Link2,
  Radar,
  Sparkles,
} from "lucide-react";

const baseData = [
  { day: "Mon", sleep: 78, diet: 70, exercise: 74, mental: 72 },
  { day: "Tue", sleep: 80, diet: 68, exercise: 72, mental: 71 },
  { day: "Wed", sleep: 76, diet: 69, exercise: 75, mental: 74 },
  { day: "Thu", sleep: 82, diet: 72, exercise: 77, mental: 75 },
  { day: "Fri", sleep: 79, diet: 71, exercise: 73, mental: 72 },
  { day: "Sat", sleep: 81, diet: 74, exercise: 80, mental: 76 },
  { day: "Sun", sleep: 77, diet: 73, exercise: 78, mental: 75 },
];

const events = [
  { date: "Mon", type: "sleep", label: "New routine" },
  { date: "Wed", type: "exercise", label: "Strength" },
  { date: "Fri", type: "social", label: "Call" },
  { date: "Sat", type: "diet", label: "Meal prep" },
];

const correlations = [
  {
    pair: "Sleep ↔ Mental",
    strength: "+0.62",
    note: "Aligned bedtimes reduce mood dips",
  },
  {
    pair: "Diet ↔ Energy",
    strength: "+0.48",
    note: "Hydration lifts afternoon focus",
  },
  {
    pair: "Exercise ↔ Sleep",
    strength: "+0.55",
    note: "Strength days boost deep sleep",
  },
];

const dependencies = [
  { from: "Sleep", to: "Energy" },
  { from: "Exercise", to: "Sleep" },
  { from: "Diet", to: "Recovery" },
  { from: "Social", to: "Mood" },
];

const predictData = baseData.map((d, idx) => ({
  day: d.day,
  expected: d.sleep + (idx % 2 === 0 ? 2 : -1),
  lower: d.sleep - 4,
  upper: d.sleep + 6,
}));

export default function TimelineNorthStar() {
  const [range, setRange] = useState("30d");

  const rangeData = useMemo(() => {
    if (range === "30d") return baseData;
    if (range === "90d") return [...baseData, ...baseData].slice(0, 10);
    return [...baseData, ...baseData, ...baseData].slice(0, 14);
  }, [range]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Timeline
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Signals & correlations
          </h1>
          <p className="text-sm text-white/70">
            Multi-pillar trends, dependencies, and 7-day predictive modelling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["30d", "90d", "365d"].map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-full px-3 py-1 text-sm ${
                range === value
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/70"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </header>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <LineIcon className="h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Multi-pillar
            </p>
            <h3 className="text-lg font-semibold">Line graph</h3>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rangeData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[60, 90]} />
              <Tooltip labelClassName="text-slate-900" />
              <Line
                type="monotone"
                dataKey="sleep"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="diet"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="exercise"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mental"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-white/60">
          Event markers overlayed · tap to view
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className={`${themeTokens.card} p-4 space-y-3`}>
          <div className="flex items-center gap-2 text-white">
            <GitBranch className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Dependencies
              </p>
              <h3 className="text-lg font-semibold">Habit node graph</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {dependencies.map((edge) => (
              <div
                key={`${edge.from}-${edge.to}`}
                className={`${themeTokens.panel} p-3 text-sm text-white/80`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full bg-ns-gold"
                    aria-hidden
                  />
                  {edge.from}
                </div>
                <div className="ml-6 flex items-center gap-2 text-white/60">
                  <ArrowRight className="h-4 w-4" />
                  {edge.to}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60">
            AI maps causal links across routines.
          </p>
        </article>

        <article className={`${themeTokens.card} p-4 space-y-3`}>
          <div className="flex items-center gap-2 text-white">
            <Radar className="h-5 w-5 text-purple-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Correlations
              </p>
              <h3 className="text-lg font-semibold">Active signals</h3>
            </div>
          </div>
          <div className="space-y-2">
            {correlations.map((c) => (
              <div key={c.pair} className={`${themeTokens.panel} p-3`}>
                <div className="flex items-center justify-between text-sm text-white">
                  <span>{c.pair}</span>
                  <span className="text-emerald-300 font-semibold">
                    {c.strength}
                  </span>
                </div>
                <p className="text-xs text-white/60">{c.note}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Sparkles className="h-4 w-4" /> Updated daily · pillared
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={`${themeTokens.card} p-4 space-y-3`}>
          <div className="flex items-center gap-2 text-white">
            <Link2 className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Events
              </p>
              <h3 className="text-lg font-semibold">Markers</h3>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((event) => (
              <div
                key={event.label}
                className={`${themeTokens.panel} p-3 text-sm text-white`}
              >
                <p className="font-semibold">{event.label}</p>
                <p className="text-xs text-white/60">
                  {event.type} · {event.date}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className={`${themeTokens.card} p-4 space-y-3`}>
          <div className="flex items-center gap-2 text-white">
            <LineIcon className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Predictive
              </p>
              <h3 className="text-lg font-semibold">7-day modelling</h3>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictData}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[60, 90]} />
                <Tooltip labelClassName="text-slate-900" />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="#22d3ee"
                  fill="rgba(34,211,238,0.15)"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="#1e3a8a"
                  fill="rgba(30,58,138,0.15)"
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-white/60">
            Confidence bands assume current routines.
          </p>
        </article>
      </section>
    </div>
  );
}
