import { MODULE_TYPES } from "./moduleTypes";
import { normalizeUserState } from "./normalizeUserState";
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

  return order.find(
    (key) =>
      user.pillars[key]?.score !== undefined && user.pillars[key].score < 60
  );
}

/**
 * Determines which Mission Control modules to show, and in what order.
 * This function is PURE and deterministic.
 */

export function getMissionControlModules(
  rawUserState,
  timeContext = {},
  preferences = {}
) {
  const user = normalizeUserState(rawUserState);
  const modules = [];

  const unauthenticated = rawUserState?.isAuthenticated === false;
  const hasNoData = rawUserState?.lifeScore === 0;
  const priorityPillar = getPriorityPillar(user);

  // PHASE 1.5: Progressive surfacing rules
  // Enforce single dominant priority
  // (Hicks Law: reduce choice to one high-impact action)
  const hasCompletedToday = user.todayCompleted === true;

  // 1. Primary surfaced module
  if (unauthenticated) {
    modules.push({
      id: M.PRIORITY_ACTION,
      type: MODULE_TYPES.PRIORITY_ACTION,
      reason: "auth",
    });
  } else if (hasNoData) {
    modules.push({
      id: M.EMPTY_STATE_GUIDANCE,
      type: "EMPTY_STATE_GUIDANCE",
      reason: "No data yet — show onboarding guidance",
    });
  } else if (priorityPillar) {
    modules.push({
      id: M.PRIORITY_ACTION,
      type: MODULE_TYPES.PRIORITY_ACTION,
      pillar: priorityPillar,
    });
  } else {
    modules.push({
      id: M.PRIORITY_ACTION,
      type: MODULE_TYPES.PRIORITY_ACTION,
      reason: "Single highest-impact action for today",
    });
  }

  // 2. Narrative Insight (only if user has data)
  if (!unauthenticated && !hasNoData && user.hasAnyData && !hasCompletedToday) {
    modules.push({
      id: M.NARRATIVE_INSIGHT,
      type: MODULE_TYPES.NARRATIVE_INSIGHT,
      reason: "Contextual insight to reduce cognitive load",
    });
  }

  // 3. Overall Score (supporting, never dominant)
  modules.push({
    id: M.OVERALL_SCORE,
    type: MODULE_TYPES.OVERALL_SCORE,
    emphasis: "secondary",
  });

  // 4. Pillar Overview (collapsed)
  modules.push({
    id: M.PILLAR_OVERVIEW,
    type: MODULE_TYPES.PILLAR_OVERVIEW,
    userConfigurable: true,
    collapsed: true,
  });

  // 5. Conditional Momentum
  if (user.momentum.checkIns > 0) {
    modules.push({
      id: M.MOMENTUM,
      type: MODULE_TYPES.MOMENTUM,
    });
  }

  // 6. Support (only if signals detected)
  if (user.distressSignals) {
    modules.push({
      id: M.SUPPORT,
      type: MODULE_TYPES.SUPPORT,
    });
  }

  // 7. AI Entry (always last)
  modules.push({
    id: M.AI_ENTRY,
    type: MODULE_TYPES.AI_ENTRY,
  });

  return modules;
}
