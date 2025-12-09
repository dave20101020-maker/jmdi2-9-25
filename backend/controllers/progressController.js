import UserProgress from "../models/UserProgress.js";
import { VALID_PILLARS } from "../models/Insight.js";

const resolveUserId = (req) =>
  req.user?._id?.toString() || req.body.userId || req.query.userId;

export const saveUserProgress = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    const {
      pillars = [],
      habits = [],
      insightIds = [],
      lastSyncedAt,
    } = req.body || {};

    const sanitizedPillars = Array.isArray(pillars)
      ? pillars
          .filter((p) => p?.pillar && VALID_PILLARS.includes(p.pillar))
          .map((p) => ({
            pillar: p.pillar,
            score: Math.min(Math.max(Number(p.score) || 0, 0), 100),
            trend: ["up", "down", "stable"].includes(p.trend)
              ? p.trend
              : "stable",
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          }))
      : [];

    const sanitizedHabits = Array.isArray(habits)
      ? habits
          .filter((h) => h?.habitId && h?.name)
          .map((h) => ({
            habitId: h.habitId,
            name: h.name,
            status: ["active", "paused", "completed"].includes(h.status)
              ? h.status
              : "active",
            streak: Math.max(Number(h.streak) || 0, 0),
            completions: Math.max(Number(h.completions) || 0, 0),
            lastCompletedAt: h.lastCompletedAt
              ? new Date(h.lastCompletedAt)
              : undefined,
          }))
      : [];

    const payload = {
      pillars: sanitizedPillars,
      habits: sanitizedHabits,
      insightIds: Array.isArray(insightIds) ? insightIds.map(String) : [],
      lastSyncedAt: lastSyncedAt ? new Date(lastSyncedAt) : new Date(),
    };

    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      { $set: payload },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserProgress = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.json({
        success: true,
        data: {
          userId,
          pillars: [],
          habits: [],
          insightIds: [],
          lastSyncedAt: null,
        },
      });
    }

    return res.json({ success: true, data: progress });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
