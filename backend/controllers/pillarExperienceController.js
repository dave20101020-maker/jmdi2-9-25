import Pillar from "../models/Pillar.js";
import PillarScore from "../models/PillarScore.js";
import { VALID_PILLARS, normalizePillarId } from "../utils/pillars.js";

const ensureEightPillars = (pillars) =>
  pillars.filter((p) => VALID_PILLARS.includes(p.identifier)).slice(0, 8);

export const listPillarsWithScores = async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res.status(401).json({ success: false, error: "Auth required" });

  const pillars = ensureEightPillars(
    await Pillar.find({ isActive: true }).sort({ order: 1 })
  );
  const scores = await PillarScore.find({ userId: String(userId) });
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

  const score = await PillarScore.findOne({
    userId: String(userId),
    pillar: pillarId,
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
  const score = await PillarScore.findOne({
    userId: String(userId),
    pillar: pillarId,
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
