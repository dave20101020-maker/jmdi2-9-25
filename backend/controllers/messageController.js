import Message from '../models/Message.js';
import Friend from '../models/Friend.js';
import User from '../models/User.js';

// POST /api/messages/send
export const sendMessage = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { receiverId, text } = req.body || {};
    if (!receiverId || !text) return res.status(400).json({ success: false, error: 'receiverId and text required' });

    // verify friend relationship (accepted) in either direction
    const isFriend = await Friend.findOne({
      $or: [
        { userId: user._id, friendId: receiverId, status: 'accepted' },
        { userId: receiverId, friendId: user._id, status: 'accepted' }
      ]
    }).lean();
    if (!isFriend) return res.status(403).json({ success: false, error: 'Not friends with this user' });

    const msg = new Message({ senderId: user._id, receiverId, text });
    await msg.save();

    // return saved message populated sender/receiver basic info
    const populated = await Message.findById(msg._id)
      .populate('senderId', 'username full_name')
      .populate('receiverId', 'username full_name')
      .lean();
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('sendMessage error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/messages/:friendId
export const getConversation = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { friendId } = req.params;
    if (!friendId) return res.status(400).json({ success: false, error: 'friendId required' });

    // verify accepted friendship exists (either direction)
    const isFriend = await Friend.findOne({
      $or: [
        { userId: user._id, friendId, status: 'accepted' },
        { userId: friendId, friendId: user._id, status: 'accepted' }
      ]
    }).lean();
    if (!isFriend) return res.status(403).json({ success: false, error: 'Not friends with this user' });

    // Pagination: ?page=1&limit=50
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // efficient query: get most recent messages first, then reverse to chronological order for client
    const baseQuery = { $or: [ { senderId: user._id, receiverId: friendId }, { senderId: friendId, receiverId: user._id } ] };
    const total = await Message.countDocuments(baseQuery);

    const msgs = await Message.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username full_name')
      .populate('receiverId', 'username full_name')
      .lean();

    // return ascending order for ease of rendering
    msgs.reverse();

    return res.json({ success: true, total, page, limit, count: msgs.length, data: msgs });
  } catch (err) {
    console.error('getConversation error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default { sendMessage, getConversation };
