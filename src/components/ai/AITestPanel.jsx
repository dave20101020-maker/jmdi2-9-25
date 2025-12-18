import { useCallback, useMemo, useState } from "react";
import NSButton from "@/components/ui/NSButton";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";
import { AI_PING_ENABLED } from "@/config/features";

const IS_DEV = import.meta.env.DEV;
const SHOW =
  IS_DEV ||
  String(import.meta.env.VITE_SHOW_AI_TEST || "").toLowerCase() === "true";

const safeJson = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export default function AITestPanel() {
  if (!AI_PING_ENABLED) return null;

  const [submitting, setSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [lastError, setLastError] = useState("");

  const requestBody = useMemo(() => ({ message: "ping" }), []);

  const safePretty = useCallback((value, fallback = "(unavailable)") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return normalizeErrorMessage(err, fallback);
    }
  }, []);

  const runPing = useCallback(async () => {
    setSubmitting(true);
    setLastError("");

    const request = {
      url: "/api/ai/unified/chat",
      method: "POST",
      body: requestBody,
      at: new Date().toISOString(),
    };

    setLastRequest(safePretty(request, "(none)"));

    try {
      const res = await fetch(request.url, {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request.body),
      });

      const payload = await safeJson(res);
      const responseDebug = {
        ok: res.ok,
        status: res.status,
        payload,
        at: new Date().toISOString(),
      };

      setLastResponse(safePretty(responseDebug, "(unavailable)"));
    } catch (error) {
      setLastError(normalizeErrorMessage(error, "AI request failed"));
      setLastResponse("");
    } finally {
      setSubmitting(false);
    }
  }, [requestBody, safePretty]);

  if (!SHOW) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[min(420px,calc(100vw-2rem))]">
      <div className="ns-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="ns-eyebrow">AI Test</p>
            <p className="text-sm text-white/70">
              Sends <span className="font-mono">{'{ message: "ping" }'}</span>{" "}
              to
              <span className="font-mono"> /api/ai/unified/chat</span>
            </p>
          </div>
          <NSButton
            type="button"
            onClick={runPing}
            loading={submitting}
            disabled={submitting}
          >
            Ping
          </NSButton>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <p className="text-xs font-semibold text-white/80">Request</p>
            <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-black/30 p-2 text-xs text-white/80">
              {lastRequest ? safePretty(lastRequest, "(none)") : "(none)"}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/80">Response</p>
            <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-black/30 p-2 text-xs text-white/80">
              {lastResponse || "(none)"}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/80">Error</p>
            <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-black/30 p-2 text-xs text-white/80">
              {lastError || "(none)"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
