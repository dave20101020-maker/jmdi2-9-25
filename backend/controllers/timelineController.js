import PillarCheckIn from "../models/PillarCheckIn.js";
import PillarScore from "../models/PillarScore.js";
import ActionPlan from "../models/ActionPlan.js";
import Challenge from "../models/Challenge.js";
import Notification from "../models/Notification.js";
import { prisma } from "../src/db/prismaClient.js";
import { pgFirstRead } from "../src/utils/readSwitch.js";

// GET /api/timeline
export const getTimeline = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    // Pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - 30);

    // To support pagination without pulling every record, fetch up to page*limit from each source,
    // then merge/sort and slice for the requested page.
    const fetchLimit = page * limit;

    // Check-ins (recent first)
    const checkins = await pgFirstRead({
      label: "timeline:checkins",
      meta: { userId: String(user._id) },
      pgRead: async () => {
        const rows = await prisma.pillarCheckIn.findMany({
          where: {
            userId: String(user._id),
            createdAt: { gte: since },
          },
          orderBy: { createdAt: "desc" },
          take: fetchLimit,
        });
        return rows.map((r) => ({
          _id: r.id,
          userId: r.userId,
          pillarId: r.pillarIdentifier,
          value: r.value,
          note: r.note || "",
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      },
      mongoRead: async () =>
        PillarCheckIn.find({ userId: user._id, createdAt: { $gte: since } })
          .sort({ createdAt: -1 })
          .limit(fetchLimit)
          .lean(),
    });

    // PillarScore snapshots (updated in last 30 days)
    const scores = await pgFirstRead({
      label: "timeline:pillarScores",
      meta: { userId: String(user._id) },
      pgRead: async () => {
        const rows = await prisma.pillarScore.findMany({
          where: {
            userId: String(user._id),
            updatedAt: { gte: since },
          },
          orderBy: { updatedAt: "desc" },
          take: fetchLimit,
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
      mongoRead: async () =>
        PillarScore.find({ userId: user._id, updatedAt: { $gte: since } })
          .sort({ updatedAt: -1 })
          .limit(fetchLimit)
          .lean(),
    });

    // Action plans
    const plans = await ActionPlan.find({
      userId: user._id,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .lean();

    // Challenges where user is participant and start/end within window
    const challenges = await Challenge.find({
      participants: user._id,
      $or: [{ startDate: { $gte: since } }, { endDate: { $gte: since } }],
    })
      .sort({ startDate: -1, endDate: -1 })
      .limit(fetchLimit)
      .lean();

    // AI recommendations (notifications tagged)
    const aiNotes = await Notification.find({
      userId: user._id,
      type: "ai-recommendation",
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .lean();

    const events = [];

    checkins.forEach((c) => {
      events.push({
        type: "check-in",
        date: c.createdAt,
        pillarId: c.pillarId,
        value: typeof c.value === "number" ? c.value : null,
        note: c.note || "",
      });
    });

    scores.forEach((s) => {
      events.push({
        type: "pillar-score",
        date: s.updatedAt || s.createdAt,
        pillarId: s.pillar,
        value: s.score,
        note: "",
      });
    });

    plans.forEach((p) => {
      events.push({
        type: "action-plan",
        date: p.createdAt,
        pillarId: p.pillarId,
        value: null,
        note: `Actions: ${Array.isArray(p.actions) ? p.actions.length : 0}`,
      });
    });

    challenges.forEach((ch) => {
      if (ch.startDate)
        events.push({
          type: "challenge-start",
          date: ch.startDate,
          pillarId: ch.pillarId,
          value: ch.targetValue,
          note: `Challenge ${ch._id}`,
        });
      if (ch.endDate)
        events.push({
          type: "challenge-end",
          date: ch.endDate,
          pillarId: ch.pillarId,
          value: ch.targetValue,
          note: `Challenge ${ch._id}`,
        });
    });

    aiNotes.forEach((n) => {
      events.push({
        type: "ai-recommendation",
        date: n.createdAt,
        pillarId: null,
        value: null,
        note: n.message || n.title,
      });
    });

    // Sort descending by date
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination slice
    const total = events.length;
    const paged = events.slice(skip, skip + limit);

    return res.json({
      success: true,
      total,
      page,
      limit,
      count: paged.length,
      data: paged,
    });
  } catch (err) {
    console.error("getTimeline error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export default { getTimeline };
