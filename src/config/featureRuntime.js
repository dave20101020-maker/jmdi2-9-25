import * as FLAGS from "./features";

// Runtime flag resolution.
// Allows env overrides like VITE_FEATURE_MISSION_CONTROL_V2=1 in dev.
// Frontend-only by design.

function envBool(key, fallback) {
  const raw = import.meta?.env?.[key];
  if (raw === undefined) return fallback;
  return raw === true || raw === "true" || raw === "1" || raw === 1;
}

export const featureFlags = Object.freeze({
  AI_PING_ENABLED: envBool("VITE_AI_PING_ENABLED", FLAGS.AI_PING_ENABLED),
  FEATURE_MISSION_CONTROL_V2: envBool(
    "VITE_FEATURE_MISSION_CONTROL_V2",
    FLAGS.FEATURE_MISSION_CONTROL_V2
  ),
  FEATURE_AI_INVOCATION: envBool(
    "VITE_FEATURE_AI_INVOCATION",
    FLAGS.FEATURE_AI_INVOCATION
  ),
  FEATURE_PROGRESSIVE_SURFACING: envBool(
    "VITE_FEATURE_PROGRESSIVE_SURFACING",
    FLAGS.FEATURE_PROGRESSIVE_SURFACING
  ),
  FEATURE_GAMIFICATION_B2B: envBool(
    "VITE_FEATURE_GAMIFICATION_B2B",
    FLAGS.FEATURE_GAMIFICATION_B2B
  ),
  FEATURE_STRICT_TONE_RULES: envBool(
    "VITE_FEATURE_STRICT_TONE_RULES",
    FLAGS.FEATURE_STRICT_TONE_RULES
  ),
  FEATURE_STRICT_MOTION_RULES: envBool(
    "VITE_FEATURE_STRICT_MOTION_RULES",
    FLAGS.FEATURE_STRICT_MOTION_RULES
  ),
});
