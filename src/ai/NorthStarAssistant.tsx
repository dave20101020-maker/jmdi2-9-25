import React, { useMemo, useState } from "react";
import {
  Send,
  MessageCircle,
  Sparkles,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendNorthStarMessage } from "@/api/ai";
import {
  PILLAR_AI_AGENTS,
  getAgentByBackendId,
  getAgentById,
  mapFrontendToBackendPillar,
} from "@/data/pillarAgents";
import { cn } from "@/utils";

const DEMO_MODE =
  (import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";
const newId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-6 text-slate-400">
    <Sparkles className="h-8 w-8 mb-3" />
    <p className="font-semibold text-slate-200">Ask NorthStar anything</p>
    <p className="text-sm text-slate-400">
      General support by default. Mention pillar keywords or choose a coach to
      switch to the right AI instantly.
    </p>
  </div>
);

export default function NorthStarAssistant() {
  const [open, setOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string>("northstar");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{
    id: string;
    role: "user" | "assistant";
    text: string;
    pillar?: string | null;
    agentName?: string;
    provider?: string;
  }>([]);
  const [loading, setLoading] = useState(false);
  const [routeNote, setRouteNote] = useState<string | null>(null);

  const activeAgent = useMemo(
    () => getAgentById(activeAgentId) || PILLAR_AI_AGENTS[0],
    [activeAgentId]
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    const backendPillar = mapFrontendToBackendPillar(activeAgent.id);
    const newMessage = {
      id: newId(),
      role: "user" as const,
      text: input,
      pillar: backendPillar,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);
    setRouteNote(null);

    try {
      let responseText = DEMO_MODE
        ? `Demo response from ${activeAgent.name}: here's a quick actionable step you can try right now.`
        : "NorthStar is thinking...";

      const apiResponse = await sendNorthStarMessage({
        message: input,
        pillar: backendPillar || undefined,
        explicitMode: !!backendPillar,
      });

      if (apiResponse?.ok === false) {
        responseText =
          apiResponse?.message ||
          "NorthStar is temporarily unavailable. Try again soon or switch to demo mode for local suggestions.";
      } else if (apiResponse?.response || apiResponse?.text) {
        responseText = apiResponse.response || apiResponse.text;
      } else if (DEMO_MODE) {
        responseText = `Here's a NorthStar sample plan for ${activeAgent.name}: try one quick win and let me know how it feels.`;
      }

      const resolvedPillar = apiResponse?.pillar || backendPillar || null;
      const resolvedAgent = getAgentByBackendId(resolvedPillar) || activeAgent;

      if (!backendPillar && resolvedPillar && resolvedPillar !== "general") {
        setRouteNote(
          `${
            resolvedAgent?.name || "Pillar coach"
          } picked up on your request. Switching you into pillar-specific guidance.`
        );
      }

      const assistantMessage = {
        id: newId(),
        role: "assistant" as const,
        text: responseText,
        pillar: resolvedPillar,
        agentName: resolvedAgent?.name || "NorthStar AI",
        provider: apiResponse?.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("NorthStar AI send failed", error);
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          text: "We hit a snag reaching the AI service. Please try again in a moment.",
          pillar: backendPillar,
          agentName: "NorthStar AI",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (id: string) => {
    setActiveAgentId(id);
    setRouteNote(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-[380px] max-w-[90vw] rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                NorthStar AI
              </p>
              <p className="text-sm text-slate-200">
                General by default · Pillar aware routing
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close NorthStar AI panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="px-4 py-3 border-b border-slate-800 grid grid-cols-3 gap-2"
            aria-label="AI coach selector"
          >
            {PILLAR_AI_AGENTS.map((agent) => (
              <button
                key={agent.id}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left text-xs transition",
                  activeAgentId === agent.id
                    ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-100"
                    : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700"
                )}
                onClick={() => toggleAgent(agent.id)}
              >
                <p className="font-semibold">{agent.name}</p>
                <p className="text-[11px] leading-tight text-slate-400">
                  {agent.description}
                </p>
              </button>
            ))}
          </div>

          {routeNote && (
            <div className="flex items-start gap-2 bg-amber-500/10 text-amber-200 text-xs px-4 py-2 border-b border-amber-400/40">
              <ShieldCheck className="h-4 w-4 mt-0.5" />
              <p>{routeNote}</p>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && <EmptyState />}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-cyan-500/20 text-cyan-50 border border-cyan-400/40"
                      : "bg-slate-800 text-slate-100 border border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    <span>
                      {msg.role === "user"
                        ? "You"
                        : msg.agentName || "NorthStar AI"}
                    </span>
                    {msg.provider && (
                      <span className="text-[10px] text-slate-500">
                        {msg.provider}
                      </span>
                    )}
                  </div>
                  <p>{msg.text}</p>
                  {msg.pillar && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Pillar: {msg.pillar}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 p-3 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeAgent.id === "northstar"
                  ? "Ask anything..."
                  : `Ask ${activeAgent.name}`
              }
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={loading || !input.trim()}
              aria-label="Send to NorthStar AI"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <Button
        onClick={() => setOpen((prev) => !prev)}
        className="shadow-lg"
        variant="default"
        size="lg"
        aria-label={open ? "Hide NorthStar AI" : "Open NorthStar AI"}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {open ? "Hide NorthStar AI" : "NorthStar AI"}
      </Button>
    </div>
  );
}
