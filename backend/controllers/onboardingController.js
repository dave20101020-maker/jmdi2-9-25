import OnboardingProfile from '../models/OnboardingProfile.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const profile = await OnboardingProfile.findOne({ userId: String(userId) });
    return res.status(200).json({ success: true, data: profile || null });
  } catch (err) {
    console.error('getProfile error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const saveProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const payload = req.body || {};
    // ensure only expected fields are written
    const data = {
      userId: String(userId),
      age: payload.age,
      sex: payload.sex,
      heightCm: payload.heightCm,
      weightKg: payload.weightKg,
      shiftWork: payload.shiftWork || false,
      com_b: payload.com_b || {},
      extra: payload.extra || {},
    };

    const existing = await OnboardingProfile.findOne({ userId: String(userId) });
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      return res.status(200).json({ success: true, data: existing });
    }

    const created = new OnboardingProfile(data);
    await created.save();
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('saveProfile error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
