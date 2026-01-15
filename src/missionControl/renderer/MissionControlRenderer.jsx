import React, { useMemo, useRef, useState } from "react";
import { MODULE_TYPES } from "../engine/moduleTypes";

import EmptyStateGuidance from "../modules/EmptyStateGuidance";
import { executeMissionControlAction } from "../actions/executeMissionControlAction";
import { useMissionControlGestures } from "../hooks/useMissionControlGestures";
import { openAiChat } from "@/ai/launch/aiChatLauncher";

function clampScore(value) {
  const n = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function firstSentence(text) {
  if (typeof text !== "string") return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^(.+?[.!?])\s|^(.+)$|^(.+?[.!?])$/);
  const sentence = (match?.[1] || match?.[2] || match?.[3] || cleaned).trim();
  return sentence.length > 140 ? `${sentence.slice(0, 137).trim()}…` : sentence;
}

export default function MissionControlRenderer({ modules = [], userState }) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return <EmptyStateGuidance />;
  }

  const lifeScore = clampScore(userState?.lifeScore);

  const priorityActionModule = modules.find(
    (module) => module?.type === MODULE_TYPES.PRIORITY_ACTION
  );
  const primaryActionModule = modules.find(
    (module) => module?.type === "primaryAction"
  );
  const narrativeInsightModule = modules.find(
    (module) => module?.type === MODULE_TYPES.NARRATIVE_INSIGHT
  );

  const [layer, setLayer] = useState("calm");
  const [pillarIndex, setPillarIndex] = useState(0);

  const cyclePillar = (direction) => {
    setPillarIndex((current) => current + direction);
  };

  const openNorthStar = () => {
    openAiChat({
      draft: "Help me decide what matters most today.",
      aiContext: { mode: "northstar_intro", source: "mission_control" },
    });
  };

  const primaryAction = useMemo(() => {
    const actionId = primaryActionModule?.actionId ?? "ASK_AI_COACH";

    const labelFromPriorityPillar = (() => {
      const pillar = priorityActionModule?.pillar;
      const copyByPillar = {
        sleep: "Wind down earlier tonight",
        nutrition: "Do a simple nutrition check-in",
        mental: "Take a short mental reset",
        exercise: "Do light movement now",
      };
      return pillar ? copyByPillar[pillar] : "Do this now";
    })();

    const label =
      typeof primaryActionModule?.title === "string" &&
      primaryActionModule.title
        ? primaryActionModule.title
        : labelFromPriorityPillar;

    return { actionId, label };
  }, [primaryActionModule, priorityActionModule]);

  const insight = useMemo(() => {
    const fallback = "Energy is stable, but one system needs attention today.";
    const source =
      narrativeInsightModule?.body || narrativeInsightModule?.title || fallback;
    return firstSentence(source) || fallback;
  }, [narrativeInsightModule]);

  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const startStarLongPress = () => {
    longPressTriggeredRef.current = false;

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      openNorthStar();
    }, 520);
  };

  const cancelStarLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const onStarClick = () => {
    if (longPressTriggeredRef.current) return;
    executeMissionControlAction(primaryAction.actionId);
  };

  const gestures = useMissionControlGestures({
    onUp: () => setLayer("actions"),
    onDown: () => setLayer("calm"),
    onLeft: () => cyclePillar(-1),
    onRight: () => cyclePillar(1),
  });

  void layer;
  void pillarIndex;

  return (
    <div className="mc-core" {...gestures}>
      <div className="mc-life" aria-label={`LifeScore ${lifeScore}`}>
        <button
          type="button"
          className="mc-lifeStar"
          aria-label="Execute primary action"
          onPointerDown={startStarLongPress}
          onPointerUp={cancelStarLongPress}
          onPointerCancel={cancelStarLongPress}
          onPointerLeave={cancelStarLongPress}
          onClick={onStarClick}
        >
          <span className="mc-lifeStar__score lifescore">{lifeScore}</span>
        </button>
      </div>

      <p className="mc-oneSentence" aria-live="polite">
        {insight}
      </p>

      <div>
        <button
          type="button"
          className="mc-primary-action"
          onClick={() => executeMissionControlAction(primaryAction.actionId)}
        >
          {primaryAction.label}
        </button>
      </div>

      <button
        type="button"
        className="mc-aiDock"
        aria-label="Open AI command"
        onClick={openNorthStar}
      >
        <span className="mc-aiDock__star" aria-hidden="true" />
      </button>
    </div>
  );
}
