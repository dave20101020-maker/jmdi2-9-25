import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlarmClock,
  ArrowRight,
  BellRing,
  Brain,
  Flame,
  LineChart,
  Medal,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { themeTokens } from "@/components/ThemeProvider";
import LifeScoreOrb from "@/components/visuals/LifeScoreOrb";

const pillars = [
  { id: "sleep", label: "Sleep", score: 76, link: "/pillars/sleep" },
  { id: "diet", label: "Diet", score: 68, link: "/pillars/diet" },
  { id: "exercise", label: "Exercise", score: 72, link: "/pillars/exercise" },
  {
    id: "mental_health",
    label: "Mental",
    score: 70,
    link: "/pillars/mental_health",
  },
  {
    id: "physical_health",
    label: "Physical",
    score: 74,
    link: "/pillars/physical_health",
  },
  { id: "finances", label: "Finances", score: 65, link: "/pillars/finances" },
  { id: "social", label: "Social", score: 71, link: "/pillars/social" },
  {
    id: "spirituality",
    label: "Spiritual",
    score: 63,
    link: "/pillars/spirituality",
  },
];

const insights = [
  {
    title: "Sleep drives mood today",
    body: "Last 7 days show mood +12% on nights above 7h",
  },
  {
    title: "Water intake correlates with focus",
    body: "Hydration spikes map to your highest focus blocks",
  },
  {
    title: "Leg day boosts HRV",
    body: "Post-strength nights improved HRV by 6%",
  },
  {
    title: "Social recovery",
    body: "Short calls reduced stress markers more than meditation yesterday",
  },
];

const roadmap = [
  {
    label: "Quarterly anchor",
    detail: "Stabilize sleep and financial buffers",
  },
  { label: "Month sprint", detail: "Lock hydration + 3 workouts weekly" },
  { label: "This week", detail: "Bed by 11:00, add 1 brain workout" },
];

const streaks = [
  { label: "Check-ins", value: 9 },
  { label: "Workouts", value: 5 },
  { label: "Hydration", value: 6 },
];

const renderMomentumValue = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Today";
  return n;
};

const renderMomentumNote = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Momentum resumes today";
  return "Momentum";
};

export default function DashboardNorthStar() {
  const lifeScore = 74;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Mission Control
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Your day, clarified
          </h1>
          <p className="text-sm text-white/70">
            One priority for today, plus the next best steps across your
            pillars.
          </p>
        </div>
        <Link to="/timeline" className={themeTokens.buttonGhost}>
          View Timeline
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article
          className={`${themeTokens.card} order-2 lg:order-1 relative overflow-hidden p-4 opacity-90 md:opacity-100`}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Overall progress
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <div className="scale-75 sm:scale-90 md:scale-100">
                <LifeScoreOrb />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{lifeScore}</div>
              <p className="text-sm text-white/70">Across 8 pillars</p>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Trend: +3 this week
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <Shield className="h-4 w-4" />
                Crisis mode: off
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/80">
            Goal roadmap reference: {roadmap[1].detail}
          </div>
        </article>

        <article
          className={`${themeTokens.card} order-1 lg:order-2 p-4 space-y-3 ring-1 ring-ns-gold/25`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Daily Focus
              </p>
              <h2 className="text-xl font-semibold text-white">
                Highest impact task
              </h2>
            </div>
            <Target className="h-5 w-5 text-ns-gold" />
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Wind-down at 10:30 PM
            </p>
            <p className="text-xs text-white/70">
              Chosen for impact: improves sleep, mood, and tomorrow's focus.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
              <span className="rounded-full bg-white/10 px-2 py-1">Sleep</span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                Mental Health
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                NeuroShield
              </span>
            </div>
            <Link
              to="/pillars/sleep"
              className={`${themeTokens.buttonPrimary} inline-flex min-h-11 items-center justify-center gap-2`}
            >
              Do now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <details className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            <summary className="cursor-pointer text-white">
              Why this matters
            </summary>
            <p className="mt-2 text-white/70">
              A steady evening routine supports sleep quality and keeps
              tomorrow's focus window easier to access.
            </p>
          </details>
        </article>

        <article
          className={`${themeTokens.card} order-3 lg:order-3 p-4 space-y-3 opacity-90 md:opacity-100`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Insights
              </p>
              <h2 className="text-lg font-semibold text-white">Top signals</h2>
            </div>
            <BellRing className="h-5 w-5 text-amber-300" />
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {insights.map((item) => (
              <div key={item.title} className="rounded-lg bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-white/70">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Sparkles className="h-4 w-4" /> Sorted by impact · context-aware
          </div>
        </article>
      </section>

      <div className="space-y-6 opacity-90 md:opacity-100">
        <section className={`${themeTokens.card} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Pillars
              </p>
              <h2 className="text-lg font-semibold text-white">
                Status overview
              </h2>
            </div>
            <Link
              to="/timeline"
              className="text-sm text-ns-gold flex items-center gap-2"
            >
              View correlations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-4 sm:grid-cols-2 mt-3">
            {pillars.map((pillar) => (
              <Link
                key={pillar.id}
                to={pillar.link}
                className={`${themeTokens.panel} p-3 transition hover:border-ns-gold/60 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    {pillar.label}
                  </p>
                  <span className="text-xs text-white/60">{pillar.score}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-ns-gold to-amber-400"
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-white/60">
                  Roadmap tie-in:{" "}
                  {roadmap[pillar.score % roadmap.length].detail}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className={`${themeTokens.card} p-4 space-y-3`}>
            <div className="flex items-center gap-2 text-white">
              <LineChart className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Momentum
                </p>
                <h3 className="text-lg font-semibold">Gentle progress</h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {streaks.map((streak) => (
                <div
                  key={streak.label}
                  className={`${themeTokens.panel} p-3 text-center`}
                >
                  <p className="text-2xl font-bold text-white">
                    {renderMomentumValue(streak.value)}
                  </p>
                  <p className="text-xs text-white/60">{streak.label}</p>
                  <p className="mt-1 text-[11px] text-white/50">
                    {renderMomentumNote(streak.value)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/60">
              No penalties · you can restart anytime
            </p>
          </article>

          <article className={`${themeTokens.card} p-4 space-y-3`}>
            <div className="flex items-center gap-2 text-white">
              <AlarmClock className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Support
                </p>
                <h3 className="text-lg font-semibold">Quick help</h3>
              </div>
            </div>
            <p className="text-sm text-white/70">
              If you're feeling overwhelmed, open the toolkit for grounding and
              next steps.
            </p>
            <Link
              to="/pillars/mental_health"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
            >
              Open toolkit
              <ArrowRight className="h-4 w-4 text-white/50" aria-hidden />
            </Link>
            <p className="text-[11px] text-white/50">
              Support only · not diagnostic.
            </p>
          </article>

          <article className={`${themeTokens.card} p-4 space-y-3`}>
            <div className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5 text-purple-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Goal Roadmap
                </p>
                <h3 className="text-lg font-semibold">Visual reference</h3>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-white/80">
              {roadmap.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full bg-ns-gold"
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-white/60">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/timeline"
              className="text-sm text-ns-gold flex items-center gap-2"
            >
              See timeline overlay <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </section>

        <section className={`${themeTokens.card} p-4 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <Flame className="h-5 w-5 text-orange-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Navigation
                </p>
                <h3 className="text-lg font-semibold">All sections</h3>
              </div>
            </div>
            <Medal className="h-5 w-5 text-ns-gold" />
          </div>
          <div className="grid gap-2 md:grid-cols-4 sm:grid-cols-2 text-sm text-white">
            {[
              "Timeline",
              "Sleep",
              "Diet",
              "Exercise",
              "Mental Health",
              "Physical Health",
              "Finances",
              "Social",
              "Spirituality",
              "NeuroShield",
              "Life Planning AI",
              "Friends & Leaderboard",
              "Settings",
            ].map((item) => (
              <Link
                key={item}
                to={
                  item === "Timeline"
                    ? "/timeline"
                    : item === "NeuroShield"
                    ? "/neuroshield"
                    : item === "Life Planning AI"
                    ? "/life-planning"
                    : item === "Friends & Leaderboard"
                    ? "/friends"
                    : `/pillars/${item
                        .toLowerCase()
                        .replace(/ &.*$/, "")
                        .replace(/ /g, "_")}`
                }
                className={`${themeTokens.panel} flex items-center justify-between p-3 hover:border-ns-gold/60`}
              >
                <span>{item}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
