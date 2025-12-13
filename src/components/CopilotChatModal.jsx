import React, { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";

const fallbackReply = (prompt) =>
  `Mock reply for: "${prompt}". The AI service is unavailable (503).`;

export default function CopilotChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [open, messages]);

  if (!open) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;
    const prompt = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    const userMsg = { id: crypto.randomUUID(), role: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/unified/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: prompt }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const reply =
          res.status === 503
            ? fallbackReply(prompt)
            : data?.message || "AI temporarily unavailable";
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: reply },
        ]);
        setError({ status: res.status, body: text });
      } else {
        const reply = data?.reply || data?.response || data?.text || "Okay.";
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: reply },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: fallbackReply(prompt),
        },
      ]);
      setError({ message: err?.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="mb-4 w-[min(520px,calc(100vw-1.5rem))] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Copilot
            </p>
            <p className="text-sm text-slate-200">
              Powered by /api/ai/unified/chat
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
            aria-label="Close Copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-amber-100 bg-amber-500/10 border-b border-amber-400/30">
            Connection issue. Status: {error.status || "n/a"}. Using mock reply.
          </div>
        )}

        <div
          ref={containerRef}
          className="max-h-[50vh] min-h-[240px] overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-slate-900/80 to-slate-950"
        >
          {messages.length === 0 && (
            <p className="text-sm text-slate-400">
              Ask anything to get started.
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap border ${
                  msg.role === "user"
                    ? "bg-cyan-500/15 text-cyan-50 border-cyan-400/50"
                    : "bg-slate-800 text-slate-100 border-slate-700"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                  {msg.role === "user" ? "You" : "Copilot"}
                </div>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 bg-slate-950 p-3 flex items-center gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ask Copilot..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-slate-900 font-semibold disabled:opacity-60"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
