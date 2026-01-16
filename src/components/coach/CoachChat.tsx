import React, { useState } from "react";

type CoachChatProps = {
  coachId: string;
  coachName: string;
  persona: string;
  focus: string;
  quickPrompts: string[];
  contextSummary: string;
};

export default function CoachChat({
  coachName,
  persona,
  focus,
  quickPrompts,
  contextSummary,
}: CoachChatProps) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">
            Soldier
          </p>
          <p className="text-lg font-semibold text-white">{coachName}</p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
          {focus}
        </span>
      </div>
      <p className="text-sm text-white/70">{persona}</p>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
          Quick prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.slice(0, 6).map((prompt) => (
            <button
              key={`${coachName}-${prompt}`}
              type="button"
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/70 transition hover:border-white/40"
              onClick={() => setDraft(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-white/50">{contextSummary}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Ask ${coachName}...`}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        />
        <button
          type="button"
          className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
