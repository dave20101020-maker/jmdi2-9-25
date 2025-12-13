import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  AlarmClock,
  BedDouble,
  Brain,
  MoonStar,
  Sparkles,
  Watch,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { day: "Mon", score: 78, debt: 0.4 },
  { day: "Tue", score: 80, debt: 0.2 },
  { day: "Wed", score: 76, debt: 0.8 },
  { day: "Thu", score: 82, debt: -0.1 },
  { day: "Fri", score: 79, debt: 0.3 },
  { day: "Sat", score: 81, debt: -0.2 },
  { day: "Sun", score: 77, debt: 0.5 },
];

const coreMetrics = [
  { label: "Duration", value: "7.4h" },
  { label: "Latency", value: "14m" },
  { label: "REM", value: "21%" },
  { label: "Deep", value: "19%" },
  { label: "Quality", value: "7.8/10" },
];

export default function SleepPillarSpec() {
  const [chronotype, setChronotype] = useState("bear");
  const [alarmPreviewed, setAlarmPreviewed] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Idle");

  const sections = [
    {
      kicker: "Tracking",
      title: "Sleep score history",
      subtitle: "7-day view with debt overlay",
      content: (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[70, 90]} />
                <Tooltip labelClassName="text-slate-900" />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  fill="rgba(34,211,238,0.15)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/70">Sleep debt visual</p>
            {history.map((h) => (
              <div
                key={h.day}
                className={`${themeTokens.panel} flex items-center justify-between px-3 py-2`}
              >
                <span className="text-sm text-white">{h.day}</span>
                <span
                  className={`text-sm ${
                    h.debt <= 0 ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {h.debt > 0 ? "+" : ""}
                  {h.debt.toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      kicker: "Assess",
      title: "Chronotype questionnaire",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">
              What's your natural energy curve?
            </p>
            {["bear", "wolf", "lion", "dolphin"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <input
                  type="radio"
                  name="chronotype"
                  value={type}
                  checked={chronotype === type}
                  onChange={(e) => setChronotype(e.target.value)}
                  className="accent-ns-gold"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Sleep opportunity window
            </p>
            <p className="text-sm text-white/70">
              Based on chronotype ({chronotype}) · Aim for 10:30 PM – 6:30 AM.
              Short nap window: 1:30 PM.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full bg-white/10 px-2 py-1">
                Predictor
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                AI-aligned
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      kicker: "Guidance",
      title: "Smart alarm & sync",
      subtitle: "Gentle wake guidance · mock integration",
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <div className="flex items-center gap-2 text-white">
              <AlarmClock className="h-4 w-4 text-amber-300" />
              <p className="font-semibold">Smart alarm</p>
            </div>
            <p className="text-sm text-white/70">
              Wake window: 6:25–6:45 AM · light phase detection (mock).
            </p>
            <button
              className={themeTokens.buttonGhost}
              onClick={() => setAlarmPreviewed(true)}
            >
              Preview tone
            </button>
            <p className="text-xs text-white/60">
              {alarmPreviewed
                ? "Previewed calming tone (mock)."
                : "Tap to hear sample (mock)."}
            </p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <div className="flex items-center gap-2 text-white">
              <Watch className="h-4 w-4 text-cyan-300" />
              <p className="font-semibold">Wearable sync</p>
            </div>
            <p className="text-sm text-white/70">
              Tap to sync data from your device (mock endpoint).
            </p>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => setSyncStatus("Synced just now")}
            >
              Sync wearable
            </button>
            <p className="text-xs text-white/60">Status: {syncStatus}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <div className="flex items-center gap-2 text-white">
              <BedDouble className="h-4 w-4 text-emerald-300" />
              <p className="font-semibold">Core metrics</p>
            </div>
            <ul className="space-y-1 text-sm text-white/80">
              {coreMetrics.map((metric) => (
                <li key={metric.label} className="flex justify-between">
                  <span>{metric.label}</span>
                  <span className="text-white/60">{metric.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Sleep AI chat",
      subtitle: "Ask for wind-down edits or alarm tweaks",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <MoonStar className="h-4 w-4 text-purple-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Use the floating NorthStar button to ask for bedtime playbooks or
            tweaks; we pass your sleep context.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-2 py-1">
              Wind-down
            </span>
            <span className="rounded-full bg-white/10 px-2 py-1">Alarm</span>
            <span className="rounded-full bg-white/10 px-2 py-1">
              Chronotype
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="sleep"
      title="Sleep pillar"
      scoreLabel="Sleep score"
      score="78"
      intent="Steady energy through consistent sleep and debt repair"
      roadmapHint="Lock wind-down, sync wearable, and trim screen time"
      sections={sections}
      aiNote="AI aligns recommendations with your chronotype; all data mocked for UI."
    />
  );
}
