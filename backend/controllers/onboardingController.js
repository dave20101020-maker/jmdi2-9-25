import OnboardingProfile from "../models/OnboardingProfile.js";
import UserConsent from "../models/UserConsent.js";
import { VALID_PILLARS, normalizePillarId } from "../utils/pillars.js";
import { recordEvent } from "../utils/eventLogger.js";

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

    const profile = await OnboardingProfile.findOneAndUpdate(
      { userId: String(userId) },
      payload,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

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
        profile,
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
  const profile = await OnboardingProfile.findOne({ userId: String(userId) });
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
