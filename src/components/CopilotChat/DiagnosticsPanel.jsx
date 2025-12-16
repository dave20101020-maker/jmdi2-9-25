import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";

export default function DiagnosticsPanel({ open, onClose, diagnostics }) {
  if (!open) return null;

  const toText = (value, fallback) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : fallback;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (value == null) return fallback;

    return normalizeErrorMessage(value, fallback);
  };

  const items = [
    { label: "Status", value: toText(diagnostics?.status, "n/a") },
    { label: "Code", value: toText(diagnostics?.code, "AI-UNKNOWN") },
    { label: "Message", value: toText(diagnostics?.message, "(none)") },
    { label: "URL", value: toText(diagnostics?.url, "/api/ai") },
    {
      label: "Body",
      value: toText(diagnostics?.body, "(empty)").slice(0, 800),
    },
    {
      label: "Timestamp",
      value: toText(diagnostics?.timestamp, new Date().toISOString()),
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="w-[min(520px,calc(100vw-1.5rem))] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Diagnostics
            </p>
            <p className="text-sm text-slate-200">
              AI provider status & payload
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close diagnostics"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 py-3 text-sm space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex gap-3">
              <span className="w-28 text-slate-400 text-xs uppercase tracking-wide">
                {item.label}
              </span>
              <span className="text-slate-100 break-all whitespace-pre-wrap">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs text-slate-400">
            For deeper checks, visit Settings → AI Coach or contact support with
            the code above.
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.href = "/settings";
            }}
          >
            Open Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
