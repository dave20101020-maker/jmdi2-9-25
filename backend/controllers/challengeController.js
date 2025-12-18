import Challenge from "../models/Challenge.js";
import PillarCheckIn from "../models/PillarCheckIn.js";
import PillarScore from "../models/PillarScore.js";
import Notification from "../models/Notification.js";
import { prisma } from "../src/db/prismaClient.js";
import { pgFirstRead } from "../src/utils/readSwitch.js";

// POST /api/challenges
export const createChallenge = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const {
      pillarId,
      goalType,
      targetValue,
      startDate,
      endDate,
      participants = [],
    } = req.body;
    if (!pillarId || !goalType || !targetValue || !startDate || !endDate)
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });

    const challenge = new Challenge({
      creatorId: user._id,
      participants: Array.isArray(participants) ? participants : [],
      pillarId,
      goalType,
      targetValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    // ensure creator is participant
    if (!challenge.participants.map(String).includes(String(user._id)))
      challenge.participants.push(user._id);

    await challenge.save();
    return res.status(201).json({ success: true, data: challenge });
  } catch (err) {
    console.error("createChallenge error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// POST /api/challenges/join
export const joinChallenge = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { challengeId } = req.body;
    if (!challengeId)
      return res
        .status(400)
        .json({ success: false, error: "challengeId required" });

    const challenge = await Challenge.findById(challengeId);
    if (!challenge)
      return res
        .status(404)
        .json({ success: false, error: "Challenge not found" });
    if (challenge.participants.map(String).includes(String(user._id)))
      return res.status(200).json({ success: true, message: "Already joined" });

    challenge.participants.push(user._id);
    await challenge.save();
    // notify challenge creator that someone joined
    try {
      await Notification.create({
        userId: challenge.creatorId,
        type: "challenge",
        title: "Participant joined",
        message: `${user.full_name || user.username} joined your challenge.`,
      });
    } catch (e) {
      console.debug("notify join failed", e);
    }
    return res.status(200).json({ success: true, data: challenge });
  } catch (err) {
    console.error("joinChallenge error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// GET /api/challenges/my
export const myChallenges = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const now = new Date();
    const challenges = await Challenge.find({ participants: user._id })
      .sort({ startDate: -1 })
      .lean();

    // For each challenge, compute simple progress summary depending on goalType
    const enriched = await Promise.all(
      challenges.map(async (c) => {
        const summary = {
          id: c._id,
          pillarId: c.pillarId,
          goalType: c.goalType,
          targetValue: c.targetValue,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status,
        };
        // For score-based goal: compute average pillar score across participants for the challenge period
        if (c.goalType === "score") {
          const participantIds = Array.isArray(c.participants)
            ? c.participants.map(String)
            : [];

          const scores = await pgFirstRead({
            label: "challenges:scoreGoal:pillarScores",
            meta: { challengeId: String(c._id), pillarIdentifier: c.pillarId },
            pgRead: async () => {
              const rows = await prisma.pillarScore.findMany({
                where: {
                  pillarIdentifier: c.pillarId,
                  userId: { in: participantIds },
                  updatedAt: { gte: c.startDate, lte: c.endDate },
                },
                select: { userId: true, score: true, updatedAt: true },
              });
              // Match the fields consumed below.
              return rows.map((r) => ({
                userId: r.userId,
                score: r.score,
                updatedAt: r.updatedAt,
              }));
            },
            mongoRead: async () =>
              PillarScore.find({
                pillar: c.pillarId,
                userId: { $in: c.participants },
                updatedAt: { $gte: c.startDate, $lte: c.endDate },
              }).lean(),
          });
          const perUser = {};
          scores.forEach((s) => {
            perUser[String(s.userId)] = Math.max(
              perUser[String(s.userId)] || 0,
              s.score || 0
            );
          });
          summary.progress = Object.values(perUser).map(Number);
          summary.average = summary.progress.length
            ? Math.round(
                summary.progress.reduce((a, b) => a + b, 0) /
                  summary.progress.length
              )
            : 0;
        }
        // For consistency: compute number of checkins in period per participant
        if (c.goalType === "consistency") {
          const participantIds = Array.isArray(c.participants)
            ? c.participants.map(String)
            : [];

          const checkins = await pgFirstRead({
            label: "challenges:consistencyGoal:checkins",
            meta: { challengeId: String(c._id), pillarIdentifier: c.pillarId },
            pgRead: async () => {
              const grouped = await prisma.pillarCheckIn.groupBy({
                by: ["userId"],
                where: {
                  pillarIdentifier: c.pillarId,
                  userId: { in: participantIds },
                  createdAt: { gte: c.startDate, lte: c.endDate },
                },
                _count: { _all: true },
              });
              return grouped.map((g) => ({
                _id: g.userId,
                count: g._count._all,
              }));
            },
            mongoRead: async () =>
              PillarCheckIn.aggregate([
                {
                  $match: {
                    pillarId: c.pillarId,
                    userId: { $in: c.participants.map((id) => id) },
                    createdAt: { $gte: c.startDate, $lte: c.endDate },
                  },
                },
                { $group: { _id: "$userId", count: { $sum: 1 } } },
              ]),
          });
          summary.progress = checkins.map((ci) => ({
            userId: ci._id,
            count: ci.count,
          }));
        }
        // actions not implemented yet; return empty
        if (c.goalType === "actions") {
          summary.progress = [];
        }
        return summary;
      })
    );

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error("myChallenges error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export default {
  createChallenge,
  joinChallenge,
  myChallenges,
};
