import Pillar from "../models/Pillar.js";
import PillarScore from "../models/PillarScore.js";
import { VALID_PILLARS, normalizePillarId } from "../utils/pillars.js";
import { prisma } from "../src/db/prismaClient.js";
import { pgFirstRead } from "../src/utils/readSwitch.js";

const ensureEightPillars = (pillars) =>
  pillars.filter((p) => VALID_PILLARS.includes(p.identifier)).slice(0, 8);

export const listPillarsWithScores = async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res.status(401).json({ success: false, error: "Auth required" });

  const pillars = ensureEightPillars(
    await Pillar.find({ isActive: true }).sort({ order: 1 })
  );
  const scores = await pgFirstRead({
    label: "pillarExperience:listPillarsWithScores",
    meta: { userId: String(userId) },
    pgRead: async () => {
      const rows = await prisma.pillarScore.findMany({
        where: { userId: String(userId) },
      });
      return rows.map((r) => ({
        _id: r.id,
        userId: r.userId,
        pillar: r.pillarIdentifier,
        score: r.score,
        trend: r.trend,
        weeklyScores: r.weeklyScores || [],
        monthlyScores: r.monthlyScores || [],
        quickWins: r.quickWins || [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    },
    mongoRead: async () => PillarScore.find({ userId: String(userId) }).lean(),
  });
  const scoreMap = new Map(scores.map((entry) => [entry.pillar, entry]));

  const data = pillars.map((pillar) => {
    const scoreDoc = scoreMap.get(pillar.identifier) || {};
    return {
      id: pillar._id,
      identifier: pillar.identifier,
      name: pillar.name,
      description: pillar.description,
      quickWins: pillar.quickWins || [],
      trendSummary: pillar.trendSummary,
      score: scoreDoc.score || 0,
      trend: scoreDoc.trend || "stable",
      updatedAt: scoreDoc.updatedAt || pillar.updatedAt,
    };
  });

  return res.json({ success: true, data });
};

export const pillarDetail = async (req, res) => {
  const pillarId = normalizePillarId(req.params.id);
  const pillar = await Pillar.findOne({
    $or: [{ identifier: pillarId }, { _id: pillarId }],
  });
  if (!pillar || !VALID_PILLARS.includes(pillar.identifier)) {
    return res.status(404).json({ success: false, error: "Pillar not found" });
  }
  return res.json({ success: true, data: pillar });
};

export const pillarTrends = async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res.status(401).json({ success: false, error: "Auth required" });
  const pillarId = normalizePillarId(req.params.id);
  if (!pillarId)
    return res.status(400).json({ success: false, error: "Invalid pillar" });

  const score = await pgFirstRead({
    label: "pillarExperience:pillarTrends",
    meta: { userId: String(userId), pillarIdentifier: pillarId },
    pgRead: async () =>
      prisma.pillarScore
        .findUnique({
          where: {
            userId_pillarIdentifier: {
              userId: String(userId),
              pillarIdentifier: pillarId,
            },
          },
        })
        .then((r) =>
          r
            ? {
                _id: r.id,
                userId: r.userId,
                pillar: r.pillarIdentifier,
                score: r.score,
                trend: r.trend,
                weeklyScores: r.weeklyScores || [],
                monthlyScores: r.monthlyScores || [],
                quickWins: r.quickWins || [],
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
              }
            : null
        ),
    mongoRead: async () =>
      PillarScore.findOne({ userId: String(userId), pillar: pillarId }).lean(),
  });
  if (!score)
    return res.status(404).json({ success: false, error: "No score history" });
  return res.json({
    success: true,
    data: {
      weekly: score.weeklyScores || [],
      monthly: score.monthlyScores || [],
      trend: score.trend,
    },
  });
};

export const pillarRecommendations = async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res.status(401).json({ success: false, error: "Auth required" });
  const pillarId = normalizePillarId(req.params.id);
  if (!pillarId)
    return res.status(400).json({ success: false, error: "Invalid pillar" });

  const pillar = await Pillar.findOne({ identifier: pillarId });
  if (!pillar)
    return res.status(404).json({ success: false, error: "Pillar not found" });
  const score = await pgFirstRead({
    label: "pillarExperience:pillarRecommendations",
    meta: { userId: String(userId), pillarIdentifier: pillarId },
    pgRead: async () =>
      prisma.pillarScore
        .findUnique({
          where: {
            userId_pillarIdentifier: {
              userId: String(userId),
              pillarIdentifier: pillarId,
            },
          },
        })
        .then((r) =>
          r
            ? {
                _id: r.id,
                userId: r.userId,
                pillar: r.pillarIdentifier,
                score: r.score,
                trend: r.trend,
                weeklyScores: r.weeklyScores || [],
                monthlyScores: r.monthlyScores || [],
                quickWins: r.quickWins || [],
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
              }
            : null
        ),
    mongoRead: async () =>
      PillarScore.findOne({ userId: String(userId), pillar: pillarId }).lean(),
  });
  const quickWins = [
    ...(pillar.quickWins || []),
    ...(score?.quickWins || []),
  ].slice(0, 5);
  return res.json({
    success: true,
    data: { quickWins, trend: score?.trend || "stable" },
  });
};
