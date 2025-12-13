import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  ClipboardList,
  Dumbbell,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { day: "Mon", score: 72, minutes: 30 },
  { day: "Tue", score: 74, minutes: 40 },
  { day: "Wed", score: 70, minutes: 25 },
  { day: "Thu", score: 76, minutes: 45 },
  { day: "Fri", score: 73, minutes: 35 },
  { day: "Sat", score: 78, minutes: 60 },
  { day: "Sun", score: 75, minutes: 40 },
];

const routines = [
  "20-min mobility + core",
  "3x full-body strength",
  "Zone 2 walk 30m",
  "HIIT finisher (mock)",
];

export default function ExercisePillarSpec() {
  const [workoutNote, setWorkoutNote] = useState("");
  const [minutes, setMinutes] = useState("");
  const [rpe, setRpe] = useState("");
  const [lastSaved, setLastSaved] = useState("No entry yet");

  const sections = [
    {
      kicker: "Tracking",
      title: "Exercise score & active minutes",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[65, 85]} />
                <Tooltip labelClassName="text-slate-900" />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#22c55e"
                  fill="rgba(34,197,94,0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip labelClassName="text-slate-900" />
                <Bar dataKey="minutes" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      kicker: "Recovery",
      title: "Readiness suggestion",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <p className="font-semibold">AI suggests: Low-impact day</p>
          </div>
          <p className="text-sm text-white/70">
            HRV trend softening. Swap HIIT for mobility + Zone 2 to keep streak
            while recovering.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-2 py-1">
              Readiness
            </span>
            <span className="rounded-full bg-white/10 px-2 py-1">Recovery</span>
          </div>
        </div>
      ),
    },
    {
      kicker: "Logging",
      title: "Workout log & streak",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Log workout</p>
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="e.g., 30m strength + 10m finishers"
              value={workoutNote}
              onChange={(e) => setWorkoutNote(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="number"
                className="w-1/2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
              <input
                type="number"
                className="w-1/2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="RPE"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
              />
            </div>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => {
                const summary = `${workoutNote || "Workout"} · ${
                  minutes || "0"
                }m · RPE ${rpe || "N/A"}`;
                setLastSaved(summary);
              }}
            >
              <ClipboardList className="mr-2 inline h-4 w-4" /> Save log
            </button>
            <p className="text-xs text-white/60">Last saved: {lastSaved}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <div className="flex items-center gap-2 text-white">
              <Trophy className="h-4 w-4 text-ns-gold" />
              <p className="font-semibold">Workout streak</p>
            </div>
            <p className="text-3xl font-bold text-white">5 days</p>
            <p className="text-sm text-white/70">
              Gentle streaks; resume after rest without penalty.
            </p>
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Exercise AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Activity className="h-4 w-4 text-cyan-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Ask for variations, deload advice, or recovery plans via the
            floating NorthStar button.
          </p>
        </div>
      ),
    },
    {
      kicker: "Library",
      title: "Workout routines",
      content: (
        <div className="grid gap-2 sm:grid-cols-2">
          {routines.map((routine) => (
            <div
              key={routine}
              className={`${themeTokens.panel} p-3 text-sm text-white/80 flex items-start gap-2`}
            >
              <Dumbbell className="h-4 w-4 text-orange-300 mt-1" />
              <div>
                <p className="font-semibold text-white">{routine}</p>
                <p className="text-xs text-white/60">
                  Saved template · 30-40 min.
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="exercise"
      title="Exercise pillar"
      scoreLabel="Exercise score"
      score="74"
      intent="Build strength and recovery without overreaching"
      roadmapHint="3x strength, 2x Zone 2, daily mobility"
      sections={sections}
    />
  );
}
