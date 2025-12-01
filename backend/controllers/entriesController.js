import Entry from '../models/Entry.js';

// @desc    Create a new entry
// @route   POST /api/entries
// @access  Private
export const createEntry = async (req, res, next) => {
  try {
    const { userId, pillar, date, score, notes } = req.body;

    // Validation
    if (!userId || !pillar || !date || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'userId, pillar, date, and score are required',
      });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        error: 'Score must be between 0 and 100',
      });
    }

    if (!['sleep', 'diet', 'exercise', 'physical_health', 'mental_health', 'finances', 'social', 'spirituality'].includes(pillar)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pillar value',
      });
    }

    const entry = new Entry({
      userId,
      pillar,
      date: new Date(date),
      score,
      notes: notes || '',
    });

    await entry.save();

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get entries for a user
// @route   GET /api/entries?userId=xxx&pillar=xxx&startDate=xxx&endDate=xxx
// @access  Private
export const getEntries = async (req, res, next) => {
  try {
    const { userId, pillar, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const filter = { userId };
    if (pillar) filter.pillar = pillar;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await Entry.find(filter).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get a single entry
// @route   GET /api/entries/:id
// @access  Private
export const getEntry = async (req, res, next) => {
  try {
    const entry = await Entry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update an entry
// @route   PUT /api/entries/:id
// @access  Private
export const updateEntry = async (req, res, next) => {
  try {
    const { score, notes } = req.body;

    if (score !== undefined && (score < 0 || score > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Score must be between 0 and 100',
      });
    }

    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      { score, notes },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete an entry
// @route   DELETE /api/entries/:id
// @access  Private
export const deleteEntry = async (req, res, next) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get summary stats for a pillar
// @route   GET /api/entries/stats/:userId/:pillar
// @access  Private
export const getPillarStats = async (req, res, next) => {
  try {
    const { userId, pillar } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await Entry.find({
      userId,
      pillar,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    if (entries.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          pillar,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          entryCount: 0,
          trend: 'stable',
        },
      });
    }

    const scores = entries.map(e => e.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highScore = Math.max(...scores);
    const lowScore = Math.min(...scores);

    // Calculate trend
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

    let trend = 'stable';
    if (recentAvg > olderAvg + 5) trend = 'improving';
    else if (recentAvg < olderAvg - 5) trend = 'declining';

    res.status(200).json({
      success: true,
      data: {
        pillar,
        averageScore: Math.round(avgScore * 10) / 10,
        highestScore: highScore,
        lowestScore: lowScore,
        entryCount: entries.length,
        trend,
        days: parseInt(days),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
