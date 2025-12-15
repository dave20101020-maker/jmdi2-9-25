import React, { useState } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import {
  AlertTriangle,
  Brain,
  ClipboardList,
  Shield,
  Sparkles,
} from "lucide-react";
import { themeTokens } from "@/components/ThemeProvider";

const riskScore = 32;

const indicators = [
  "Sleep variability up 18%",
  "Missed hydration targets 3 days",
  "Cognitive load spikes after 9pm",
];

const log = [
  { date: "Mon", activity: "Word puzzles", duration: "15m" },
  { date: "Tue", activity: "Memory cards", duration: "10m" },
  { date: "Wed", activity: "Walk + audiobook", duration: "30m" },
];

const workouts = ["Dual n-back (mock)", "Spatial recall trail", "Story retell"];

export default function NeuroShield() {
  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [entries, setEntries] = useState(log);
  const [savedStatus, setSavedStatus] = useState("No entry yet");

  const openNeuroShieldChat = () => {
    window.dispatchEvent(
      new CustomEvent("northstar:open", {
        detail: {
          mode: "pillar",
          agentId: "mental_health",
          module: "neuroshield",
          draft:
            "NeuroShield: I'd like to do a preliminary cognitive screening and a risk-awareness check (not a diagnosis).",
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            NeuroShield
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Cognitive health
          </h1>
          <p className="text-sm text-white/70">
            Risk awareness, early indicators, and brain workouts.
          </p>
          <button
            type="button"
            className={`${themeTokens.buttonPrimary} mt-3`}
            onClick={openNeuroShieldChat}
          >
            Ask Dr. Serenity (NeuroShield)
          </button>
        </div>
        <div className={`${themeTokens.panel} p-4 w-48 text-center`}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Risk score
          </p>
          <div className="h-32 w-full">
            <ResponsiveContainer>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                barSize={12}
                data={[{ name: "Risk", value: riskScore, fill: "#fbbf24" }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  minAngle={15}
                  clockWise
                  dataKey="value"
                  cornerRadius={8}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm font-semibold text-white">{riskScore}/100</p>
          <p className="text-[11px] text-white/60">Lower is better · mock</p>
        </div>
      </header>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Early indicators
            </p>
            <h3 className="text-lg font-semibold">Signals (non-diagnostic)</h3>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-white/80">
          {indicators.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ns-gold" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-white/50">
          Not medical advice. Use to prompt healthier routines.
        </p>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Plan
            </p>
            <h3 className="text-lg font-semibold">
              Alzheimer’s risk reduction
            </h3>
          </div>
        </div>
        <ul className="grid gap-2 md:grid-cols-2 text-sm text-white/80">
          {[
            "Consistent sleep window",
            "Daily movement 30m",
            "Mediterranean-leaning meals",
            "Hydration 3L",
            "Weekly brain workouts",
            "Social engagement thrice weekly",
          ].map((item) => (
            <li
              key={item}
              className={`${themeTokens.panel} p-3 flex items-center gap-2`}
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Brain className="h-5 w-5 text-purple-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Tracking log
            </p>
            <h3 className="text-lg font-semibold">Cognitive activities</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Log activity</p>
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Duration (min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => {
                setEntries((prev) => [
                  {
                    date: "Today",
                    activity: activity || "Brain game",
                    duration: duration || "0m",
                  },
                  ...prev,
                ]);
                setSavedStatus("Saved mock entry");
                setActivity("");
                setDuration("");
              }}
            >
              Save
            </button>
            <p className="text-xs text-white/60">{savedStatus}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Recent entries</p>
            <ul className="space-y-1 text-sm text-white/80">
              {entries.map((entry, idx) => (
                <li
                  key={`${entry.date}-${idx}`}
                  className="flex items-center justify-between"
                >
                  <span>{entry.activity}</span>
                  <span className="text-xs text-white/60">
                    {entry.date} · {entry.duration}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <ClipboardList className="h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Brain workouts
            </p>
            <h3 className="text-lg font-semibold">Weekly plan & library</h3>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {workouts.map((item) => (
            <div
              key={item}
              className={`${themeTokens.panel} p-3 text-sm text-white/80 flex items-center gap-2`}
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
