import Friend from "../models/Friend.js";
import User from "../models/User.js";
import PillarScore from "../models/PillarScore.js";
import Challenge from "../models/Challenge.js";
import MiniChallenge from "../models/MiniChallenge.js";

const ALL_PILLARS = [
  "sleep",
  "diet",
  "exercise",
  "physical_health",
  "mental_health",
  "finances",
  "social",
  "spirituality",
];

const resolveUserIdentifier = async (identifier) => {
  if (!identifier) return null;
  if (/^[a-f\d]{24}$/i.test(identifier)) {
    const byId = await User.findById(identifier);
    if (byId) return byId;
  }
  return User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });
};

// Send a friend request (current user -> friendId)
export const sendFriendRequest = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { friendId, note } = req.body || {};
    if (!friendId)
      return res
        .status(400)
        .json({ success: false, error: "friendId required" });

    const target = await resolveUserIdentifier(friendId);
    if (!target)
      return res
        .status(404)
        .json({ success: false, error: "Target user not found" });

    if (String(target._id) === String(user._id))
      return res
        .status(400)
        .json({ success: false, error: "Cannot add yourself" });

    try {
      const f = new Friend({
        userId: user._id,
        friendId: target._id,
        status: "pending",
        inviteNote: note,
      });
      await f.save();
      return res.json({ success: true, request: f });
    } catch (e) {
      const existing = await Friend.findOne({
        userId: user._id,
        friendId: target._id,
      });
      if (existing)
        return res
          .status(409)
          .json({ success: false, error: "Request already exists", existing });
      throw e;
    }
  } catch (err) {
    console.error("sendFriendRequest error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Respond to a friend request: accept/decline
export const respondFriendRequest = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { requestId, requesterId, action } = req.body || {};
    let request = null;
    if (requestId) request = await Friend.findById(requestId);
    else if (requesterId)
      request = await Friend.findOne({
        userId: requesterId,
        friendId: user._id,
      });

    if (!request)
      return res
        .status(404)
        .json({ success: false, error: "Friend request not found" });

    if (String(request.friendId) !== String(user._id))
      return res.status(403).json({
        success: false,
        error: "Not authorised to respond to this request",
      });

    if (action === "decline") {
      await Friend.deleteOne({ _id: request._id });
      return res.json({ success: true, removed: true });
    }

    request.status = "accepted";
    await request.save();

    const reciprocal = await Friend.findOne({
      userId: user._id,
      friendId: request.userId,
    });
    if (!reciprocal) {
      const r = new Friend({
        userId: user._id,
        friendId: request.userId,
        status: "accepted",
      });
      await r.save().catch(() => {});
    } else if (reciprocal.status !== "accepted") {
      reciprocal.status = "accepted";
      await reciprocal.save().catch(() => {});
    }

    try {
      const Notification = (await import("../models/Notification.js")).default;
      await Notification.create({
        userId: request.userId,
        type: "friend",
        title: "Friend request accepted",
        message: `${
          user.full_name || user.username
        } accepted your friend request.`,
      });
    } catch (e) {
      console.debug("notif failed", e);
    }

    return res.json({ success: true, request });
  } catch (err) {
    console.error("respondFriendRequest error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// List accepted friends for current user
export const listFriends = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const friends = await Friend.find({ userId: user._id, status: "accepted" })
      .populate("friendId", "username email full_name")
      .lean();
    return res.json({ success: true, count: friends.length, data: friends });
  } catch (err) {
    console.error("listFriends error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// List pending incoming requests for current user
export const listPendingRequests = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const pending = await Friend.find({ friendId: user._id, status: "pending" })
      .populate("userId", "username email full_name")
      .lean();
    return res.json({ success: true, count: pending.length, data: pending });
  } catch (err) {
    console.error("listPendingRequests error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update per-friend privacy toggle
export const updatePrivacy = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { id } = req.params;
    const { shareInsights } = req.body || {};

    const connection = await Friend.findOne({ _id: id, userId: user._id });
    if (!connection)
      return res
        .status(404)
        .json({ success: false, error: "Connection not found" });

    connection.shareInsights = !!shareInsights;
    await connection.save();
    return res.json({ success: true, data: connection });
  } catch (err) {
    console.error("updatePrivacy error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Create a mini-challenge between friends
export const createMiniChallenge = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { target, templateId, title, description, reward, note } =
      req.body || {};
    const targetUser = await resolveUserIdentifier(target);
    if (!targetUser)
      return res
        .status(404)
        .json({ success: false, error: "Target user not found" });

    const isFriend = await Friend.findOne({
      userId: user._id,
      friendId: targetUser._id,
      status: "accepted",
    });
    if (!isFriend)
      return res.status(403).json({
        success: false,
        error: "Mini-challenges require an accepted friendship",
      });

    const doc = await MiniChallenge.create({
      creatorId: user._id,
      targetId: targetUser._id,
      templateId,
      title,
      description,
      reward,
      note,
    });

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("createMiniChallenge error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// List mini-challenges for the current user
export const listMiniChallenges = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const challenges = await MiniChallenge.find({
      $or: [{ creatorId: user._id }, { targetId: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("creatorId", "email username full_name")
      .populate("targetId", "email username full_name")
      .lean();

    return res.json({
      success: true,
      count: challenges.length,
      data: challenges,
    });
  } catch (err) {
    console.error("listMiniChallenges error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update mini-challenge status
export const updateMiniChallenge = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { id } = req.params;
    const { status } = req.body || {};

    const challenge = await MiniChallenge.findById(id);
    if (!challenge)
      return res
        .status(404)
        .json({ success: false, error: "Challenge not found" });

    if (
      ![String(challenge.creatorId), String(challenge.targetId)].includes(
        String(user._id)
      )
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorised to update this challenge",
      });
    }

    challenge.status = status;
    await challenge.save();
    return res.json({ success: true, data: challenge });
  } catch (err) {
    console.error("updateMiniChallenge error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
import { prisma } from "../src/db/prismaClient.js";
import { pgFirstRead } from "../src/utils/readSwitch.js";

// Leaderboard: per pillar for user's friends
export const getLeaderboardForPillar = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const { pillarId } = req.params;
    if (!pillarId)
      return res
        .status(400)
        .json({ success: false, error: "pillarId required" });

    // fetch accepted friends
    const friends = await Friend.find({
      userId: user._id,
      status: "accepted",
    }).lean();
    const friendIds = friends.map((f) => f.friendId);

    // also include the current user in leaderboard
    friendIds.push(String(user._id));

    const entries = [];
    for (const fid of friendIds) {
      const scoreDoc = await pgFirstRead({
        label: "friends:getLeaderboardForPillar",
        meta: { userId: String(fid), pillarIdentifier: pillarId },
        pgRead: async () =>
          prisma.pillarScore
            .findUnique({
              where: {
                userId_pillarIdentifier: {
                  userId: String(fid),
                  pillarIdentifier: pillarId,
                },
              },
              select: { score: true },
            })
            .then((r) => (r ? { score: r.score } : null)),
        mongoRead: async () =>
          PillarScore.findOne({ userId: fid, pillar: pillarId }).lean(),
      });
      const u = await User.findById(fid)
        .select("username email full_name")
        .lean();
      // include active challenges involving this user for this pillar
      const now = new Date();
      const challenges = await Challenge.find({
        participants: fid,
        pillarId,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).lean();
      entries.push({
        user: u || { _id: fid },
        score: scoreDoc ? scoreDoc.score : 0,
        challenges: challenges.map((c) => ({
          id: c._id,
          goalType: c.goalType,
        })),
      });
    }

    entries.sort((a, b) => b.score - a.score);
    return res.json({
      success: true,
      pillarId,
      count: entries.length,
      data: entries,
    });
  } catch (err) {
    console.error("getLeaderboardForPillar error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Overall leaderboard: average of 8 pillars per friend
export const getOverallLeaderboard = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const friends = await Friend.find({
      userId: user._id,
      status: "accepted",
    }).lean();
    const friendIds = friends.map((f) => f.friendId);
    friendIds.push(String(user._id));

    const results = [];
    for (const fid of friendIds) {
      const scores = await pgFirstRead({
        label: "friends:getOverallLeaderboard",
        meta: { userId: String(fid) },
        pgRead: async () => {
          const rows = await prisma.pillarScore.findMany({
            where: { userId: String(fid) },
            select: { pillarIdentifier: true, score: true },
          });
          return rows.map((r) => ({
            pillar: r.pillarIdentifier,
            score: r.score,
          }));
        },
        mongoRead: async () => PillarScore.find({ userId: fid }).lean(),
      });
      const map = {};
      scores.forEach((s) => {
        map[s.pillar] = s.score;
      });
      const vals = ALL_PILLARS.map((p) => (map[p] !== undefined ? map[p] : 0));
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const u = await User.findById(fid)
        .select("username email full_name")
        .lean();
      // include active challenge count for user
      const now = new Date();
      const challenges = await Challenge.find({
        participants: fid,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).lean();
      results.push({
        user: u || { _id: fid },
        average: Math.round(avg),
        activeChallenges: challenges.length,
      });
    }

    results.sort((a, b) => b.average - a.average);
    return res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error("getOverallLeaderboard error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export default {
  sendFriendRequest,
  respondFriendRequest,
  listFriends,
  listPendingRequests,
  getLeaderboardForPillar,
  getOverallLeaderboard,
  updatePrivacy,
  createMiniChallenge,
  listMiniChallenges,
  updateMiniChallenge,
};
