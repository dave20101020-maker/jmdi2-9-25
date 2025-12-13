import React, { useState } from "react";
import CopilotChatModal from "./CopilotChatModal";
import { MessageSquare } from "lucide-react";

export default function FloatingCopilotButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:scale-[1.02] transition"
        aria-label="Open Copilot chat"
      >
        <MessageSquare className="h-4 w-4" />
        Copilot
      </button>

      <CopilotChatModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
