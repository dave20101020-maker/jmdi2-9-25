import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  Brain,
  Heart,
  HeartPulse,
  Shield,
  Timer,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const moodData = [
  { day: "Mon", mood: 6.8, sleep: 78, social: 3 },
  { day: "Tue", mood: 7.1, sleep: 80, social: 4 },
  { day: "Wed", mood: 6.4, sleep: 76, social: 2 },
  { day: "Thu", mood: 7.2, sleep: 82, social: 3 },
  { day: "Fri", mood: 6.9, sleep: 79, social: 4 },
  { day: "Sat", mood: 7.4, sleep: 81, social: 5 },
  { day: "Sun", mood: 7.0, sleep: 77, social: 3 },
];

const toolkit = [
  "Box breathing (4-4-4-4)",
  "Grounding: 5-4-3-2-1",
  "Support contact shortcut",
  "Safe space audio",
];

export default function MentalHealthPillarSpec() {
  const [moodScore, setMoodScore] = useState(7);
  const [gratitude, setGratitude] = useState("");
  const [toolkitStatus, setToolkitStatus] = useState("Closed");
  const [sessionStatus, setSessionStatus] = useState("Idle");

  const sections = [
    {
      kicker: "Tracking",
      title: "Mental health score history",
      content: (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[6, 8]} />
              <Tooltip labelClassName="text-slate-900" />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#a855f7"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      kicker: "Daily",
      title: "Mood & gratitude",
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Mood check-in</p>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="w-full accent-ns-gold"
            />
            <p className="text-xs text-white/60">Mood: {moodScore}/10</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Gratitude</p>
            <textarea
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="3 things today"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
            />
            <p className="text-xs text-white/60">
              Logged: {gratitude ? gratitude.length : 0} chars
            </p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Mindfulness timer
            </p>
            <div className="flex items-center gap-2 text-white">
              <Timer className="h-4 w-4 text-emerald-300" /> 5:00
            </div>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => setSessionStatus("Session started (mock)")}
            >
              Start session
            </button>
            <p className="text-xs text-white/60">Status: {sessionStatus}</p>
          </div>
        </div>
      ),
    },
    {
      kicker: "Correlations",
      title: "Mood – Sleep – Social",
      content: (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
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
                dataKey="social"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#a855f7"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      kicker: "Safety",
      title: "Emergency coping toolkit",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <div className="flex items-center gap-2 text-white">
              <Shield className="h-4 w-4 text-amber-300" />
              <p className="font-semibold">Quick actions</p>
            </div>
            <ul className="space-y-1 text-sm text-white/80">
              {toolkit.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full bg-ns-gold"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => setToolkitStatus("Toolkit opened (mock)")}
            >
              Open toolkit
            </button>
            <p className="text-xs text-white/60">{toolkitStatus}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              DASS-21 (simplified)
            </p>
            <p className="text-xs text-white/60">
              Mock sliders for stress, anxiety, depression.
            </p>
            <div className="space-y-2">
              {["Stress", "Anxiety", "Depression"].map((label) => (
                <label key={label} className="text-xs text-white/70">
                  {label}
                  <input
                    type="range"
                    min="0"
                    max="3"
                    defaultValue="1"
                    className="w-full accent-ns-gold"
                  />
                </label>
              ))}
            </div>
            <p className="text-[11px] text-white/50">
              Not diagnostic; use to reflect and route to care.
            </p>
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Mental health AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Brain className="h-4 w-4 text-purple-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Ask for reframes, coping steps, or next actions. Floating NorthStar
            routes mental context.
          </p>
          <p className="text-[11px] text-white/50">
            Not diagnostic. Seek professional care for clinical support.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="mental_health"
      title="Mental health pillar"
      scoreLabel="Mental score"
      score="70"
      intent="Gentle emotional regulation and support-first AI guidance"
      roadmapHint="Daily mood, gratitude, and weekly coping rehearsal"
      sections={sections}
    />
  );
}
