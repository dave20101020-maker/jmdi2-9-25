import User from '../models/User.js';
import OnboardingProfile from '../models/OnboardingProfile.js';
import PillarScore from '../models/PillarScore.js';
import ActionPlan from '../models/ActionPlan.js';
import Message from '../models/Message.js';
import Challenge from '../models/Challenge.js';
import Friend from '../models/Friend.js';
import PillarCheckIn from '../models/PillarCheckIn.js';
import Notification from '../models/Notification.js';

// GET /api/user/export
export const exportUserData = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const uid = String(user._1d || user._id);

    const profile = await User.findById(uid).lean();
    const onboarding = await OnboardingProfile.findOne({ userId: uid }).lean();
    const pillarScores = await PillarScore.find({ userId: uid }).lean();
    const actionPlans = await ActionPlan.find({ userId: uid }).lean();
    const messages = await Message.find({ $or: [{ senderId: uid }, { receiverId: uid }] }).lean();
    const challenges = await Challenge.find({ $or: [{ creatorId: uid }, { participants: uid }] }).lean();
    const friends = await Friend.find({ $or: [{ userId: uid }, { friendId: uid }] }).lean();
    const checkins = await PillarCheckIn.find({ userId: uid }).lean();
    const notifications = await Notification.find({ userId: uid }).lean();

    const bundle = {
      exportedAt: new Date().toISOString(),
      profile,
      onboarding,
      pillarScores,
      actionPlans,
      messages,
      challenges,
      friends,
      checkins,
      notifications
    };

    const filename = `northstar_export_${uid}_${new Date().toISOString().slice(0,10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(bundle, null, 2));
  } catch (err) {
    console.error('exportUserData error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /api/user/delete-account
export const deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const uid = String(user._id);

    // Remove user-owned documents
    await OnboardingProfile.deleteMany({ userId: uid });
    await PillarScore.deleteMany({ userId: uid });
    await ActionPlan.deleteMany({ userId: uid });
    await Message.deleteMany({ $or: [{ senderId: uid }, { receiverId: uid }] });
    // For challenges: remove user from participants; delete challenges they created
    await Challenge.updateMany({ participants: uid }, { $pull: { participants: uid } });
    await Challenge.deleteMany({ creatorId: uid });
    // Remove friend records involving user
    await Friend.deleteMany({ $or: [{ userId: uid }, { friendId: uid }] });
    // Remove checkins and notifications
    await PillarCheckIn.deleteMany({ userId: uid });
    await Notification.deleteMany({ userId: uid });

    // Finally remove user account
    await User.findByIdAndDelete(uid);

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteAccount error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default { exportUserData, deleteAccount };
