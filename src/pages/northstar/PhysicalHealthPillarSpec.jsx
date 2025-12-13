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
  Activity,
  ClipboardCheck,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { day: "Mon", score: 74 },
  { day: "Tue", score: 75 },
  { day: "Wed", score: 73 },
  { day: "Thu", score: 76 },
  { day: "Fri", score: 74 },
  { day: "Sat", score: 77 },
  { day: "Sun", score: 75 },
];

const checklist = [
  "Steps 7k+",
  "Protein 120g",
  "Sunlight 15m",
  "Mobility 10m",
  "Sleep 7h",
  "Hydration 2.5L",
  "Medications taken",
];

export default function PhysicalHealthPillarSpec() {
  const [restingHr, setRestingHr] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [biometricSaved, setBiometricSaved] = useState("Pending");
  const [symptomNote, setSymptomNote] = useState("");
  const [symptomSaved, setSymptomSaved] = useState("None logged");

  const sections = [
    {
      kicker: "Tracking",
      title: "Physical health score history",
      content: (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[70, 80]} />
              <Tooltip labelClassName="text-slate-900" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      kicker: "Biometrics",
      title: "Inputs & symptoms",
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Biometric input</p>
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Resting HR"
              value={restingHr}
              onChange={(e) => setRestingHr(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Blood pressure"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
            />
            <button
              className={themeTokens.buttonPrimary}
              onClick={() =>
                setBiometricSaved(
                  `Saved HR ${restingHr || "-"} / BP ${bloodPressure || "-"}`
                )
              }
            >
              Save
            </button>
            <p className="text-xs text-white/60">{biometricSaved}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Symptom tracker</p>
            <textarea
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Describe symptoms"
              value={symptomNote}
              onChange={(e) => setSymptomNote(e.target.value)}
            />
            <button
              className={themeTokens.buttonGhost}
              onClick={() =>
                setSymptomSaved(symptomNote || "Logged empty note")
              }
            >
              Log symptom
            </button>
            <p className="text-xs text-white/60">Last: {symptomSaved}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              7-day health checklist
            </p>
            <ul className="space-y-1 text-sm text-white/80">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full bg-ns-gold"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      kicker: "Audit",
      title: "Foundational health audit",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <p className="text-sm text-white/70">
            Quick self-check across core areas.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              "Sleep",
              "Nutrition",
              "Movement",
              "Stress",
              "Environment",
              "Medical",
            ].map((item) => (
              <label key={item} className="text-xs text-white/70">
                {item} confidence
                <input
                  type="range"
                  min="1"
                  max="5"
                  defaultValue="3"
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
      title: "Physical health AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Stethoscope className="h-4 w-4 text-emerald-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Use NorthStar to triage next best actions, review biometrics, or
            suggest recovery blocks.
          </p>
          <p className="text-[11px] text-white/50">
            Not diagnostic; seek licensed care for medical advice.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="physical_health"
      title="Physical health pillar"
      scoreLabel="Physical score"
      score="75"
      intent="Steady physical baselines and proactive recovery"
      roadmapHint="Daily movement, biometrics weekly, and audit monthly"
      sections={sections}
    />
  );
}
