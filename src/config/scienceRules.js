// NorthStar science-backed UI guardrails.
// These are not "style preferences"; they exist to preserve trust,
// reduce cognitive load, and protect user agency.

// Copy rules (enforced via review + targeted helper checks in UI surfaces)
export const TONE_RULES = Object.freeze({
  // Prefer tentative, trust-preserving language.
  preferredHedges: ["tends to", "often", "can help", "may", "in many cases"],

  // Avoid urgency/shame/compulsion framing.
  bannedPhrases: [
    "don't break",
    "you must",
    "no excuses",
    "failure",
    "last chance",
    "act now",
    "urgent",
    "you're behind",
  ],

  // Avoid absolute claims.
  discouragedAbsolutes: ["always", "never", "guaranteed"],
});

// Motion rules (to preserve calm and prevent fatigue)
export const MOTION_RULES = Object.freeze({
  // Only allow GPU-friendly properties for routine UI transitions.
  allowedProperties: ["opacity", "transform"],
  // Guardrail durations (ms)
  minDurationMs: 120,
  maxDurationMs: 260,
});

// Lightweight helper: use in critical surfaces (Mission Control, paywall, challenges)
export function violatesToneRules(text = "") {
  const lower = String(text).toLowerCase();
  if (!lower.trim()) return false;

  const hasBanned = TONE_RULES.bannedPhrases.some((p) => lower.includes(p));
  if (hasBanned) return true;

  const hasDiscouragedAbsolute = TONE_RULES.discouragedAbsolutes.some((w) =>
    lower.includes(` ${w} `)
  );

  return hasDiscouragedAbsolute;
}
