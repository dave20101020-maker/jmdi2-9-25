import React, { useEffect, useRef, useState } from "react";
import OrbitalLifeSystem from "../orbit/OrbitalLifeSystem";

const DEFAULT_NARRATIVE = "One priority. One insight. One action.";

function narrativeForAction(actionId) {
  switch (actionId) {
    case "ASK_AI_COACH":
      return "NorthStar (General) opened. Ask one clear question.";
    case "LOG_HABIT":
      return "A win logged. Keep momentum gentle.";
    case "REVIEW_PRIORITIES":
      return "Priority surfaced. Choose one small step.";
    default:
      return DEFAULT_NARRATIVE;
  }
}

export default function MissionControlOrbitalHeader({ userState }) {
  const [narrative, setNarrative] = useState(DEFAULT_NARRATIVE);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    function onActionEvent(event) {
      const actionId = event?.detail?.actionId;
      setNarrative(narrativeForAction(actionId));

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setNarrative(DEFAULT_NARRATIVE);
        resetTimerRef.current = null;
      }, 6000);
    }

    if (typeof window === "undefined") return;
    window.addEventListener("mission-control:action", onActionEvent);

    return () => {
      window.removeEventListener("mission-control:action", onActionEvent);
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const rawPillars = userState?.pillars ?? {};
  const pillarScores = {
    sleep: rawPillars?.sleep?.score,
    diet: rawPillars?.nutrition?.score ?? rawPillars?.diet?.score,
    exercise: rawPillars?.exercise?.score,
    physical: rawPillars?.physical?.score ?? rawPillars?.physical_health?.score,
    mental: rawPillars?.mental?.score ?? rawPillars?.mental_health?.score,
    finances: rawPillars?.finances?.score,
    social: rawPillars?.social?.score,
    spiritual: rawPillars?.purpose?.score ?? rawPillars?.spirituality?.score,
  };

  const lifeScore =
    userState?.lifeScore ??
    (() => {
      const values = Object.values(pillarScores)
        .map((v) => (Number.isFinite(v) ? v : null))
        .filter((v) => v !== null);
      if (!values.length) return 0;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.round(avg);
    })();

  return (
    <header className="sticky top-0 z-40 bg-navy/90 backdrop-blur supports-[backdrop-filter]:bg-navy/70 border-b border-white/5 overflow-visible">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col items-center overflow-visible">
        <div className="flex flex-col items-center">
          <OrbitalLifeSystem
            lifeScore={lifeScore}
            pillarScores={pillarScores}
          />
          <div
            className="mt-2 text-xs text-white/70 tracking-wide text-center"
            aria-live="polite"
          >
            {narrative}
          </div>
        </div>
      </div>
    </header>
  );
}
