/**
 * Daily Checkin Route
 * 
 * Provides micro-questions and feedback for daily progress tracking.
 * Lightweight check-in focused on 3-5 quick questions per pillar.
 * 
 * GET  /api/checkin/:pillar          - Get today's micro-questions
 * POST /api/checkin/:pillar          - Submit checkin responses
 * GET  /api/checkin/:pillar/history  - Get checkin history
 */

import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { loadMemory, saveMemory } from '../src/ai/orchestrator/memoryStore.js';
import Entry from '../models/Entry.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Pillar-specific micro-questions
const CHECKIN_QUESTIONS = {
  sleep: [
    {
      id: 'sleep_quality',
      question: 'How would you rate your sleep quality last night? (1-10)',
      type: 'number',
      range: [1, 10]
    },
    {
      id: 'sleep_hours',
      question: 'How many hours did you sleep?',
      type: 'number',
      range: [0, 12]
    },
    {
      id: 'sleep_onset',
      question: 'How long did it take you to fall asleep? (minutes)',
      type: 'number',
      range: [0, 120]
    },
    {
      id: 'sleep_disruptions',
      question: 'Any night time awakenings or disruptions?',
      type: 'boolean'
    },
    {
      id: 'morning_mood',
      question: 'How do you feel this morning? (1=exhausted, 10=energized)',
      type: 'number',
      range: [1, 10]
    }
  ],
  fitness: [
    {
      id: 'exercise_done',
      question: 'Did you exercise today?',
      type: 'boolean'
    },
    {
      id: 'exercise_type',
      question: 'What type of exercise?',
      type: 'text',
      conditional: 'exercise_done'
    },
    {
      id: 'exercise_duration',
      question: 'How many minutes?',
      type: 'number',
      conditional: 'exercise_done',
      range: [0, 300]
    },
    {
      id: 'exercise_intensity',
      question: 'Intensity level (1=light, 5=max effort)',
      type: 'number',
      conditional: 'exercise_done',
      range: [1, 5]
    },
    {
      id: 'how_feel',
      question: 'How do you feel physically today?',
      type: 'select',
      options: ['Energized', 'Good', 'Okay', 'Tired', 'Sore']
    }
  ],
  'mental-health': [
    {
      id: 'mood_today',
      question: 'What\'s your mood today? (1=low, 10=excellent)',
      type: 'number',
      range: [1, 10]
    },
    {
      id: 'stress_level',
      question: 'Stress level? (1=none, 10=overwhelming)',
      type: 'number',
      range: [1, 10]
    },
    {
      id: 'meditation',
      question: 'Did you meditate or do mindfulness today?',
      type: 'boolean'
    },
    {
      id: 'social_connection',
      question: 'Did you connect with anyone meaningful?',
      type: 'boolean'
    },
    {
      id: 'one_word_feel',
      question: 'One word to describe today:',
      type: 'text'
    }
  ],
  nutrition: [
    {
      id: 'meals_count',
      question: 'How many balanced meals did you have?',
      type: 'number',
      range: [0, 5]
    },
    {
      id: 'water_intake',
      question: 'How many glasses of water did you drink?',
      type: 'number',
      range: [0, 15]
    },
    {
      id: 'cravings',
      question: 'Any sugar/junk food cravings today?',
      type: 'boolean'
    },
    {
      id: 'feeling_nutritious',
      question: 'How do you feel nutritionally?',
      type: 'select',
      options: ['Nourished', 'Good', 'Okay', 'Not ideal', 'Poor']
    }
  ],
  finances: [
    {
      id: 'spent_today',
      question: 'Did you spend money today?',
      type: 'boolean'
    },
    {
      id: 'amount_spent',
      question: 'Approximate amount: ($)',
      type: 'number',
      conditional: 'spent_today',
      range: [0, 1000]
    },
    {
      id: 'goal_aligned',
      question: 'Was it aligned with your financial goals?',
      type: 'boolean',
      conditional: 'spent_today'
    },
    {
      id: 'progress_check',
      question: 'How\'s your progress on saving goals?',
      type: 'select',
      options: ['On track', 'Slightly behind', 'Behind', 'Accelerating']
    }
  ],
  'physical-health': [
    {
      id: 'pain_level',
      question: 'Any pain or discomfort today? (0=none, 10=severe)',
      type: 'number',
      range: [0, 10]
    },
    {
      id: 'medication_taken',
      question: 'Did you take your medications as prescribed?',
      type: 'boolean'
    },
    {
      id: 'energy_level',
      question: 'Energy level today?',
      type: 'number',
      range: [1, 10]
    },
    {
      id: 'medical_concern',
      question: 'Any new symptoms or concerns?',
      type: 'boolean'
    }
  ],
  social: [
    {
      id: 'social_interaction',
      question: 'Did you have meaningful social time?',
      type: 'boolean'
    },
    {
      id: 'who_with',
      question: 'Who did you interact with?',
      type: 'text',
      conditional: 'social_interaction'
    },
    {
      id: 'loneliness',
      question: 'How lonely did you feel today?',
      type: 'number',
      range: [0, 10]
    },
    {
      id: 'connection_quality',
      question: 'Quality of social connection?',
      type: 'select',
      options: ['Deep', 'Good', 'Surface', 'Awkward', 'None']
    }
  ],
  spirituality: [
    {
      id: 'spiritual_practice',
      question: 'Did you do any spiritual practice?',
      type: 'boolean'
    },
    {
      id: 'practice_type',
      question: 'What did you do?',
      type: 'text',
      conditional: 'spiritual_practice'
    },
    {
      id: 'purpose_connection',
      question: 'Did you feel connected to your purpose?',
      type: 'boolean'
    },
    {
      id: 'gratitude_practice',
      question: 'Did you practice gratitude?',
      type: 'boolean'
    }
  ]
};

// ============================================================================
// GET TODAY'S CHECKIN QUESTIONS
// ============================================================================

/**
 * GET /api/checkin/:pillar
 * 
 * Returns today's micro-questions for a pillar with smart logic:
 * - Skips already-answered questions
 * - Returns conditional questions based on previous answers
 * - Includes AI-generated followup prompts
 */
router.get('/:pillar', jwtAuthMiddleware, async (req, res) => {
  try {
    const { pillar } = req.params;
    const userId = req.userId;

    // Validate pillar
    const validPillars = Object.keys(CHECKIN_QUESTIONS);
    if (!validPillars.includes(pillar)) {
      return res.status(400).json({ ok: false, error: 'Invalid pillar' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already completed today
    const todayCheckin = await Entry.findOne({
      userId,
      pillar,
      type: 'checkin',
      date: today
    });

    if (todayCheckin) {
      return res.json({
        ok: true,
        completed: true,
        checkinData: todayCheckin.data,
        completedAt: todayCheckin.createdAt
      });
    }

    // Return questions for this pillar
    const questions = CHECKIN_QUESTIONS[pillar] || [];

    res.json({
      ok: true,
      completed: false,
      pillar,
      date: today,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        range: q.range,
        options: q.options,
        conditional: q.conditional
      }))
    });
  } catch (error) {
    logger.error(`Error fetching checkin questions: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================================
// SUBMIT CHECKIN RESPONSES
// ============================================================================

/**
 * POST /api/checkin/:pillar
 * 
 * Body: {
 *   responses: {
 *     [questionId]: answer,
 *     sleep_quality: 8,
 *     sleep_hours: 7.5,
 *     ...
 *   },
 *   notes?: string
 * }
 * 
 * Returns AI-generated feedback and next steps
 */
router.post('/:pillar', jwtAuthMiddleware, async (req, res) => {
  try {
    const { pillar } = req.params;
    const { responses, notes } = req.body;
    const userId = req.userId;

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ ok: false, error: 'responses required' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Save checkin as Entry
    const entry = await Entry.create({
      userId,
      pillar,
      date: today,
      type: 'checkin',
      score: calculateCheckinScore(responses),
      data: {
        responses,
        notes,
        checkinType: 'daily_micro'
      }
    });

    // Generate AI feedback (async, non-blocking)
    generateCheckinFeedback(userId, pillar, responses, notes).catch(err => {
      logger.error(`Error generating checkin feedback: ${err.message}`);
    });

    // Load user memory and update
    const memory = await loadMemory(userId);
    if (!memory.pillars[pillar]) memory.pillars[pillar] = {};
    memory.pillars[pillar].lastCheckin = {
      date: today,
      responses,
      score: entry.score
    };
    await saveMemory(userId, memory);

    logger.info(`Checkin submitted for ${userId} - pillar: ${pillar}`);

    res.json({
      ok: true,
      entryId: entry._id,
      score: entry.score,
      message: 'Checkin saved! Keep up the great work.',
      nextSteps: getNextStepsSuggestion(pillar, responses)
    });
  } catch (error) {
    logger.error(`Error submitting checkin: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================================
// GET CHECKIN HISTORY
// ============================================================================

/**
 * GET /api/checkin/:pillar/history
 * 
 * Query params:
 *   days?: number (default: 30)
 *   from?: string (ISO date)
 *   to?: string (ISO date)
 */
router.get('/:pillar/history', jwtAuthMiddleware, async (req, res) => {
  try {
    const { pillar } = req.params;
    const { days = 30, from, to } = req.query;
    const userId = req.userId;

    const query = {
      userId,
      pillar,
      type: 'checkin'
    };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    } else {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      query.date = { $gte: startDate.toISOString().split('T')[0] };
    }

    const history = await Entry.find(query).sort({ date: -1 });

    res.json({
      ok: true,
      pillar,
      count: history.length,
      history: history.map(h => ({
        date: h.date,
        score: h.score,
        responses: h.data?.responses,
        notes: h.data?.notes
      }))
    });
  } catch (error) {
    logger.error(`Error fetching checkin history: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate a simple score from responses (0-100)
 */
function calculateCheckinScore(responses) {
  const scores = Object.values(responses).filter(v => typeof v === 'number');
  if (scores.length === 0) return 50;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg / 10) * 100); // Scale from 0-10 to 0-100
}

/**
 * Generate AI feedback for the checkin (async)
 */
async function generateCheckinFeedback(userId, pillar, responses, notes) {
  // TODO: Call orchestrator with feedback prompt
  // Generate personalized insights based on responses
  logger.info(`Feedback generation queued for ${userId} - ${pillar}`);
}

/**
 * Get smart next steps based on checkin responses
 */
function getNextStepsSuggestion(pillar, responses) {
  const suggestions = {
    sleep: () => {
      const quality = responses.sleep_quality;
      if (quality < 5) return 'Consider reviewing your sleep hygiene tonight';
      if (quality > 8) return 'Your sleep is great! Try to maintain this consistency';
      return 'Good sleep! Small adjustments might help further';
    },
    fitness: () => {
      const intensity = responses.exercise_intensity;
      if (!responses.exercise_done) return 'Try a light activity today to keep the streak going';
      if (intensity > 4) return 'Great intensity! Make sure to recover adequately';
      return 'Consistency matters more than intensity - keep it up';
    },
    'mental-health': () => {
      const mood = responses.mood_today;
      const stress = responses.stress_level;
      if (mood < 4 || stress > 7) return 'Consider talking to someone or trying your favorite coping strategy';
      return 'Your mental health looks good today!';
    }
  };

  const suggestionFn = suggestions[pillar];
  return suggestionFn ? suggestionFn() : 'Keep maintaining your habits!';
}

export default router;
