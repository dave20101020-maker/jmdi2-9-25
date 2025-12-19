import { MODULE_TYPES } from "./moduleTypes";
import { normalizeUserState } from "./normalizeUserState";

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

  // 1. Priority Action (always first)
  modules.push({
    type: MODULE_TYPES.PRIORITY_ACTION,
    reason: "Single highest-impact action for today",
  });

  // 2. Narrative Insight (only if user has data)
  if (user.hasAnyData) {
    modules.push({
      type: MODULE_TYPES.NARRATIVE_INSIGHT,
      reason: "Contextual insight to reduce cognitive load",
    });
  }

  // 3. Overall Score (supporting, never dominant)
  modules.push({
    type: MODULE_TYPES.OVERALL_SCORE,
  });

  // 4. Pillar Overview (collapsed)
  modules.push({
    type: MODULE_TYPES.PILLAR_OVERVIEW,
  });

  // 5. Conditional Momentum
  if (user.momentum.checkIns > 0) {
    modules.push({
      type: MODULE_TYPES.MOMENTUM,
    });
  }

  // 6. Support (only if signals detected)
  if (user.distressSignals) {
    modules.push({
      type: MODULE_TYPES.SUPPORT,
    });
  }

  // 7. AI Entry (always last)
  modules.push({
    type: MODULE_TYPES.AI_ENTRY,
  });

  return modules;
}
