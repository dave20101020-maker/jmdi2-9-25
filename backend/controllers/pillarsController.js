import PillarScore from '../models/PillarScore.js';

// @desc    Create or update pillar score
// @route   POST /api/pillars
// @access  Private
export const upsertPillarScore = async (req, res, next) => {
  try {
    const { userId, pillar, score } = req.body;

    if (!userId || !pillar || score === undefined) {
      return res.status(400).json({ success: false, error: 'userId, pillar and score are required' });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ success: false, error: 'Score must be between 0 and 100' });
    }

    const validPillars = ['sleep', 'diet', 'exercise', 'physical_health', 'mental_health', 'finances', 'social', 'spirituality'];
    if (!validPillars.includes(pillar)) {
      return res.status(400).json({ success: false, error: 'Invalid pillar' });
    }

    const existing = await PillarScore.findOne({ userId, pillar });
    if (existing) {
      existing.score = score;
      existing.updatedAt = new Date();
      existing.weeklyScores = [...(existing.weeklyScores || []), score].slice(-12);
      existing.calculateTrend();
      await existing.save();

      return res.status(200).json({ success: true, data: existing });
    }

    const created = new PillarScore({ userId, pillar, score, weeklyScores: [score] });
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
    const { userId, pillar } = req.query;

    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const filter = { userId };
    if (pillar) filter.pillar = pillar;

    const scores = await PillarScore.find(filter).sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, count: scores.length, data: scores });
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
    if (!deleted) return res.status(404).json({ success: false, error: 'PillarScore not found' });
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
