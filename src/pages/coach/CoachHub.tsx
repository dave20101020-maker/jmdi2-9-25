import React, { useMemo, useState } from "react";
import { Shield, Sparkles } from "lucide-react";
import CoachChat from "@/components/coach/CoachChat";

const COACHES = [
  {
    id: "northstar",
    name: "NorthStar Guide",
    persona: "Curious, compassionate coach who balances rest and action.",
    focus: "Holistic wellbeing",
    quickPrompts: [
      "What should I focus on today?",
      "Give me an energy reset",
      "Share a quick mindset shift for resilience",
    ],
  },
  {
    id: "sleep",
    name: "Luna",
    persona: "Sleep architect with a calm, ritual-focused energy.",
    focus: "Rest & recovery routines",
    quickPrompts: [
      "Suggest a 3-minute wind-down",
      "How do I quiet racing thoughts before bed?",
      "What’s a mini nap strategy that won’t break my night?",
    ],
  },
  {
    id: "exercise",
    name: "Atlas",
    persona: "Motivating movement partner who keeps things playful.",
    focus: "Micro-workouts & mobility",
    quickPrompts: [
      "Build me a 5-minute strength circuit",
      "What stretch resets posture quickly?",
      "Give me a quick way to boost circulation",
    ],
  },
];

const SAFETY_POINTS = [
  "This hub is for inspiration—not a replacement for medical or mental health care.",
  "Share sensitive details only with trusted teammates or licensed providers.",
];

export default function CoachHub() {
  const initialCoach = COACHES[0];
  const [selectedId, setSelectedId] = useState(initialCoach.id);

  const selectedCoach = useMemo(
    () => COACHES.find((coach) => coach.id === selectedId) ?? initialCoach,
    [selectedId, initialCoach]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-white/5 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
              Coach hub
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Choose a companion
            </h1>
          </div>
          <Sparkles className="h-6 w-6 text-cyan-400" />
        </div>
        <p className="text-sm text-white/60">
          Each coach listens through a different wellness lens.
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
        <div className="space-y-2">
          {SAFETY_POINTS.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-[11px] text-white/60"
            >
              <Shield className="h-4 w-4 text-amber-400" />
              <p>{point}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {COACHES.map((coach) => (
          <button
            key={coach.id}
            type="button"
            onClick={() => setSelectedId(coach.id)}
            className={`h-full rounded-2xl border px-4 py-3 text-left transition ${
              selectedId === coach.id
                ? "border-cyan-400/70 bg-cyan-500/10 text-cyan-100"
                : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/40"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Coach
            </p>
            <p className="text-lg font-semibold text-white">{coach.name}</p>
            <p className="text-xs text-white/60">{coach.persona}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold text-white">
          {selectedCoach.name}
        </h2>
        <p className="text-sm text-white/60">{selectedCoach.persona}</p>
        <p className="text-xs text-white/50">Focus: {selectedCoach.focus}</p>
      </div>

      <CoachChat
        coachId={selectedCoach.id}
        coachName={selectedCoach.name}
        persona={selectedCoach.persona}
        focus={selectedCoach.focus}
        quickPrompts={selectedCoach.quickPrompts}
        contextSummary="Pillar scores, recent habits, and preferences shared during onboarding are used to personalise suggestions."
      />
    </div>
  );
}
