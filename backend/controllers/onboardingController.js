// ============================================================
// PHASE 6.5 LOCKED
// OnboardingProfile:
// - MongoDB: fallback only
// - Postgres: primary read/write store
// - API behavior frozen
// ============================================================

import OnboardingProfile from "../models/OnboardingProfile.js";
import UserConsent from "../models/UserConsent.js";
import { VALID_PILLARS, normalizePillarId } from "../utils/pillars.js";
import { recordEvent } from "../utils/eventLogger.js";
import { prisma } from "../src/db/prismaClient.js";
import {
  isMongoFallbackEnabled,
  pgFirstRead,
} from "../src/utils/readSwitch.js";

// ============================================================
// PHASE 7.4 — Onboarding Profile Writes (PG authoritative)
// ============================================================

const clampScore = (value) => Math.max(0, Math.min(10, Number(value) || 0));

const computeBaselineScore = (comB = {}) => {
  const entries = Object.values(comB).map((group) => {
    if (!group) return 0;
    const capability = clampScore(group.capability);
    const opportunity = clampScore(group.opportunity);
    const motivation = clampScore(group.motivation);
    return (capability + opportunity + motivation) / 3;
  });
  if (!entries.length) return 0;
  const avg = entries.reduce((a, b) => a + b, 0) / entries.length;
  return Math.round(avg * 10);
};

const ensureGoalIntegrity = (goals = []) =>
  goals
    .map((goal) => ({
      pillar: normalizePillarId(goal?.pillar),
      goal: goal?.goal,
    }))
    .filter((entry) => entry.pillar && VALID_PILLARS.includes(entry.pillar));

export const submitOnboarding = async (req, res) => {
  try {
    const { com_b: comB = {}, demographics = {}, goals = [] } = req.body || {};
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, error: "Auth required" });

    const allowMongoShadow = isMongoFallbackEnabled();

    const normalizedGoals = ensureGoalIntegrity(goals);
    const baselineScore = computeBaselineScore(comB);
    const northStarScore = Math.round((baselineScore || 0) * 1.1);

    const payload = {
      userId: String(userId),
      demographics,
      com_b: comB,
      selectedGoals: normalizedGoals,
      assessments: {
        results: new Map([
          ["baseline", { score: baselineScore, totalPossible: 100 }],
        ]),
      },
      psychologyProfile: { northStarScore },
      completedAt: new Date(),
    };

    // Primary write: Postgres (authoritative)
    let pgRow;
    try {
      pgRow = await prisma.onboardingProfile.upsert({
        where: { userId: String(userId) },
        create: {
          userId: String(userId),
          doc: payload,
        },
        update: {
          doc: payload,
        },
      });
    } catch (err) {
      console.error("[PHASE 7.4][WRITE] onboarding_profile postgres_failed", {
        userId: String(userId),
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
      return res
        .status(500)
        .json({ success: false, error: "Failed to save onboarding profile" });
    }

    // Optional shadow write: Mongo (best-effort)
    if (allowMongoShadow) {
      try {
        await OnboardingProfile.findOneAndUpdate(
          { userId: String(userId) },
          payload,
          {
            new: false,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );
      } catch (err) {
        console.warn(
          "[PHASE 7.4][WRITE] onboarding_profile mongo_shadow_failed",
          {
            userId: String(userId),
            name: err?.name,
            code: err?.code,
            message: err?.message || String(err),
          }
        );
      }
    }

    await recordEvent("onboarding_completed", {
      userId,
      source: "api/onboarding",
      ip: req.ip,
      payload: {
        baselineScore,
        northStarScore,
        goalsSelected: normalizedGoals.length,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        baselineScore,
        northStarScore,
        profile: pgRow?.doc ?? payload,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const getOnboarding = async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res.status(401).json({ success: false, error: "Auth required" });
  const uid = String(userId);

  const profile = await pgFirstRead({
    label: "onboarding:getOnboarding",
    meta: { userId: uid },
    pgRead: async () => {
      const row = await prisma.onboardingProfile.findUnique({
        where: { userId: uid },
        select: { doc: true },
      });
      return row?.doc || null;
    },
    mongoRead: async () => OnboardingProfile.findOne({ userId: uid }),
  });
  if (!profile)
    return res
      .status(404)
      .json({ success: false, error: "No onboarding profile" });
  return res.json({ success: true, data: profile });
};

export const saveConsent = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, error: "Auth required" });
    const { gdprAccepted, llmAccepted } = req.body || {};
    const update = {
      gdpr: {
        accepted: !!gdprAccepted,
        timestamp: new Date(),
      },
      llm: {
        accepted: !!llmAccepted,
        timestamp: new Date(),
      },
    };
    const consent = await UserConsent.findOneAndUpdate(
      { userId: String(userId) },
      update,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
    await recordEvent("consent_recorded", {
      userId,
      source: req.body?.source || "api/consent",
      ip: req.ip,
      payload: {
        gdprAccepted: !!gdprAccepted,
        llmAccepted: !!llmAccepted,
        recordedAt: new Date().toISOString(),
      },
    });

    return res.status(200).json({ success: true, data: consent });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
