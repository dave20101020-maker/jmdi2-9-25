import React, { useState } from "react";
import { themeTokens } from "@/components/ThemeProvider";
import { CalendarCheck, Map, Sparkles, Workflow } from "lucide-react";

const vision = [
  { year: "2025", focus: "Stabilize routines" },
  { year: "2026", focus: "Skill deepening" },
  { year: "2027", focus: "Career pivot" },
  { year: "2028", focus: "Financial buffer" },
  { year: "2029", focus: "Lead projects" },
  { year: "2030", focus: "Sabbatical" },
  { year: "2031", focus: "Build venture" },
  { year: "2032", focus: "Mentor & teach" },
  { year: "2033", focus: "Global work" },
  { year: "2034", focus: "Design your days" },
];

const gantt = [
  { label: "Skill track", span: "2025–2027" },
  { label: "Income buffer", span: "2025–2026" },
  { label: "Career pivot", span: "2027–2029" },
  { label: "Venture build", span: "2030–2032" },
];

const modules = [
  "AI career path designer",
  "Life event planner (move, family, sabbatical)",
  "Decision helper (pros/cons + values)",
  "Calendar sync toggle",
];

const goalTree = [
  {
    label: "Wellbeing",
    items: [
      { label: "Sleep 7.5h", children: ["Consistent wake", "Wind-down 10:30"] },
      { label: "Move 4x/week", children: ["2x strength", "2x cardio"] },
    ],
  },
  {
    label: "Career",
    items: [
      { label: "Upskill AI", children: ["Course", "Portfolio"] },
      { label: "Leadership", children: ["Mentor", "Stakeholder comms"] },
    ],
  },
  {
    label: "Finances",
    items: [
      { label: "Buffer 6mo", children: ["Auto-save", "Trim expenses"] },
      { label: "Invest", children: ["Index fund", "401k max"] },
    ],
  },
];

export default function LifePlanningAI() {
  const [calendarSync, setCalendarSync] = useState(true);
  const [decision, setDecision] = useState("");
  const [options, setOptions] = useState("Pending prompt");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          Life planning AI
        </p>
        <h1 className="text-3xl font-semibold text-white">10-year map</h1>
        <p className="text-sm text-white/70">
          Vision, AI career paths, and event modules.
        </p>
      </header>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Map className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Vision map
            </p>
            <h3 className="text-lg font-semibold">10-year outlook</h3>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-5 text-sm text-white/80">
          {vision.map((v) => (
            <div key={v.year} className={`${themeTokens.panel} p-3`}>
              <p className="text-xs text-white/60">{v.year}</p>
              <p className="font-semibold text-white">{v.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Workflow className="h-5 w-5 text-amber-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Goals
            </p>
            <h3 className="text-lg font-semibold">Gantt-style breakdown</h3>
          </div>
        </div>
        <div className="space-y-2">
          {gantt.map((row) => (
            <div
              key={row.label}
              className={`${themeTokens.panel} p-3 flex items-center justify-between text-sm text-white`}
            >
              <span>{row.label}</span>
              <span className="text-xs text-white/60">{row.span}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-purple-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              AI modules
            </p>
            <h3 className="text-lg font-semibold">Design helpers</h3>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 text-sm text-white/80">
          {modules.map((item) => (
            <div key={item} className={`${themeTokens.panel} p-3`}>
              {item}
            </div>
          ))}
        </div>
        <div className={`${themeTokens.panel} p-3 space-y-3`}>
          <p className="text-sm font-semibold text-white">
            Goal breakdown tree
          </p>
          <div className="space-y-2 text-sm text-white/80">
            {goalTree.map((branch) => (
              <div
                key={branch.label}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <p className="text-white font-semibold mb-2">{branch.label}</p>
                <div className="space-y-1">
                  {branch.items.map((item) => (
                    <div key={item.label}>
                      <p className="text-white/90 font-semibold">
                        {item.label}
                      </p>
                      <div className="ml-3 text-white/70 text-xs flex flex-wrap gap-1">
                        {item.children.map((child) => (
                          <span
                            key={child}
                            className="rounded-full bg-white/10 px-2 py-0.5"
                          >
                            {child}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <p className="text-sm font-semibold text-white">Calendar sync</p>
          <p className="text-xs text-white/70">
            Placeholder sync surface for Google / Outlook. No external calls
            yet.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              className="accent-ns-gold"
              checked={calendarSync}
              onChange={(e) => setCalendarSync(e.target.checked)}
            />
            Sync planned events to calendar (mock)
            <span className="text-[11px] text-white/60">
              Status: {calendarSync ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-2`}>
        <h3 className="text-lg font-semibold text-white">
          AI life decision helper
        </h3>
        <p className="text-sm text-white/70">
          Describe a decision and let AI outline options, risks, and value
          alignment.
        </p>
        <textarea
          className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Describe your decision..."
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        />
        <button
          className={themeTokens.buttonPrimary}
          onClick={() =>
            setOptions(
              decision
                ? `Generated mock options for: "${decision}"`
                : "Add a decision to generate options"
            )
          }
        >
          Generate options
        </button>
        <p className="text-xs text-white/60">{options}</p>
      </section>

      <div className={`${themeTokens.panel} p-3 text-xs text-white/60`}>
        Mock-only experience; AI hooks connect via the floating NorthStar
        button.
      </div>
    </div>
  );
}
