import React from "react";
import { Button } from "@/components/ui/button";
import { useDiagnosticsStore } from "@/store/diagnosticsStore";

export default function DiagnosticsPanel() {
  const diagnostics = useDiagnosticsStore((s) => s.diagnostics);
  const hasData = Boolean(diagnostics?.timestamp);

  const truncate = (val) => {
    if (!val) return "(empty)";
    const str = val.toString();
    return str.length > 800 ? `${str.slice(0, 800)}…` : str;
  };

  const copyPayload = async () => {
    const payload = {
      url: diagnostics?.url || "/api/ai",
      status: diagnostics?.status ?? "n/a",
      code: diagnostics?.code || "AI-UNKNOWN",
      message: diagnostics?.message || "",
      body: diagnostics?.body || "",
      timestamp: diagnostics?.timestamp || new Date().toISOString(),
      env: diagnostics?.env || import.meta.env.MODE || "development",
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Diagnostics</h3>
          <p className="text-sm text-slate-400">
            Latest AI request metadata for debugging.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasData}
          onClick={copyPayload}
        >
          Copy debug payload
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100">
        <InfoRow label="Status" value={diagnostics?.status ?? "n/a"} />
        <InfoRow label="Code" value={diagnostics?.code || "AI-UNKNOWN"} />
        <InfoRow
          label="URL"
          value={diagnostics?.url || "/api/ai"}
          isMonospace
        />
        <InfoRow label="Message" value={diagnostics?.message || "(none)"} />
        <InfoRow label="Body" value={truncate(diagnostics?.body)} isMonospace />
        <InfoRow
          label="Timestamp"
          value={diagnostics?.timestamp || "Not captured yet"}
        />
        <InfoRow label="Environment" value={diagnostics?.env || "n/a"} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, isMonospace }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 text-xs uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span
        className={`flex-1 break-all whitespace-pre-wrap ${
          isMonospace ? "font-mono text-xs" : ""
        }`}
      >
        {value || ""}
      </span>
    </div>
  );
}
