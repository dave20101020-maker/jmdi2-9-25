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
  HeartHandshake,
  MessageCircle,
  PhoneCall,
  Sparkles,
  Users,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { day: "Mon", score: 70 },
  { day: "Tue", score: 72 },
  { day: "Wed", score: 69 },
  { day: "Thu", score: 73 },
  { day: "Fri", score: 71 },
  { day: "Sat", score: 75 },
  { day: "Sun", score: 72 },
];

const interactions = [
  { person: "Alex", tag: "Family", mode: "Call" },
  { person: "Priya", tag: "Friend", mode: "Walk" },
  { person: "Sam", tag: "Mentor", mode: "Coffee" },
];

export default function SocialPillarSpec() {
  const [person, setPerson] = useState("");
  const [tag, setTag] = useState("Family");
  const [mode, setMode] = useState("Call");
  const [entries, setEntries] = useState(interactions);

  const sections = [
    {
      kicker: "Tracking",
      title: "Social score history",
      content: (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[65, 80]} />
              <Tooltip labelClassName="text-slate-900" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#f59e0b"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      kicker: "Logging",
      title: "Interaction log & tags",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Log interaction</p>
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Who?"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            />
            <select
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              <option>Family</option>
              <option>Friend</option>
              <option>Mentor</option>
              <option>Colleague</option>
            </select>
            <select
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option>Call</option>
              <option>Walk</option>
              <option>Coffee</option>
              <option>Text</option>
            </select>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => {
                setEntries((prev) => [
                  ...prev,
                  { person: person || "Unnamed", tag, mode },
                ]);
                setPerson("");
              }}
            >
              Save
            </button>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Recent interactions
            </p>
            <ul className="space-y-1 text-sm text-white/80">
              {entries.map((item, idx) => (
                <li
                  key={`${item.person}-${idx}`}
                  className="flex items-center justify-between"
                >
                  <span>{item.person}</span>
                  <span className="text-xs text-white/60">
                    {item.tag} · {item.mode}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Reconnection suggestions",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <p className="font-semibold">AI reconnection picks</p>
          </div>
          <p className="text-sm text-white/70">
            Based on time since last contact and support weighting.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 text-sm text-white/80">
            {[
              "Check in with Alex (12 days)",
              "Send note to Priya (8 days)",
              "Schedule walk with Sam",
            ].map((item) => (
              <div
                key={item}
                className={`${themeTokens.panel} p-3 flex items-center gap-2`}
              >
                <PhoneCall className="h-4 w-4 text-amber-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      kicker: "Network",
      title: "Support assessment",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <p className="text-sm text-white/70">
            Rate how supported you feel across contexts.
          </p>
          <div className="grid gap-2 md:grid-cols-3 text-xs text-white/70">
            {["Emotional", "Practical", "Growth"].map((area) => (
              <label key={area} className="space-y-1">
                {area}
                <input
                  type="range"
                  min="1"
                  max="5"
                  defaultValue="4"
                  className="w-full accent-ns-gold"
                />
              </label>
            ))}
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Social AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4 text-amber-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Use NorthStar to draft reconnection messages or plan gatherings.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="social"
      title="Social / connections pillar"
      scoreLabel="Social score"
      score="71"
      intent="Nurture meaningful connections and reconnections"
      roadmapHint="Weekly touchpoints with top 3, deepen 1 connection"
      sections={sections}
    />
  );
}
