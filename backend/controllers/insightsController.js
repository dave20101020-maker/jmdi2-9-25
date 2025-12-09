import Insight from "../models/Insight.js";
import { normalizePillarId } from "../utils/pillars.js";

const resolveUserId = (req) =>
  req.user?._id?.toString() || req.body.userId || req.query.userId;

export const createInsight = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { title, content, pillar, habitId, tags, source, metadata } =
      req.body || {};

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    if (!content) {
      return res
        .status(400)
        .json({ success: false, error: "content is required" });
    }

    const normalizedPillar = normalizePillarId(pillar);

    if (pillar && !normalizedPillar) {
      return res.status(400).json({ success: false, error: "Invalid pillar" });
    }

    const insight = await Insight.create({
      userId,
      title: title?.trim() || undefined,
      content,
      pillar: normalizedPillar || undefined,
      habitId,
      tags: Array.isArray(tags) ? tags : [],
      source: source || "manual",
      metadata: metadata || {},
    });

    return res.status(201).json({ success: true, data: insight });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const listInsights = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    const { pillar, habitId, limit = 20 } = req.query;
    const query = { userId };
    const normalizedPillar = normalizePillarId(pillar);
    if (pillar && !normalizedPillar) {
      return res.status(400).json({ success: false, error: "Invalid pillar" });
    }
    if (normalizedPillar) query.pillar = normalizedPillar;
    if (habitId) query.habitId = habitId;

    const insights = await Insight.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 20, 100));

    return res.json({ success: true, count: insights.length, data: insights });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getInsight = async (req, res) => {
  try {
    const insight = await Insight.findById(req.params.id);
    if (!insight) {
      return res
        .status(404)
        .json({ success: false, error: "Insight not found" });
    }

    const userId = resolveUserId(req);
    if (userId && insight.userId !== String(userId)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    return res.json({ success: true, data: insight });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteInsight = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const insight = await Insight.findById(req.params.id);

    if (!insight) {
      return res
        .status(404)
        .json({ success: false, error: "Insight not found" });
    }

    if (userId && insight.userId !== String(userId)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await insight.deleteOne();
    return res.json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
