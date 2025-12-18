import PillarScore from "../models/PillarScore.js";
import PillarCheckIn from "../models/PillarCheckIn.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { normalizePillarId, VALID_PILLARS } from "../utils/pillars.js";
import crypto from "crypto";
import { prisma } from "../src/db/prismaClient.js";
import { pgFirstRead } from "../src/utils/readSwitch.js";

const DUAL_WRITE_LOG_PREFIX = "[PHASE 6.4][DUAL WRITE]";

const isDev = () => process.env.NODE_ENV === "development";

const stableUuidFromString = (input) => {
  const hash = crypto.createHash("sha256").update(String(input)).digest();
  // 16 bytes => UUID. Force v5-like + RFC4122 variant for validity.
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const PILLAR_DEFINITIONS = [
  {
    id: "sleep",
    title: "Sleep",
    summary: "Optimize recovery, circadian rhythm, and sleep hygiene.",
    path: "/sleep",
    focusAreas: ["consistency", "environment", "wind-down", "recovery"],
  },
  {
    id: "diet",
    title: "Diet",
    summary: "Balance macros, hydration, and mindful nutrition habits.",
    path: "/diet",
    focusAreas: ["fueling", "hydration", "meal timing", "hunger cues"],
  },
  {
    id: "exercise",
    title: "Exercise",
    summary: "Build strength, mobility, and energy with adaptive training.",
    path: "/exercise",
    focusAreas: ["strength", "cardio", "mobility", "recovery"],
  },
  {
    id: "physical-health",
    title: "Physical Health",
    summary: "Track vitals, recovery signals, and preventative care routines.",
    path: "/physical-health",
    focusAreas: ["vitals", "preventative", "pain", "energy"],
  },
  {
    id: "mental-health",
    title: "Mental Health",
    summary: "Strengthen resilience through mood, stress, and focus practices.",
    path: "/mental-health",
    focusAreas: ["stress", "focus", "mood", "resilience"],
  },
  {
    id: "finances",
    title: "Finances",
    summary: "Plan cashflow, savings, and goal-based financial habits.",
    path: "/finances",
    focusAreas: ["budget", "savings", "debt", "investing"],
  },
  {
    id: "social",
    title: "Social",
    summary: "Nurture relationships, community engagement, and support.",
    path: "/social",
    focusAreas: ["connections", "support", "communication", "community"],
  },
  {
    id: "spirituality",
    title: "Spirituality",
    summary: "Cultivate mindfulness, purpose, and reflective practices.",
    path: "/spirituality",
    focusAreas: ["mindfulness", "values", "rituals", "gratitude"],
  },
];

// @desc    Get pillar metadata definitions
// @route   GET /api/pillars/definitions
// @access  Public
export const getPillarDefinitions = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: PILLAR_DEFINITIONS.length,
    data: PILLAR_DEFINITIONS,
  });
};

// @desc    Create or update pillar score
// @route   POST /api/pillars
// @access  Private
export const upsertPillarScore = async (req, res, next) => {
  try {
    const { userId, pillar, score } = req.body;
    const normalizedPillar = normalizePillarId(pillar);

    if (!userId || !pillar || score === undefined) {
      return res.status(400).json({
        success: false,
        error: "userId, pillar and score are required",
      });
    }

    if (score < 0 || score > 100) {
      return res
        .status(400)
        .json({ success: false, error: "Score must be between 0 and 100" });
    }

    if (!normalizedPillar || !VALID_PILLARS.includes(normalizedPillar)) {
      return res.status(400).json({ success: false, error: "Invalid pillar" });
    }

    const existing = await PillarScore.findOne({
      userId,
      pillar: normalizedPillar,
    });
    if (existing) {
      existing.score = score;
      existing.updatedAt = new Date();
      existing.weeklyScores = [...(existing.weeklyScores || []), score].slice(
        -12
      );
      existing.calculateTrend();
      await existing.save();

      return res.status(200).json({ success: true, data: existing });
    }

    const created = new PillarScore({
      userId,
      pillar: normalizedPillar,
      score,
      weeklyScores: [score],
    });
    created.calculateTrend();
    await created.save();

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get pillar score for user
// @route   GET /api/pillars?userId=xxx&pillar=xxx
// @access  Private
export const getPillarScores = async (req, res, next) => {
  try {
    // Prefer authenticated user if available
    const authUser = req.user;

    // If not authenticated, allow query.userId (legacy), else require auth
    let userId = authUser ? String(authUser._id) : req.query.userId;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });

    // Determine allowed pillars from authenticated user when possible
    let allowed = [];
    if (authUser && Array.isArray(authUser.allowedPillars)) {
      allowed = authUser.allowedPillars
        .map(normalizePillarId)
        .filter((pillarId) => pillarId && VALID_PILLARS.includes(pillarId));
    } else if (req.query.pillar) {
      const normalizedQuery = normalizePillarId(req.query.pillar);
      if (!normalizedQuery || !VALID_PILLARS.includes(normalizedQuery)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid pillar" });
      }
      allowed = [normalizedQuery];
    }

    const scores = await pgFirstRead({
      label: "pillars:getPillarScores",
      meta: { userId, allowedCount: allowed.length },
      pgRead: async () => {
        const where = { userId };
        if (allowed.length > 0) {
          where.pillarIdentifier = { in: allowed };
        }
        const rows = await prisma.pillarScore.findMany({
          where,
          orderBy: { updatedAt: "desc" },
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
      mongoRead: async () => {
        const filter = { userId };
        if (allowed.length > 0) filter.pillar = { $in: allowed };
        return PillarScore.find(filter).sort({ updatedAt: -1 }).lean();
      },
    });

    // Build response covering all allowed pillars
    if (authUser && allowed.length > 0) {
      const map = {};
      scores.forEach((s) => {
        map[s.pillar] = s;
      });
      const result = allowed.map((pillarId) => {
        const doc = map[pillarId];
        if (doc) {
          return {
            pillar: doc.pillar,
            score: doc.score,
            trend: doc.trend,
            updatedAt: doc.updatedAt,
          };
        }
        return { pillar: pillarId, score: 0, trend: "stable", updatedAt: null };
      });
      return res
        .status(200)
        .json({ success: true, count: result.length, data: result });
    }

    // If no auth/allowed info, return whatever we found
    return res
      .status(200)
      .json({ success: true, count: scores.length, data: scores });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete pillar score
// @route   DELETE /api/pillars/:id
// @access  Private
export const deletePillarScore = async (req, res, next) => {
  try {
    const deleted = await PillarScore.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, error: "PillarScore not found" });
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    POST /api/pillars/check-in
// @route   Private
export const postPillarCheckIn = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { pillarId, value, note } = req.body || {};
    const normalizedPillar = normalizePillarId(pillarId);
    if (!pillarId || value === undefined)
      return res
        .status(400)
        .json({ success: false, error: "pillarId and value required" });
    if (!normalizedPillar)
      return res.status(400).json({ success: false, error: "Invalid pillar" });
    if (value < 0 || value > 10)
      return res
        .status(400)
        .json({ success: false, error: "value must be between 0 and 10" });

    // Save check-in record
    const checkin = new PillarCheckIn({
      userId: user._id,
      pillarId: normalizedPillar,
      value,
      note: note || "",
    });
    await checkin.save();

    // Update or create aggregate PillarScore (score is 0-100)
    const scoreValue = Math.round(value * 10);
    const existing = await PillarScore.findOne({
      userId: String(user._id),
      pillar: normalizedPillar,
    });

    let scoreDoc;
    if (existing) {
      existing.score = scoreValue;
      existing.weeklyScores = [
        ...(existing.weeklyScores || []),
        scoreValue,
      ].slice(-12);
      existing.updatedAt = new Date();
      existing.calculateTrend();
      scoreDoc = await existing.save();
    } else {
      const created = new PillarScore({
        userId: String(user._id),
        pillar: normalizedPillar,
        score: scoreValue,
        weeklyScores: [scoreValue],
      });
      created.calculateTrend();
      scoreDoc = await created.save();
    }

    // Phase 6.4.3: DUAL-WRITE (Mongo authoritative)
    // - MongoDB write MUST succeed or the request fails.
    // - PostgreSQL write is best-effort and MUST NOT affect the response.
    // Phase 6.4 Pillar Check-ins migration complete and locked.
    try {
      const pgUserId = String(user._id);
      const pgCheckinId = stableUuidFromString(
        `pillar_check_in:mongo:${String(checkin._id)}`
      );

      const checkinValue = Number.isFinite(Number(value))
        ? Math.round(Number(value))
        : 0;

      const pgCheckinWrite = prisma.pillarCheckIn.upsert({
        where: { id: pgCheckinId },
        create: {
          id: pgCheckinId,
          userId: pgUserId,
          pillarIdentifier: normalizedPillar,
          value: checkinValue,
          note: checkin.note || "",
          createdAt: checkin.createdAt,
          updatedAt: checkin.updatedAt,
        },
        update: {
          userId: pgUserId,
          pillarIdentifier: normalizedPillar,
          value: checkinValue,
          note: checkin.note || "",
          updatedAt: checkin.updatedAt,
        },
      });

      const trend =
        scoreDoc && typeof scoreDoc.trend === "string"
          ? scoreDoc.trend
          : "stable";
      const weeklyScores = Array.isArray(scoreDoc?.weeklyScores)
        ? scoreDoc.weeklyScores
        : [];
      const monthlyScores = Array.isArray(scoreDoc?.monthlyScores)
        ? scoreDoc.monthlyScores
        : [];
      const quickWins = Array.isArray(scoreDoc?.quickWins)
        ? scoreDoc.quickWins
        : [];

      const pgScoreWrite = prisma.pillarScore.upsert({
        where: {
          userId_pillarIdentifier: {
            userId: pgUserId,
            pillarIdentifier: normalizedPillar,
          },
        },
        create: {
          userId: pgUserId,
          pillarIdentifier: normalizedPillar,
          score: Number(scoreDoc?.score ?? scoreValue),
          trend,
          weeklyScores,
          monthlyScores,
          quickWins,
          createdAt: scoreDoc?.createdAt || new Date(),
          updatedAt: scoreDoc?.updatedAt || new Date(),
        },
        update: {
          score: Number(scoreDoc?.score ?? scoreValue),
          trend,
          weeklyScores,
          monthlyScores,
          quickWins,
          updatedAt: scoreDoc?.updatedAt || new Date(),
        },
      });

      const results = await Promise.allSettled([pgCheckinWrite, pgScoreWrite]);
      const failures = results
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => r.status === "rejected");

      if (failures.length > 0) {
        for (const f of failures) {
          const target = f.idx === 0 ? "pillar_check_in" : "pillar_score";
          // Prod-safe logging: no tokens, no request body, minimal identifiers.
          console.error(`${DUAL_WRITE_LOG_PREFIX} Postgres write failed`, {
            target,
            userId: pgUserId,
            pillarIdentifier: normalizedPillar,
            message: f.r.reason?.message || String(f.r.reason),
            name: f.r.reason?.name,
            code: f.r.reason?.code,
          });
        }
      } else if (isDev()) {
        console.info(`${DUAL_WRITE_LOG_PREFIX} Postgres writes ok`, {
          checkIn: 1,
          pillarScore: 1,
        });
      }
    } catch (e) {
      // Absolute safety net: dual-write must never affect the request.
      console.error(`${DUAL_WRITE_LOG_PREFIX} Postgres dual-write crashed`, {
        userId: String(user._id),
        pillarIdentifier: normalizedPillar,
        message: e?.message || String(e),
        name: e?.name,
        code: e?.code,
      });
    }

    // --- STREAK & BADGES LOGIC ---
    try {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      // Determine if user already had a check-in today (excluding the one we just saved)
      const alreadyToday = await PillarCheckIn.findOne({
        userId: user._id,
        _id: { $ne: checkin._id },
        createdAt: { $gte: startOfToday },
      });

      // Find the most recent previous checkin (before this one)
      const prev = await PillarCheckIn.findOne({
        userId: user._id,
        _id: { $ne: checkin._id },
      }).sort({ createdAt: -1 });

      let newStreak = 1;
      if (alreadyToday) {
        // If there was already a checkin today, do not change streak
        newStreak = user.current_streak || 1;
      } else if (
        prev &&
        prev.createdAt >= startOfYesterday &&
        prev.createdAt < startOfToday
      ) {
        // previous checkin was yesterday -> continue streak
        newStreak = (user.current_streak || 0) + 1;
      } else if (prev && prev.createdAt >= startOfToday) {
        // defensive: previous is today (should be caught by alreadyToday), keep streak
        newStreak = user.current_streak || 1;
        newStreak = user.current_streak || 1;
      } else {
        // no recent previous -> reset to 1
        newStreak = 1;
      }

      const updates = { current_streak: newStreak };
      // Update longest streak if needed
      const longest = user.longest_streak || 0;
      if (newStreak > longest) {
        updates.longest_streak = newStreak;
      }

      // Award badges for milestones
      const badgesToAward = [];
      const existingBadges = Array.isArray(user.badges) ? user.badges : [];
      const milestones = [3, 7, 14, 30];
      for (const m of milestones) {
        if (newStreak >= m) {
          const badgeKey = `${m}_day_streak`;
          if (!existingBadges.includes(badgeKey)) badgesToAward.push(badgeKey);
        }
      }
      if (badgesToAward.length > 0) {
        updates.badges = Array.from(
          new Set([...(existingBadges || []), ...badgesToAward])
        );
      }

      // Persist updates to user document
      const updatedUser = await User.findByIdAndUpdate(user._id, updates, {
        new: true,
      }).catch((e) => {
        console.debug("streak update failed", e);
        return null;
      });

      // Create notifications for streaks/badges
      try {
        if (badgesToAward.length > 0) {
          await Notification.create({
            userId: user._id,
            type: "streak",
            title: "You earned a badge!",
            message: `You've earned: ${badgesToAward.join(", ")}`,
          });
        }
        if (newStreak && newStreak > (user.current_streak || 0)) {
          await Notification.create({
            userId: user._id,
            type: "streak",
            title: "Streak updated",
            message: `Your current streak is now ${newStreak} day${
              newStreak !== 1 ? "s" : ""
            }`,
          });
        }
      } catch (e) {
        console.debug("notification create failed", e);
      }
    } catch (e) {
      console.debug("streak/badge logic failed", e);
    }

    return res.status(201).json({ success: true, checkin });
  } catch (err) {
    console.error("postPillarCheckIn error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc GET /api/pillars/:pillarId/history
// @route Private
export const getPillarHistory = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { pillarId } = req.params;
    const normalizedPillar = normalizePillarId(pillarId);
    if (!pillarId)
      return res
        .status(400)
        .json({ success: false, error: "pillarId required" });
    if (!normalizedPillar)
      return res.status(400).json({ success: false, error: "Invalid pillar" });

    const userId = String(user._id);
    const entries = await pgFirstRead({
      label: "pillars:getPillarHistory",
      meta: { userId, pillarIdentifier: normalizedPillar },
      pgRead: async () => {
        const rows = await prisma.pillarCheckIn.findMany({
          where: {
            userId,
            pillarIdentifier: normalizedPillar,
          },
          orderBy: { createdAt: "desc" },
          take: 14,
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
        PillarCheckIn.find({
          userId: user._id,
          pillarId: normalizedPillar,
        })
          .sort({ createdAt: -1 })
          .limit(14)
          .lean(),
    });
    return res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    console.error("getPillarHistory error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
