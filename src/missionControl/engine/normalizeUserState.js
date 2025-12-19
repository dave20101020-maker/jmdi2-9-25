/**
 * Normalises raw user data into a shape
 * that Mission Control logic can safely reason about.
 *
 * This protects the engine from backend instability.
 */

export function normalizeUserState(raw = {}) {
  return {
    hasAnyData: Boolean(raw?.hasAnyData),

    pillars: raw?.pillars ?? {},

    momentum: {
      checkIns: raw?.momentum?.checkIns ?? 0,
      streaks: raw?.momentum?.streaks ?? 0,
    },

    distressSignals: Boolean(raw?.distressSignals),

    lastActionAt: raw?.lastActionAt ?? null,

    todayCompleted: Boolean(raw?.todayCompleted),
  };
}
