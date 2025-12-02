import Notification from '../models/Notification.js';

// GET /api/notifications
export const listNotifications = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    const unread = notifications.filter(n => !n.read);
    const read = notifications.filter(n => n.read);
    return res.json({ success: true, count: notifications.length, data: { unread, read } });
  } catch (err) {
    console.error('listNotifications error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /api/notifications/mark-read
// body: { ids: [id,...] } or { all: true }
export const markRead = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { ids, all } = req.body || {};
    if (all) {
      await Notification.updateMany({ userId: user._id, read: false }, { $set: { read: true } });
      return res.json({ success: true });
    }
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: 'ids required' });
    await Notification.updateMany({ userId: user._id, _id: { $in: ids } }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    console.error('markRead error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /api/notifications/create (internal use)
export const createNotification = async (req, res) => {
  try {
    const { userId, type = 'system', title, message } = req.body || {};
    if (!userId || !title || !message) return res.status(400).json({ success: false, error: 'userId, title and message required' });
    const n = new Notification({ userId, type, title, message });
    await n.save();
    return res.status(201).json({ success: true, data: n });
  } catch (err) {
    console.error('createNotification error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default { listNotifications, markRead, createNotification };
