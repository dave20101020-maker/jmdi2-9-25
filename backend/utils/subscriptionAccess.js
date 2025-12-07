const ALL_PILLARS = [
  "sleep",
  "diet",
  "exercise",
  "physical_health",
  "mental_health",
  "finances",
  "social",
  "spirituality",
];

const ACCESS_MATRIX = {
  free: ["sleep", "mental_health"],
  premium: [...ALL_PILLARS],
  referral: [...ALL_PILLARS],
};

const TIER_NORMALIZATION_MAP = {
  free: "free",
  basic: "free",
  trial: "premium",
  premium: "premium",
  founder: "premium",
  nhs_referred: "referral",
  referral: "referral",
};

export const TRIAL_DURATION_DAYS = 7;

export const normalizeTier = (candidate = "free") => {
  if (!candidate || typeof candidate !== "string") {
    return "free";
  }
  const normalized = candidate.toLowerCase();
  return TIER_NORMALIZATION_MAP[normalized] || "free";
};

export const getAllowedPillarsForTier = (tier = "free") => {
  const normalized = normalizeTier(tier);
  const allowed = ACCESS_MATRIX[normalized] || ACCESS_MATRIX.free;
  return [...allowed];
};

export const mapTierToLegacy = (tier = "free") => {
  const normalized = normalizeTier(tier);
  if (normalized === "referral") return "nhs_referred";
  if (normalized === "premium") return "premium";
  return "free";
};

export const SubscriptionAccess = Object.freeze({
  ALL_PILLARS: [...ALL_PILLARS],
  ACCESS_MATRIX: {
    free: [...ACCESS_MATRIX.free],
    premium: [...ACCESS_MATRIX.premium],
    referral: [...ACCESS_MATRIX.referral],
  },
  normalizeTier,
  getAllowedPillarsForTier,
  mapTierToLegacy,
  TRIAL_DURATION_DAYS,
});

export default SubscriptionAccess;
