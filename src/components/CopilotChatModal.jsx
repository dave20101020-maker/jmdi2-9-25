import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Send, Loader2, AlertTriangle } from "lucide-react";
import DiagnosticsPanel from "./CopilotChat/DiagnosticsPanel";
import useDiagnosticsStore from "@/store/diagnosticsStore";
import { apiClient } from "@/utils/apiClient";
import {
  normalizeAiDiagnosticsFromError,
  renderAiDiagnosticLabel,
} from "@/ai/diagnostics";
import { useAuth } from "@/hooks/useAuth";

const fallbackReply = (prompt) =>
  `Mock reply for: "${prompt}". The AI service is unavailable (503).`;

const useCrisisDetection = () => {
  const [crisisState, setCrisisState] = useState(null);

  const evaluateCrisisSignal = useCallback((payload) => {
    if (!payload || typeof payload !== "object") return;

    const flags = Array.isArray(payload.flags)
      ? payload.flags.map((flag) => flag?.toString().toLowerCase())
      : [];
    const riskLevel = (payload.riskLevel || payload.risk_level || "")
      .toString()
      .toLowerCase();
    const mentalRisk = (
      payload.mentalHealthRisk ||
      payload.mental_health_risk ||
      payload?.mental_health?.risk ||
      ""
    )
      .toString()
      .toLowerCase();
    const hasCrisisFlag = flags.some((flag) => flag && flag.includes("crisis"));
    const hasHighRisk = [riskLevel, mentalRisk].some((lvl) =>
      ["high", "severe"].includes(lvl)
    );
    const crisisField =
      payload.crisis === true ||
      payload.isCrisis === true ||
      payload.crisis_mode === true;

    if (crisisField || hasCrisisFlag || hasHighRisk) {
      setCrisisState({
        title: "Crisis Mode",
        detail:
          payload.crisisSummary ||
          payload.summary ||
          payload.message ||
          "Potential crisis language detected. Consider using the Emergency Toolkit.",
        riskLevel: riskLevel || mentalRisk || "high",
      });
    }
  }, []);

  const resetCrisis = useCallback(() => setCrisisState(null), []);

  return { crisisState, evaluateCrisisSignal, resetCrisis };
};

export default function CopilotChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [accessIssue, setAccessIssue] = useState(null);
  const { user, initializing, demoMode } = useAuth();
  const isAuthenticated = Boolean(user) || demoMode;
  const { crisisState, evaluateCrisisSignal, resetCrisis } =
    useCrisisDetection();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const setDiagnosticsStore = useDiagnosticsStore((s) => s.setDiagnostics);
  const containerRef = useRef(null);

  const hasAiConsent = () => {
    try {
      const legacy = JSON.parse(localStorage.getItem("aiConsent") || "null");
      if (legacy?.aiConsent === true) return true;
    } catch {
      // ignore
    }
    try {
      const modern = JSON.parse(
        localStorage.getItem("ai_usage_consent") || "null"
      );
      if (modern?.aiFeatures === true) return true;
    } catch {
      // ignore
    }
    return false;
  };

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [open, messages]);

  useEffect(() => {
    if (open) {
      setAccessIssue(null);
      resetCrisis();
    }
  }, [open, resetCrisis]);

  if (!open) return null;

  const mapError = ({ status, message, timeout, code, body }) => {
    const normalizedCode = (code || body?.code || "").toString().toLowerCase();
    const normalizedMessage = (message || body?.message || "")
      .toString()
      .toLowerCase();
    const consentRequired =
      normalizedCode.includes("consent") ||
      normalizedMessage.includes("consent required") ||
      normalizedMessage.includes("consent") ||
      body?.reason === "consent_required";

    if (timeout) {
      return {
        friendly: "AI provider timed out. Please try again.",
        code: "AI-TIMEOUT",
      };
    }

    if (status === 401) {
      return {
        friendly: "Sign in required to use NorthStar AI.",
        code: "AI-401",
        accessIssue: {
          type: "auth",
          title: "Sign in to continue",
          message: "Your session is missing or expired. Sign in to chat.",
          primaryCta: { label: "Sign in", href: "/login" },
          secondaryCta: { label: "Create account", href: "/register" },
        },
      };
    }

    if (consentRequired) {
      return {
        friendly: "Consent required before using NorthStar AI.",
        code: "AI-CONSENT-REQUIRED",
        accessIssue: {
          type: "consent",
          title: "Consent required",
          message:
            "We need your consent to enable AI chat. Review and grant consent in Settings.",
          primaryCta: { label: "Review consent", href: "/settings" },
          secondaryCta: { label: "Sign in", href: "/login" },
        },
      };
    }

    if (status === 429) {
      return {
        friendly: "Rate limited. Try again in a few moments.",
        code: "AI-429",
      };
    }

    if (status === 503) {
      return {
        friendly: "AI temporarily unavailable (503). Using fallback reply.",
        code: "AI-503",
      };
    }

    return {
      friendly: message || "AI service temporarily unavailable.",
      code: status ? `AI-${status}` : "AI-ERROR",
    };
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Defensive: re-check auth/consent at send time.
    // FloatingCopilotButton already gates modal opening, but state can change.
    if (initializing || !isAuthenticated) {
      setAccessIssue({
        type: "auth",
        title: "Sign in to continue",
        message: "Your session is missing or expired. Sign in to chat.",
        primaryCta: { label: "Sign in", href: "/login" },
        secondaryCta: { label: "Create account", href: "/register" },
      });
      return;
    }

    if (!hasAiConsent()) {
      setAccessIssue({
        type: "consent",
        title: "Consent required",
        message:
          "We need your consent to enable AI chat. Review and grant consent in Settings.",
        primaryCta: { label: "Review consent", href: "/settings" },
        secondaryCta: { label: "Sign in", href: "/login" },
      });
      return;
    }

    const prompt = input.trim();
    setInput("");
    setSending(true);
    setError(null);
    setAccessIssue(null);
    setShowDiagnostics(false);

    const userMsg = { id: crypto.randomUUID(), role: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data = await apiClient.request("/ai/unified/chat", {
        method: "POST",
        body: { message: prompt },
        retryOnUnauthorized: false,
      });

      const reply = data?.reply || data?.response || data?.text || "Okay.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ]);
      evaluateCrisisSignal(data);
    } catch (err) {
      const normalizedDiagnostics = normalizeAiDiagnosticsFromError(
        err,
        "/api/ai"
      );
      const diagnosticLabel = renderAiDiagnosticLabel(normalizedDiagnostics);

      const mapped = mapError({
        status: normalizedDiagnostics.status,
        message: err?.message,
        timeout:
          normalizedDiagnostics.status === 0 &&
          normalizedDiagnostics.body === "timeout",
        code: err?.code,
        body: err?.body,
      });
      if (mapped?.accessIssue) {
        setAccessIssue(mapped.accessIssue);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: mapped.friendly || fallbackReply(prompt),
          },
        ]);
      }
      setError({
        status: normalizedDiagnostics.status,
        message: diagnosticLabel,
        code: mapped.code,
        body: normalizedDiagnostics.body,
        timestamp: new Date().toISOString(),
        url: normalizedDiagnostics.url,
      });
      setDiagnosticsStore({
        status: normalizedDiagnostics.status,
        body: normalizedDiagnostics.body,
        code: mapped.code,
        message: diagnosticLabel,
        url: normalizedDiagnostics.url,
      });
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
          <div className="px-4 py-2 text-xs text-amber-100 bg-amber-500/10 border-b border-amber-400/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              <div>
                <p className="font-semibold text-amber-100">
                  {error.message || "AI issue"}
                </p>
                <p className="text-amber-200/80">
                  {`Status: ${error.status ?? "n/a"}`} · Code:{" "}
                  {error.code || "AI-ERROR"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDiagnostics(true)}
              className="text-amber-100 underline decoration-amber-300/60 decoration-dashed text-xs"
            >
              View diagnostics
            </button>
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

        {crisisState && (
          <div className="border-t border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-50 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-300 mt-[2px]" />
              <div>
                <p className="font-semibold text-rose-100">
                  {crisisState.title || "Crisis Mode"}
                </p>
                <p className="text-rose-50/90">{crisisState.detail}</p>
                <p className="text-[11px] text-rose-100/70">
                  Risk level: {crisisState.riskLevel || "high"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/pillars/mental_health"
                className="inline-flex items-center justify-center rounded-lg bg-white text-rose-900 px-3 py-2 text-sm font-semibold shadow hover:brightness-95"
              >
                Open Emergency Toolkit
              </Link>
              <button
                type="button"
                onClick={resetCrisis}
                className="inline-flex items-center justify-center rounded-lg border border-rose-700 px-3 py-2 text-sm font-semibold text-rose-50 hover:border-rose-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {accessIssue && (
          <div className="border-t border-slate-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-50 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300 mt-[2px]" />
              <div>
                <p className="font-semibold text-amber-100">
                  {accessIssue.title}
                </p>
                <p className="text-amber-50/90">{accessIssue.message}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {accessIssue.primaryCta && (
                <Link
                  to={accessIssue.primaryCta.href}
                  className="inline-flex items-center justify-center rounded-lg bg-ns-gold px-3 py-2 text-sm font-semibold text-ns-navy shadow hover:brightness-95"
                >
                  {accessIssue.primaryCta.label}
                </Link>
              )}
              {accessIssue.secondaryCta && (
                <Link
                  to={accessIssue.secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
                >
                  {accessIssue.secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        )}

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
            disabled={sending || Boolean(accessIssue)}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim() || Boolean(accessIssue)}
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

      <DiagnosticsPanel
        open={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        diagnostics={error}
      />
    </div>
  );
}
