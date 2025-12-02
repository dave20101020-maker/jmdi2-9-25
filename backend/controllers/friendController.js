import Friend from '../models/Friend.js';
import User from '../models/User.js';
import PillarScore from '../models/PillarScore.js';
import Challenge from '../models/Challenge.js';

const ALL_PILLARS = ['sleep','diet','exercise','physical_health','mental_health','finances','social','spirituality'];

// Send a friend request (current user -> friendId)
export const sendFriendRequest = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { friendId } = req.body || {};
    if (!friendId) return res.status(400).json({ success: false, error: 'friendId required' });

    // ensure target exists
    const target = await User.findOne({ $or: [{ _id: friendId }, { email: friendId }, { username: friendId }] });
    if (!target) return res.status(404).json({ success: false, error: 'Target user not found' });

    // prevent sending to self
    if (String(target._id) === String(user._id)) return res.status(400).json({ success: false, error: 'Cannot add yourself' });

    // create request (user -> target)
    try {
      const f = new Friend({ userId: user._id, friendId: target._id, status: 'pending' });
      await f.save();
      return res.json({ success: true, request: f });
    } catch (e) {
      // if already exists, return existing
      const existing = await Friend.findOne({ userId: user._id, friendId: target._id });
      if (existing) return res.status(409).json({ success: false, error: 'Request already exists', existing });
      throw e;
    }
  } catch (err) {
    console.error('sendFriendRequest error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Accept a friend request: otherUserId -> current user
export const acceptFriendRequest = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { requestId, requesterId } = req.body || {};
    let request = null;
    if (requestId) request = await Friend.findById(requestId);
    else if (requesterId) request = await Friend.findOne({ userId: requesterId, friendId: user._id });

    if (!request) return res.status(404).json({ success: false, error: 'Friend request not found' });

    // Only the target can accept
    if (String(request.friendId) !== String(user._id)) return res.status(403).json({ success: false, error: 'Not authorised to accept this request' });

    request.status = 'accepted';
    await request.save();

    // create reciprocal accepted record if not exists
    const reciprocal = await Friend.findOne({ userId: user._id, friendId: request.userId });
    if (!reciprocal) {
      const r = new Friend({ userId: user._id, friendId: request.userId, status: 'accepted' });
      await r.save().catch(() => {});
    } else if (reciprocal.status !== 'accepted') {
      reciprocal.status = 'accepted';
      await reciprocal.save().catch(() => {});
    }

    // notify the original requester that their request was accepted
    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({ userId: request.userId, type: 'friend', title: 'Friend request accepted', message: `${user.full_name || user.username} accepted your friend request.` });
    } catch (e) { console.debug('notif failed', e); }

    return res.json({ success: true, request });
  } catch (err) {
    console.error('acceptFriendRequest error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// List accepted friends for current user
export const listFriends = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const friends = await Friend.find({ userId: user._id, status: 'accepted' }).populate('friendId', 'username email full_name').lean();
    return res.json({ success: true, count: friends.length, data: friends });
  } catch (err) {
    console.error('listFriends error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// List pending incoming requests for current user
export const listPendingRequests = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const pending = await Friend.find({ friendId: user._id, status: 'pending' }).populate('userId', 'username email full_name').lean();
    return res.json({ success: true, count: pending.length, data: pending });
  } catch (err) {
    console.error('listPendingRequests error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Leaderboard: per pillar for user's friends
export const getLeaderboardForPillar = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { pillarId } = req.params;
    if (!pillarId) return res.status(400).json({ success: false, error: 'pillarId required' });

    // fetch accepted friends
    const friends = await Friend.find({ userId: user._id, status: 'accepted' }).lean();
    const friendIds = friends.map(f => f.friendId);

    // also include the current user in leaderboard
    friendIds.push(String(user._id));

    const entries = [];
    for (const fid of friendIds) {
      const scoreDoc = await PillarScore.findOne({ userId: fid, pillar: pillarId }).lean();
      const u = await User.findById(fid).select('username email full_name').lean();
      // include active challenges involving this user for this pillar
      const now = new Date();
      const challenges = await Challenge.find({ participants: fid, pillarId, status: 'active', startDate: { $lte: now }, endDate: { $gte: now } }).lean();
      entries.push({ user: u || { _id: fid }, score: scoreDoc ? scoreDoc.score : 0, challenges: challenges.map(c => ({ id: c._id, goalType: c.goalType })) });
    }

    entries.sort((a,b) => b.score - a.score);
    return res.json({ success: true, pillarId, count: entries.length, data: entries });
  } catch (err) {
    console.error('getLeaderboardForPillar error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Overall leaderboard: average of 8 pillars per friend
export const getOverallLeaderboard = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const friends = await Friend.find({ userId: user._id, status: 'accepted' }).lean();
    const friendIds = friends.map(f => f.friendId);
    friendIds.push(String(user._id));

    const results = [];
    for (const fid of friendIds) {
      const scores = await PillarScore.find({ userId: fid }).lean();
      const map = {};
      scores.forEach(s => { map[s.pillar] = s.score; });
      const vals = ALL_PILLARS.map(p => map[p] !== undefined ? map[p] : 0);
      const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
      const u = await User.findById(fid).select('username email full_name').lean();
      // include active challenge count for user
      const now = new Date();
      const challenges = await Challenge.find({ participants: fid, status: 'active', startDate: { $lte: now }, endDate: { $gte: now } }).lean();
      results.push({ user: u || { _id: fid }, average: Math.round(avg), activeChallenges: challenges.length });
    }

    results.sort((a,b) => b.average - a.average);
    return res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error('getOverallLeaderboard error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default { sendFriendRequest, acceptFriendRequest, listFriends, listPendingRequests };
