/**
 * Phase 5.0 — Registry-Driven Composition
 *
 * Deterministic, rule-based module composition.
 * No AI. No persistence influence.
 */

import { MODULE_TYPES } from "../engine/moduleTypes";
import { normalizeUserState } from "../engine/normalizeUserState";
import { MISSION_CONTROL_MODULES as M } from "../modules/missionControlRegistry";

function getPriorityPillar(user) {
  if (!user?.pillars) return null;

  const order = [
    "sleep",
    "nutrition",
    "mental",
    "exercise",
    "physical",
    "finances",
    "social",
    "purpose",
  ];

  return (
    order.find(
      (key) =>
        user.pillars[key]?.score !== undefined && user.pillars[key].score < 60
    ) ?? null
  );
}

export function composeMissionControlModules(
  rawUserState,
  timeContext = {},
  preferences = {}
) {
  // Note: timeContext/preferences are reserved for later phases.
  void timeContext;
  void preferences;

  if (import.meta?.env?.DEV) {
    const seen = new Set();
    for (const entry of Object.values(M)) {
      const type = entry?.type;
      if (!type) continue;
      if (seen.has(type)) {
        console.warn("[MissionControl] Duplicate module type:", type);
      }
      seen.add(type);
    }
  }

  const user = normalizeUserState(rawUserState);
  const modules = [];

  const unauthenticated = rawUserState?.isAuthenticated === false;
  const hasNoData = rawUserState?.lifeScore === 0;
  const priorityPillar = getPriorityPillar(user);

  // PHASE 1.5: Progressive surfacing rules
  // Enforce single dominant priority
  // (Hick’s Law: reduce choice to one high-impact action)
  const hasCompletedToday = user.todayCompleted === true;

  // 1. Primary surfaced module
  if (unauthenticated) {
    modules.push({
      id: M.PRIORITY_ACTION.id,
      type: MODULE_TYPES.PRIORITY_ACTION,
      reason: "auth",
    });
  } else if (hasNoData) {
    modules.push({
      id: M.EMPTY_STATE_GUIDANCE.id,
      type: "EMPTY_STATE_GUIDANCE",
      reason: "No data yet — show onboarding guidance",
    });
  } else if (priorityPillar) {
    modules.push({
      id: M.PRIORITY_ACTION.id,
      type: MODULE_TYPES.PRIORITY_ACTION,
      pillar: priorityPillar,
    });
  } else {
    modules.push({
      id: M.PRIORITY_ACTION.id,
      type: MODULE_TYPES.PRIORITY_ACTION,
      reason: "Single highest-impact action for today",
    });
  }

  // 2. Narrative Insight (only if user has data)
  if (!unauthenticated && !hasNoData && user.hasAnyData && !hasCompletedToday) {
    modules.push({
      id: M.NARRATIVE_INSIGHT.id,
      type: MODULE_TYPES.NARRATIVE_INSIGHT,
      reason: "Contextual insight to reduce cognitive load",
    });
  }

  // 3. Overall Score (supporting, never dominant)
  modules.push({
    id: M.OVERALL_SCORE.id,
    type: MODULE_TYPES.OVERALL_SCORE,
    emphasis: "secondary",
  });

  // 4. Pillar Overview (collapsed)
  modules.push({
    id: M.PILLAR_OVERVIEW.id,
    type: MODULE_TYPES.PILLAR_OVERVIEW,
    userConfigurable: true,
    collapsed: true,
  });

  // 5. Conditional Momentum
  if (user.momentum.checkIns > 0) {
    modules.push({
      id: M.MOMENTUM.id,
      type: MODULE_TYPES.MOMENTUM,
    });
  }

  // 6. Support (only if signals detected)
  if (user.distressSignals) {
    modules.push({
      id: M.SUPPORT.id,
      type: MODULE_TYPES.SUPPORT,
    });
  }

  // 7. AI Entry (always last)
  modules.push({
    id: M.AI_ENTRY.id,
    type: MODULE_TYPES.AI_ENTRY,
  });

  return modules;
}
