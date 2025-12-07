import { checkSubscription } from "../middleware/subscriptionGuard.js";
import {
  getAllowedPillarsForTier,
  mapTierToLegacy,
  normalizeTier,
  TRIAL_DURATION_DAYS,
} from "../utils/subscriptionAccess.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);
const toPlain = (value) =>
  value && typeof value.toObject === "function" ? value.toObject() : value;

export const getMySubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const subscription = req.subscription || (await checkSubscription(user));
    return res.json({ success: true, subscription });
  } catch (err) {
    console.error("getMySubscription error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const upgradeSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { tier, referralCode = null, durationDays = 30 } = req.body || {};
    if (!tier) {
      return res
        .status(400)
        .json({ success: false, error: "Tier is required" });
    }

    const normalizedTier = normalizeTier(tier);
    if (!["free", "premium", "referral"].includes(normalizedTier)) {
      return res
        .status(400)
        .json({ success: false, error: "Unsupported tier" });
    }

    const payload = toPlain(user.subscription) || {};
    const now = new Date();
    const effectiveDuration = Math.max(
      normalizedTier === "referral" ? 14 : 30,
      Number(durationDays) || 30
    );
    const expiryDate = addDays(now, effectiveDuration);

    if (normalizedTier === "free") {
      user.subscription = {
        ...payload,
        tier: "free",
        status: "active",
        startedAt: now,
        trialEndsAt: null,
        expiresAt: null,
        referralCode: null,
        referralExpiresAt: null,
        source: "downgrade",
      };
      user.allowedPillars = getAllowedPillarsForTier("free");
      user.subscriptionTier = "free";
    } else {
      user.subscription = {
        ...payload,
        tier: normalizedTier,
        status: "active",
        startedAt: now,
        trialEndsAt: null,
        expiresAt: normalizedTier === "referral" ? null : expiryDate,
        referralCode: normalizedTier === "referral" ? referralCode : null,
        referralExpiresAt: normalizedTier === "referral" ? expiryDate : null,
        trialUsed: payload.trialUsed ?? false,
        source: normalizedTier === "referral" ? "referral" : "upgrade",
      };
      user.allowedPillars = getAllowedPillarsForTier(normalizedTier);
      user.subscriptionTier = mapTierToLegacy(normalizedTier);
    }

    await user.save();
    const subscription = await checkSubscription(user);

    return res.json({ success: true, subscription });
  } catch (err) {
    console.error("upgradeSubscription error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const startTrial = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const current = req.subscription || (await checkSubscription(user));
    if (current?.isTrial) {
      return res.json({ success: true, subscription: current });
    }

    if (current?.trialUsed) {
      return res
        .status(400)
        .json({ success: false, error: "Trial already consumed" });
    }

    const now = new Date();
    const trialEndsAt = addDays(now, TRIAL_DURATION_DAYS);
    const payload = toPlain(user.subscription) || {};

    user.subscription = {
      ...payload,
      tier: "premium",
      status: "trial",
      startedAt: now,
      trialEndsAt,
      trialUsed: true,
      expiresAt: null,
      referralCode: null,
      referralExpiresAt: null,
      source: "trial",
    };
    user.allowedPillars = getAllowedPillarsForTier("premium");
    user.subscriptionTier = mapTierToLegacy("premium");

    await user.save();
    const subscription = await checkSubscription(user);

    return res.json({ success: true, subscription });
  } catch (err) {
    console.error("startTrial error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export default { getMySubscription, upgradeSubscription, startTrial };
