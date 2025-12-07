const FEATURE_KEYS = {
  CORE_APP: "core.app",
  AI_CHAT: "ai.chat",
  ADVANCED_DASHBOARD: "advanced.dashboard",
  WEEKLY_REVIEW: "advanced.weekly-review",
  MICRO_ACTIONS: "advanced.micro-actions",
  SUGGESTIONS: "advanced.suggestions",
  ESCALATIONS: "advanced.escalations",
  RESPONSE_TRACKING: "advanced.response-tracking",
  QUALITY_REPORTS: "advanced.quality-reports",
  WELLNESS_SNAPSHOT: "advanced.wellness-snapshot",
  NHS_CARE_TEAM: "nhs.care-team",
  FOUNDER_BETA: "founder.beta-access",
};

const ENTITLEMENT_PLANS = ["free", "premium", "founder", "nhs"];

const FREE_FEATURES = [FEATURE_KEYS.CORE_APP, FEATURE_KEYS.AI_CHAT];

const PREMIUM_FEATURES = [
  ...FREE_FEATURES,
  FEATURE_KEYS.ADVANCED_DASHBOARD,
  FEATURE_KEYS.WEEKLY_REVIEW,
  FEATURE_KEYS.MICRO_ACTIONS,
  FEATURE_KEYS.SUGGESTIONS,
  FEATURE_KEYS.ESCALATIONS,
  FEATURE_KEYS.RESPONSE_TRACKING,
  FEATURE_KEYS.QUALITY_REPORTS,
  FEATURE_KEYS.WELLNESS_SNAPSHOT,
];

const FOUNDER_FEATURES = [...PREMIUM_FEATURES, FEATURE_KEYS.FOUNDER_BETA];

const NHS_FEATURES = [...PREMIUM_FEATURES, FEATURE_KEYS.NHS_CARE_TEAM];

const PLAN_FEATURES = {
  free: FREE_FEATURES,
  premium: PREMIUM_FEATURES,
  founder: FOUNDER_FEATURES,
  nhs: NHS_FEATURES,
};

const tierToPlanMap = {
  free: "free",
  basic: "free",
  premium: "premium",
  nhs_referred: "nhs",
  referral: "nhs",
};

const normalizePlan = (candidate) => {
  if (!candidate || typeof candidate !== "string") return null;
  const normalized = candidate.toLowerCase();
  return ENTITLEMENT_PLANS.includes(normalized) ? normalized : null;
};

export const mapTierToPlan = (tier = "free") => {
  if (!tier || typeof tier !== "string") {
    return "free";
  }
  const normalizedTier = tier.toLowerCase();
  return tierToPlanMap[normalizedTier] || "free";
};

export const getFeaturesForPlan = (plan = "free") => {
  const normalized = normalizePlan(plan) || "free";
  const features = PLAN_FEATURES[normalized] || PLAN_FEATURES.free;
  return [...features];
};

export const resolveEntitlements = (user = {}) => {
  const preSelectedPlan = normalizePlan(user?.entitlements?.plan);
  const tierDerivedPlan = mapTierToPlan(user?.subscriptionTier);
  const plan = preSelectedPlan || tierDerivedPlan || "free";

  const baseFeatures = getFeaturesForPlan(plan);
  const userFeatures = Array.isArray(user?.entitlements?.features)
    ? user.entitlements.features.filter(Boolean)
    : [];

  const features = Array.from(
    new Set([...baseFeatures, ...userFeatures])
  ).sort();
  return { plan, features };
};

export { FEATURE_KEYS, ENTITLEMENT_PLANS, PLAN_FEATURES };

export default {
  FEATURE_KEYS,
  ENTITLEMENT_PLANS,
  PLAN_FEATURES,
  resolveEntitlements,
  getFeaturesForPlan,
  mapTierToPlan,
};
