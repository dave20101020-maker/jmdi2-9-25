import React, { useCallback, useMemo, useRef, useState } from "react";
import { MODULE_TYPES } from "../engine/moduleTypes";
import MissionControlCard from "../components/MissionControlCard";

import EmptyStateGuidance from "../modules/EmptyStateGuidance";
import { executeMissionControlAction } from "../actions/executeMissionControlAction";
import { useMissionControlGestures } from "../hooks/useMissionControlGestures";
import { openAiChat } from "@/ai/launch/aiChatLauncher";
import {
  emitMissionControlActionEvent,
  fetchMissionControlActionState,
  persistMissionControlActionState,
} from "../persistence/missionControlPersistence";

const ACTION_ORDER = [
  "ASK_AI_COACH",
  "LOG_HABIT",
  "START_SLEEP_PROTOCOL",
  "REVIEW_PRIORITIES",
];

const resolveActionId = (actionId) =>
  ACTION_ORDER.includes(actionId) ? actionId : ACTION_ORDER[0];

const getNextActionId = (actionId) => {
  const current = resolveActionId(actionId);
  const index = ACTION_ORDER.indexOf(current);
  if (index === -1) return ACTION_ORDER[0];
  return ACTION_ORDER[(index + 1) % ACTION_ORDER.length];
};

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

function formatVaultTimestamp(value) {
  if (!value) return "Awaiting sync";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Awaiting sync";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summarizeVaultStorage(storage) {
  if (!storage) return "Storage sources unknown";
  const sources = [];
  if (storage.local) sources.push("Local");
  if (storage.server) sources.push("Server");
  if (!sources.length) return "No storage sources connected";
  return sources.join(" + ");
}

export default function MissionControlRenderer({
  modules = [],
  userState,
  isLoading: isLoadingProp = false,
}) {
  const modulesLoading = modules.some(
    (module) => module?.loading || module?.isLoading
  );
  const isLoading =
    Boolean(isLoadingProp) ||
    Boolean(userState?.loading || userState?.isLoading) ||
    userState?.status === "loading" ||
    modulesLoading;

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

  const cyclePillar = useCallback((direction) => {
    setPillarIndex((current) => current + direction);
  }, []);

  const openNorthStar = useCallback(() => {
    openAiChat({
      draft: "Help me decide what matters most today.",
      aiContext: { mode: "northstar_intro", source: "mission_control" },
    });
  }, []);

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

  const [actionOverride, setActionOverride] = useState(null);

  React.useEffect(() => {
    let active = true;

    const loadActionState = async () => {
      const state = await fetchMissionControlActionState();
      if (!active || !state?.actionId) return;

      if (state.lifecycle === "dismissed") {
        const nextActionId = getNextActionId(state.actionId);
        setActionOverride(nextActionId);
        await persistMissionControlActionState({
          actionId: nextActionId,
          lifecycle: "shown",
          lastUpdatedAt: Date.now(),
        });
        return;
      }

      setActionOverride(resolveActionId(state.actionId));
    };

    loadActionState().catch(() => {
      // Fail-soft: never block Mission Control render due to persistence.
    });

    return () => {
      active = false;
    };
  }, []);

  const activeActionId = actionOverride || primaryAction.actionId;
  const actionLabelById = {
    LOG_HABIT: "Log a quick habit",
    START_SLEEP_PROTOCOL: "Start the sleep protocol",
    REVIEW_PRIORITIES: "Review your priorities",
  };
  const activeActionLabel =
    actionLabelById[activeActionId] || primaryAction.label;

  const handleDefer = useCallback(async () => {
    const timestamp = Date.now();
    await emitMissionControlActionEvent({
      type: "deferred",
      actionId: activeActionId,
      ts: timestamp,
      meta: { source: "mission-control", surface: "primary-action" },
    }).catch(() => {});

    await persistMissionControlActionState({
      actionId: activeActionId,
      lifecycle: "deferred",
      lastUpdatedAt: timestamp,
      userAgency: { deferred: true },
    });
  }, [activeActionId]);

  const handleDismiss = useCallback(async () => {
    const timestamp = Date.now();
    await emitMissionControlActionEvent({
      type: "dismissed",
      actionId: activeActionId,
      ts: timestamp,
      meta: { source: "mission-control", surface: "primary-action" },
    }).catch(() => {});

    const nextActionId = getNextActionId(activeActionId);
    setActionOverride(nextActionId);
    await persistMissionControlActionState({
      actionId: nextActionId,
      lifecycle: "shown",
      lastUpdatedAt: timestamp,
    });
  }, [activeActionId]);

  const insight = useMemo(() => {
    const fallback = "Energy is stable, but one system needs attention today.";
    const source =
      narrativeInsightModule?.body || narrativeInsightModule?.title || fallback;
    return firstSentence(source) || fallback;
  }, [narrativeInsightModule]);

  const vaultStatus = userState?.vault?.status;
  const vaultStatusLabel =
    vaultStatus === "unlocked"
      ? "Unlocked"
      : vaultStatus === "locked"
      ? "Locked"
      : "Status unknown";
  const vaultLastUpdated = formatVaultTimestamp(userState?.vault?.lastSyncAt);
  const vaultStorageSummary = summarizeVaultStorage(userState?.vault?.storage);

  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const startStarLongPress = useCallback(() => {
    longPressTriggeredRef.current = false;

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      openNorthStar();
    }, 520);
  }, [openNorthStar]);

  const cancelStarLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const onStarClick = useCallback(() => {
    if (longPressTriggeredRef.current) return;
    executeMissionControlAction(activeActionId);
  }, [activeActionId]);

  const handleSwipeUp = useCallback(() => setLayer("actions"), []);
  const handleSwipeDown = useCallback(() => setLayer("calm"), []);
  const handleSwipeLeft = useCallback(() => cyclePillar(-1), [cyclePillar]);
  const handleSwipeRight = useCallback(() => cyclePillar(1), [cyclePillar]);

  const gestures = useMissionControlGestures({
    onUp: handleSwipeUp,
    onDown: handleSwipeDown,
    onLeft: handleSwipeLeft,
    onRight: handleSwipeRight,
  });

  void layer;
  void pillarIndex;

  if (isLoading) {
    return (
      <div className="mc-core mc-core--loading" aria-busy="true">
        <div className="mc-life" aria-hidden="true">
          <div className="mc-lifeStar mc-lifeStar--skeleton">
            <div className="mc-skeleton mc-skeleton--score" />
          </div>
        </div>

        <div className="mc-skeleton-group" aria-hidden="true">
          <div className="mc-skeleton mc-skeleton--text" />
          <div className="mc-skeleton mc-skeleton--text mc-skeleton--text-short" />
        </div>

        <div className="mc-actionStack" aria-hidden="true">
          <div className="mc-skeleton mc-skeleton--button" />
          <div className="mc-skeleton-row">
            <div className="mc-skeleton mc-skeleton--pill" />
            <div className="mc-skeleton mc-skeleton--pill" />
          </div>
        </div>

        <div className="mc-skeleton mc-skeleton--dock" aria-hidden="true" />
      </div>
    );
  }

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

      <div className="mc-actionStack">
        <button
          type="button"
          className="mc-primary-action"
          onClick={() => executeMissionControlAction(activeActionId)}
        >
          {activeActionLabel}
        </button>
        <div className="mc-secondary-actions">
          <button type="button" onClick={handleDefer}>
            Defer
          </button>
          <button type="button" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
        <MissionControlCard title="Vault Status" description={vaultStatusLabel}>
          <div className="mt-2 space-y-1 text-sm text-white/70">
            <div>
              Last updated{" "}
              <span className="text-white/90">{vaultLastUpdated}</span>
            </div>
            <div>
              Data source{" "}
              <span className="text-white/90">{vaultStorageSummary}</span>
            </div>
          </div>
        </MissionControlCard>
        <MissionControlCard
          to="/trust-center"
          title="Trust Center"
          description="Privacy, consent, and vault controls."
        />
      </div>

      <button
        type="button"
        className="mc-aiDock"
        aria-label="Open NorthStar (General)"
        onClick={openNorthStar}
      >
        <span className="mc-aiDock__star" aria-hidden="true" />
      </button>
    </div>
  );
}
