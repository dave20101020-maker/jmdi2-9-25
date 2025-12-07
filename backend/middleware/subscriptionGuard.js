import User from "../models/User.js";
import {
  getAllowedPillarsForTier,
  normalizeTier,
  mapTierToLegacy,
  TRIAL_DURATION_DAYS,
} from "../utils/subscriptionAccess.js";

const VALID_STATUSES = new Set(["active", "trial", "expired", "canceled"]);
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const ensureDate = (value, fallback = null) => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const addDays = (date, days) => {
  const base = date instanceof Date ? date : new Date(date);
  return new Date(base.getTime() + days * MS_PER_DAY);
};

const toPlain = (value) =>
  value && typeof value.toObject === "function" ? value.toObject() : value;

const arraysEqual = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false;
  }
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const normalizeStatus = (candidate, tier) => {
  if (candidate && VALID_STATUSES.has(candidate)) {
    return candidate;
  }
  return tier === "free" ? "active" : "trial";
};

const calculateDaysRemaining = (target, now = new Date()) => {
  if (!target) return null;
  const millis = target.getTime() - now.getTime();
  if (millis <= 0) return 0;
  return Math.ceil(millis / MS_PER_DAY);
};

export async function checkSubscription(userOrId, { persist = true } = {}) {
  const user =
    typeof userOrId === "string" ? await User.findById(userOrId) : userOrId;
  if (!user) return null;

  const now = new Date();
  const raw = toPlain(user.subscription) || {};
  let tier = normalizeTier(raw.tier || user.subscriptionTier || "free");
  let status = normalizeStatus(raw.status, tier);
  const startedAt = ensureDate(raw.startedAt, user.createdAt || now) || now;
  let trialEndsAt = ensureDate(raw.trialEndsAt, null);
  let expiresAt = ensureDate(raw.expiresAt, null);
  let referralExpiresAt = ensureDate(raw.referralExpiresAt, null);
  let trialUsed = Boolean(raw.trialUsed);
  const referralCode = raw.referralCode || null;
  const source = raw.source || "self";

  if (status === "trial" && !trialEndsAt) {
    trialEndsAt = addDays(startedAt, TRIAL_DURATION_DAYS);
  }

  const nowTime = now.getTime();
  if (status === "trial" && trialEndsAt && nowTime >= trialEndsAt.getTime()) {
    status = "expired";
    tier = "free";
    trialUsed = true;
  }

  const relevantExpiry =
    tier === "referral" && status === "active"
      ? referralExpiresAt || expiresAt
      : expiresAt;

  if (
    status === "active" &&
    tier !== "free" &&
    relevantExpiry &&
    nowTime >= relevantExpiry.getTime()
  ) {
    status = "expired";
    tier = "free";
  }

  if (tier !== "referral") {
    referralExpiresAt = null;
  } else if (!referralExpiresAt && relevantExpiry) {
    referralExpiresAt = relevantExpiry;
  }

  const allowedPillars = getAllowedPillarsForTier(
    status === "trial" ? "premium" : tier
  );

  const nextSubscription = {
    tier,
    status,
    startedAt,
    trialEndsAt,
    trialUsed,
    expiresAt: tier === "referral" ? null : relevantExpiry,
    referralCode,
    referralExpiresAt: tier === "referral" ? referralExpiresAt : null,
    source,
  };

  const previousSubscription = toPlain(user.subscription) || {};
  const legacyTier = mapTierToLegacy(tier);
  const shouldPersist =
    persist &&
    (JSON.stringify(previousSubscription) !==
      JSON.stringify(nextSubscription) ||
      legacyTier !== user.subscriptionTier ||
      !arraysEqual(user.allowedPillars || [], allowedPillars));

  user.subscription = nextSubscription;
  user.subscriptionTier = legacyTier;
  user.allowedPillars = allowedPillars;

  if (shouldPersist) {
    await user.save();
  }

  const isTrial = status === "trial";
  const isReferral = tier === "referral" && status === "active";
  const accessExpiry = isTrial
    ? trialEndsAt
    : isReferral
    ? referralExpiresAt
    : nextSubscription.expiresAt;

  return {
    ...nextSubscription,
    allowedPillars,
    daysRemaining: calculateDaysRemaining(accessExpiry, now),
    hasPremiumAccess:
      isTrial || (status === "active" && tier !== "free") || isReferral,
    isTrial,
    isReferral,
  };
}

export const requirePremiumAccess = () => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const subscription =
      req.subscription || (await checkSubscription(req.user));
    if (!subscription?.hasPremiumAccess) {
      return res.status(403).json({
        success: false,
        error: "Premium or referral access required",
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("requirePremiumAccess error", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export default { checkSubscription, requirePremiumAccess };
