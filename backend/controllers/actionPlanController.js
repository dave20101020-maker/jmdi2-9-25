import ActionPlan from '../models/ActionPlan.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const createActionPlan = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { pillarId, actions } = req.body || {};
    if (!pillarId || !Array.isArray(actions)) {
      return res.status(400).json({ success: false, error: 'pillarId and actions array are required' });
    }

    const plan = new ActionPlan({ userId: user._id, pillarId, actions });
    await plan.save();

    // create notification for user about saved plan
    try {
      await Notification.create({ userId: user._id, type: 'plan', title: 'New action plan saved', message: `Saved ${actions.length} action(s) for ${pillarId}` });
    } catch (e) {
      console.debug('failed to create plan notification', e);
    }

    return res.json({ success: true, plan });
  } catch (err) {
    console.error('createActionPlan error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getLatestPlanForPillar = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const pillarId = req.params.pillarId;
    if (!pillarId) return res.status(400).json({ success: false, error: 'pillarId required' });

    const plan = await ActionPlan.findOne({ userId: user._id, pillarId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, plan });
  } catch (err) {
    console.error('getLatestPlanForPillar error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default { createActionPlan, getLatestPlanForPillar };
