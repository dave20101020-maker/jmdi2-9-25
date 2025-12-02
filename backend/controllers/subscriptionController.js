import User from '../models/User.js';

// Simple mapping of tiers to allowed pillars. This is authoritative for now and
// will be kept small until Stripe integration is added.
const TIER_MAP = {
  free: ['sleep', 'mental_health'],
  basic: ['sleep', 'mental_health', 'exercise', 'diet'],
  premium: ['sleep', 'mental_health', 'exercise', 'diet', 'physical_health', 'finances', 'social', 'spirituality'],
  nhs_referred: ['sleep', 'mental_health', 'exercise']
};

export const getMySubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    return res.json({
      success: true,
      subscription: {
        tier: user.subscriptionTier || 'free',
        allowedPillars: user.allowedPillars || TIER_MAP[user.subscriptionTier] || TIER_MAP.free,
      }
    });
  } catch (err) {
    console.error('getMySubscription error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const upgradeSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { tier } = req.body || {};
    if (!tier || !Object.keys(TIER_MAP).includes(tier)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing tier' });
    }

    // Simulate payment / Stripe flow here. For now we accept the request and update user.
    user.subscriptionTier = tier;
    user.allowedPillars = TIER_MAP[tier];
    await user.save();

    return res.json({
      success: true,
      subscription: {
        tier: user.subscriptionTier,
        allowedPillars: user.allowedPillars,
      }
    });
  } catch (err) {
    console.error('upgradeSubscription error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default { getMySubscription, upgradeSubscription };
