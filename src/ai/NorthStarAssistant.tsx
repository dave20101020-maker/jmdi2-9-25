import React, { useEffect, useMemo, useState } from "react";
import { Send, Sparkles, X, Loader2, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendNorthStarMessage } from "@/api/ai";
import {
  PILLAR_AI_AGENTS,
  getAgentByBackendId,
  getAgentById,
  mapFrontendToBackendPillar,
} from "@/data/pillarAgents";
import { PILLARS } from "@/config/pillars";
import { cn } from "@/utils";
import {
  normalizeAiDiagnosticsFromError,
  renderAiDiagnosticLabel,
} from "@/ai/diagnostics";
import type { AILaunchContext } from "@/ai/context";
import { emitAuditEvent } from "@/api/auditClient";

const DEMO_MODE =
  (import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";
const IS_DEV = import.meta.env.DEV;
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
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [launchContext, setLaunchContext] = useState<AILaunchContext>({
    mode: "northstar_intro",
    source: "global",
  });
  const [pendingIntro, setPendingIntro] = useState<
    | { mode: "northstar_intro" }
    | { mode: "pillar_direct"; agentId: string; module?: string | null }
    | null
  >(null);
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
  const [diagnostics, setDiagnostics] = useState<{
    status?: number;
    body?: string;
    url?: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const activeAgent = useMemo(
    () => getAgentById(activeAgentId) || PILLAR_AI_AGENTS[0],
    [activeAgentId]
  );

  const activePillarLabel = useMemo(() => {
    const pillarId = mapFrontendToBackendPillar(activeAgentId) || null;
    if (!pillarId) return "General";
    const match = PILLARS.find(
      (p) => String(p?.id || "").toLowerCase() === String(activeAgentId)
    );
    return match?.label || activeAgent.name;
  }, [activeAgent.name, activeAgentId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const backendPillar = mapFrontendToBackendPillar(activeAgent.id);

    // Deterministic behavior: do NOT infer pillar/module from the current route
    // when sending. Launch mode is decided at open time only.
    const inferredModule = activeModule;

    const newMessage = {
      id: newId(),
      role: "user" as const,
      text: input,
      pillar: backendPillar || null,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);
    setRouteNote(null);
    setDiagnostics(null);
    setShowDetails(false);

    try {
      let responseText = DEMO_MODE
        ? `Demo response from ${activeAgent.name}: here's a quick actionable step you can try right now.`
        : "NorthStar is thinking...";

      const apiResponse = await sendNorthStarMessage({
        message: input,
        // Only force a pillar when explicitly opened in pillar mode.
        pillar: backendPillar || undefined,
        module: inferredModule || undefined,
        explicitMode: Boolean(backendPillar),
        context: undefined,
      });

      if (apiResponse?.ok === false) {
        responseText =
          apiResponse?.message ||
          "NorthStar is temporarily unavailable. Try again soon or switch to demo mode for local suggestions.";
        setDiagnostics(apiResponse?.diagnostics || null);
      } else if (apiResponse?.response || apiResponse?.text) {
        responseText = apiResponse.response || apiResponse.text;
        setDiagnostics(apiResponse?.diagnostics || null);
      } else if (DEMO_MODE) {
        responseText = `Here's a NorthStar sample plan for ${activeAgent.name}: try one quick win and let me know how it feels.`;
      }

      const resolvedPillar = apiResponse?.pillar || backendPillar || null;
      const resolvedAgent = getAgentByBackendId(resolvedPillar) || activeAgent;

      if (!backendPillar && resolvedPillar && resolvedPillar !== "general") {
        const pillarLabel =
          PILLARS.find(
            (pillar) =>
              String(pillar?.id || "").toLowerCase() ===
              String(resolvedPillar).toLowerCase()
          )?.label || resolvedPillar;
        setRouteNote(
          `NorthStar routed this to ${
            resolvedAgent?.name || "Pillar soldier"
          } (${pillarLabel}).`
        );
        void emitAuditEvent({
          eventType: "AI_ROUTED",
          payload: {
            type: "AI_ROUTED",
            from: "northstar",
            to: resolvedAgent?.id || resolvedPillar,
            pillar: resolvedPillar,
            timestamp: new Date().toISOString(),
            requestId: apiResponse?.requestId || null,
          },
          metadata: { source: "northstar.assistant" },
        });
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
      setDiagnostics(normalizeAiDiagnosticsFromError(error, "/api/ai"));
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (id: string) => {
    setActiveAgentId(id);
    setRouteNote(null);
  };
  const renderDiagnosticLabel = renderAiDiagnosticLabel;

  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true);

      const detail =
        event && "detail" in event
          ? /** @type {{draft?: string; agentId?: string; module?: string; mode?: string; aiContext?: any}} */
            // @ts-expect-error - CustomEvent typing
            event.detail
          : null;

      const requestedMode = (detail?.mode || "").toString().toLowerCase();
      const requestedAgentId = (detail?.agentId || "").toString();
      const requestedDraft = (detail?.draft || "").toString();
      const requestedModule = (detail?.module || "").toString();

      const requestedLaunchContext = (detail?.aiContext ||
        null) as AILaunchContext | null;

      const effectiveLaunchContext: AILaunchContext =
        requestedLaunchContext && typeof requestedLaunchContext === "object"
          ? requestedLaunchContext
          : requestedMode === "pillar" && requestedAgentId
          ? { mode: "pillar_direct", pillarId: requestedAgentId }
          : { mode: "northstar_intro", source: "global" };

      setLaunchContext(effectiveLaunchContext);

      // Deterministic open behavior:
      // - northstar_intro => NorthStar introduces itself first.
      // - pillar_direct => open pillar coach directly (no NorthStar intro).
      if (effectiveLaunchContext.mode === "northstar_intro") {
        setActiveAgentId("northstar");
        setActiveModule(null);
        // Auto-intro is only applied on a fresh chat view.
        setPendingIntro({ mode: "northstar_intro" });
      }

      if (effectiveLaunchContext.mode === "pillar_direct") {
        const pillarAgentId = effectiveLaunchContext.pillarId;
        setActiveAgentId(pillarAgentId);
        setActiveModule(requestedModule ? requestedModule : null);
        setPendingIntro({
          mode: "pillar_direct",
          agentId: pillarAgentId,
          module: requestedModule ? requestedModule : null,
        });
      }

      if (requestedDraft) {
        setInput((current) =>
          current && current.trim() ? current : requestedDraft
        );
      }
    };
    const onToggle = () => setOpen((v) => !v);

    window.addEventListener("northstar:open", onOpen);
    window.addEventListener("northstar:toggle", onToggle);
    return () => {
      window.removeEventListener("northstar:open", onOpen);
      window.removeEventListener("northstar:toggle", onToggle);
    };
  }, []);

  useEffect(() => {
    const runAutoIntro = async () => {
      if (!open) return;
      if (!pendingIntro) return;
      if (messages.length > 0) {
        setPendingIntro(null);
        return;
      }
      if (loading) return;

      setLoading(true);
      setRouteNote(null);
      setDiagnostics(null);
      setShowDetails(false);

      try {
        const isPillar = pendingIntro.mode === "pillar_direct";
        const agentId = isPillar ? pendingIntro.agentId : "northstar";
        const agent = getAgentById(agentId);
        const backendPillar = mapFrontendToBackendPillar(agentId);

        const kickoff = isPillar
          ? `Please introduce yourself as ${
              agent?.name || "the pillar coach"
            } and ask one focused question to get started.`
          : "Hi! Please introduce yourself as NorthStar AI, explain how you help across pillars, and ask one quick question to get started.";

        const apiResponse = await sendNorthStarMessage({
          message: kickoff,
          pillar: isPillar ? backendPillar || undefined : undefined,
          module: isPillar ? pendingIntro.module || undefined : undefined,
          explicitMode: Boolean(isPillar && backendPillar),
          context: undefined,
        });

        const responseText =
          apiResponse?.reply ||
          apiResponse?.response ||
          apiResponse?.text ||
          apiResponse?.message ||
          "Hi! I'm NorthStar AI. How can I help today?";

        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant" as const,
            text: responseText,
            pillar: apiResponse?.pillar || (isPillar ? backendPillar : null),
            agentName: agent?.name || "NorthStar AI",
            provider: apiResponse?.provider,
          },
        ]);
      } catch (error) {
        console.error("NorthStar AI intro failed", error);
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant" as const,
            text: "Hi! I'm NorthStar AI. How can I help today?",
            pillar: null,
            agentName: "NorthStar AI",
          },
        ]);
        setDiagnostics(normalizeAiDiagnosticsFromError(error, "/api/ai"));
      } finally {
        setLoading(false);
        setPendingIntro(null);
      }
    };

    runAutoIntro();
  }, [loading, messages.length, open, pendingIntro]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 md:bottom-4 z-50 flex justify-center">
      {open && (
        <div className="pointer-events-auto mb-3 w-[min(420px,calc(100vw-2.5rem))] rounded-2xl border border-slate-800 bg-slate-950/95 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                {activeAgentId === "northstar"
                  ? "NorthStar AI"
                  : activeAgent.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                  {activePillarLabel}
                </span>
                {activeModule === "neuroshield" && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                    NeuroShield
                  </span>
                )}
              </div>
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

          {/* Coach selection intentionally removed.
              - Central AI button opens NorthStar.
              - Pillar pages open their agent directly via northstar:open({mode:'pillar', agentId}). */}

          {routeNote && (
            <div className="flex items-start gap-2 bg-amber-500/10 text-amber-200 text-xs px-4 py-2 border-b border-amber-400/40">
              <ShieldCheck className="h-4 w-4 mt-0.5" />
              <p>{routeNote}</p>
            </div>
          )}

          {diagnostics && (
            <div className="px-4 py-2 text-xs text-amber-100 bg-amber-500/10 border-b border-amber-400/30 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-amber-100">
                  {renderAiDiagnosticLabel(diagnostics)}
                </p>
                <p className="text-amber-200/80">
                  Try again in a moment. If it keeps happening, close and reopen
                  this panel.
                </p>
              </div>
              {IS_DEV && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-400/50 text-amber-100 hover:bg-amber-500/10"
                  onClick={() => setShowDetails((v) => !v)}
                >
                  {showDetails ? "Hide details" : "View details"}
                </Button>
              )}
            </div>
          )}

          {IS_DEV && diagnostics && showDetails && (
            <div className="px-4 py-3 text-xs bg-slate-900/80 border-b border-slate-800 space-y-1">
              <div className="flex gap-2">
                <span className="text-slate-400 w-16">Status</span>
                <span className="text-slate-100">
                  {diagnostics.status ?? "n/a"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-16">URL</span>
                <span className="text-slate-100 break-all">
                  {diagnostics.url || "/api/ai"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-16">Body</span>
                <span className="text-slate-100 break-all whitespace-pre-wrap">
                  {(diagnostics.body || "(empty)").toString().slice(0, 800)}
                </span>
              </div>
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

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          open ? "Hide NorthStar (General)" : "Open NorthStar (General)"
        }
        className="pointer-events-auto relative hidden md:flex flex-col items-center justify-center rounded-2xl px-2 py-1 transition-transform duration-150 ease-out active:scale-95"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1 h-16 w-16 rounded-3xl bg-ns-gold/25 blur-xl"
        />
        <span
          className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ns-gold text-ns-navy shadow-ns-card ring-2 ring-[var(--ns-color-border)] transition-transform duration-150 ease-out active:scale-[0.98]"
          aria-hidden
        >
          <Sparkles className="h-7 w-7" />
        </span>
        <span className="mt-1 text-[11px] font-semibold text-white/85">
          NorthStar (General)
        </span>
      </button>
    </div>
  );
}
