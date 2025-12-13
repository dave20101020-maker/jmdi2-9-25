import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Compass, Heart, Sparkles, Stars, Sun } from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { day: "Mon", score: 62 },
  { day: "Tue", score: 64 },
  { day: "Wed", score: 63 },
  { day: "Thu", score: 65 },
  { day: "Fri", score: 64 },
  { day: "Sat", score: 66 },
  { day: "Sun", score: 65 },
];

const reflections = [
  "Guided reflection: meaning moments",
  "Values alignment: choose 3",
  "Purpose tracker: weekly note",
];

export default function SpiritualityPillarSpec() {
  const [sessionStatus, setSessionStatus] = useState("Idle");

  const sections = [
    {
      kicker: "Tracking",
      title: "Spirituality score history",
      content: (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[60, 70]} />
              <Tooltip labelClassName="text-slate-900" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      kicker: "Purpose",
      title: "Purpose tracker & reflections",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Purpose tracker</p>
            <textarea
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="What felt meaningful this week?"
            />
            <p className="text-xs text-white/60">
              Weekly cadence · mock storage
            </p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Guided reflection sessions
            </p>
            <ul className="space-y-1 text-sm text-white/80">
              {reflections.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              className={themeTokens.buttonGhost}
              onClick={() => setSessionStatus("Session started (mock)")}
            >
              Start 10-min session
            </button>
            <p className="text-xs text-white/60">{sessionStatus}</p>
          </div>
        </div>
      ),
    },
    {
      kicker: "Identity",
      title: "Personality & values",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Personality type self-report
            </p>
            <select className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white">
              <option>Explorer</option>
              <option>Architect</option>
              <option>Supporter</option>
              <option>Creator</option>
            </select>
            <p className="text-xs text-white/60">Used to tailor prompts.</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Values alignment check-in
            </p>
            <div className="grid gap-2 text-xs text-white/70">
              {["Integrity", "Growth", "Community", "Compassion"].map(
                (value) => (
                  <label key={value} className="space-y-1">
                    {value}
                    <input
                      type="range"
                      min="1"
                      max="5"
                      defaultValue="4"
                      className="w-full accent-ns-gold"
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Spirituality AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Stars className="h-4 w-4 text-amber-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Ask for guided reflections, rituals, or purpose prompts via
            NorthStar.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="spirituality"
      title="Spirituality pillar"
      scoreLabel="Spiritual score"
      score="65"
      intent="Align daily actions with purpose and values"
      roadmapHint="Weekly reflection, values check, gentle rituals"
      sections={sections}
    />
  );
}
