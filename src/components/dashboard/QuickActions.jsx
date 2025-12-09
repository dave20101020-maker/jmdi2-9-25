import React from "react";
import { ArrowUpRight, CheckCircle2, MessageCircle } from "lucide-react";

const ACTIONS = [
  {
    id: "coach",
    title: "Ask your AI coach",
    description: "Get a 3-step plan tailored to today's scores.",
    icon: MessageCircle,
  },
  {
    id: "habit",
    title: "Log a habit",
    description: "Record one win for faster progress tracking.",
    icon: CheckCircle2,
  },
  {
    id: "priority",
    title: "Review priorities",
    description: "See where your weakest pillar needs attention.",
    icon: ArrowUpRight,
  },
];

export default function QuickActions({ actions = ACTIONS }) {
  return (
    <div className="rounded-2xl bg-[#0b1220]/80 backdrop-blur-md shadow-lg shadow-blue-900/30 border border-white/5 p-4 space-y-3">
      <div className="text-sm text-white/70">Quick Actions</div>
      <div className="grid gap-2">
        {actions.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 transition p-3 border border-white/5 text-white"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Icon className="w-4 h-4 text-white/70" />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-white/60">{description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
