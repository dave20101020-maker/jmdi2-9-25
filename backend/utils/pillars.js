export const VALID_PILLARS = [
  "sleep",
  "diet",
  "exercise",
  "physical_health",
  "mental_health",
  "finances",
  "social",
  "spirituality",
];

const PILLAR_ALIASES = {
  "physical-health": "physical_health",
  "physical health": "physical_health",
  "mental-health": "mental_health",
  "mental health": "mental_health",
  productivity: "exercise",
  wellbeing: "mental_health",
};

export const normalizePillarId = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (VALID_PILLARS.includes(normalized)) return normalized;
  if (PILLAR_ALIASES[normalized]) return PILLAR_ALIASES[normalized];
  const underscored = normalized.replace(/[-\s]/g, "_");
  return VALID_PILLARS.includes(underscored) ? underscored : null;
};
