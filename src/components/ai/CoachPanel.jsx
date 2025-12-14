import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/apiClient";
import { sanitizeText } from "@/utils/security";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeAiDiagnosticsFromError } from "@/ai/diagnostics";

const stripHtmlTags = (value = "") => value.replace(/<[^>]+>/g, " ");

export default function CoachPanel({
  label = "Coach",
  path = "coach",
  body = {},
  onBeforeRequest,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (onBeforeRequest) onBeforeRequest();
        const res = await api.ai(path, body);
        if (!mounted) return;
        const payload = res.data || res;
        setResult(payload);
        // Persist action items as an action plan if available and pillar info present
        try {
          const actionItems = payload?.coaching?.actionItems;
          const pillarId = body?.pillarFocus || body?.pillar || body?.pillarId;
          if (
            Array.isArray(actionItems) &&
            actionItems.length > 0 &&
            pillarId
          ) {
            const actions = actionItems
              .slice(0, 3)
              .map((text) => ({ text, completed: false }));
            // fire-and-forget; don't block UI
            api
              .createActionPlan({ pillarId, actions })
              .catch((e) => console.debug("action plan save failed", e));
          }
        } catch (e) {
          console.debug("action plan handling error", e);
        }
      } catch (err) {
        if (!mounted) return;
        const diagnostics = normalizeAiDiagnosticsFromError(err, "/api/ai");
        console.debug("CoachPanel AI error", diagnostics, err);
        // error may be object or string
        setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [path, JSON.stringify(body)]);

  // Handle 403-like errors (access denied)
  const isAccessDenied = (err) => {
    if (!err) return false;
    if (typeof err === "string" && err.toLowerCase().includes("access"))
      return true;
    if (err?.status === 403) return true;
    if (
      err?.error &&
      typeof err.error === "string" &&
      err.error.toLowerCase().includes("access")
    )
      return true;
    return false;
  };

  return (
    <div className="bg-[#0A1628]/60 border border-white/10 rounded-2xl p-4">
      <h3 className="text-lg font-bold mb-2">{label}</h3>

      {loading && (
        <div className="space-y-2" aria-label="Loading coach response">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}

      {error && isAccessDenied(error) && (
        <div className="p-3 bg-white/5 rounded">
          <div className="font-semibold">Locked Pillar</div>
          <div className="text-sm text-white/70">
            This pillar is not available on your current plan.{" "}
            <a href="/pricing" className="text-yellow-300 underline">
              Upgrade
            </a>{" "}
            to unlock personalized coaching.
          </div>
        </div>
      )}

      {error && !isAccessDenied(error) && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="font-semibold text-white">
            Coach is unavailable right now
          </div>
          <div className="text-sm text-white/70 mt-1">
            We couldn’t get a response from the AI. Try again in a moment, or
            continue without coaching for now.
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {/* Coach response structure: { focus, chosen, coaching } or generic */}
          {result.focus && (
            <div className="text-sm text-white/70">
              Focus:{" "}
              <strong className="text-white">
                {sanitizeText(
                  Array.isArray(result.chosen?.primaryPillars)
                    ? result.chosen.primaryPillars[0]
                    : result.focus
                )}
              </strong>
            </div>
          )}

          {/* Coaching content */}
          <CoachingCopy
            coaching={result.coaching?.coaching}
            fallback={result}
          />

          {/* Action items */}
          {result.coaching?.actionItems &&
            Array.isArray(result.coaching.actionItems) && (
              <div className="mt-2">
                <div className="text-sm text-white/80 font-semibold">
                  Action items
                </div>
                <ol className="list-decimal list-inside text-sm text-white/70 mt-1">
                  {result.coaching.actionItems.slice(0, 3).map((it, idx) => (
                    <li key={idx}>{sanitizeText(it)}</li>
                  ))}
                </ol>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function CoachingCopy({ coaching, fallback }) {
  const normalized = useMemo(() => {
    if (typeof coaching === "string" && coaching.trim().length > 0) {
      return sanitizeText(stripHtmlTags(coaching).trim());
    }
    if (typeof fallback === "string") {
      return sanitizeText(stripHtmlTags(fallback).trim());
    }
    if (typeof fallback === "object" && fallback) {
      return sanitizeText(JSON.stringify(fallback, null, 2));
    }
    return "";
  }, [coaching, fallback]);

  if (!normalized) {
    return null;
  }

  return (
    <div className="text-white text-sm whitespace-pre-line break-words">
      {normalized}
    </div>
  );
}
