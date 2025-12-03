/**
 * Weekly Plan Route
 * 
 * Generates a 7-day action plan with daily habits and schedule for each pillar.
 * Uses the orchestrator to intelligently craft week-long strategies.
 * 
 * GET  /api/ai/weeklyPlan/:pillar - Get weekly plan
 * POST /api/ai/weeklyPlan/:pillar - Generate new weekly plan
 */

import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { loadMemory, saveMemory } from '../src/ai/orchestrator/memoryStore.js';
import { classifyMessage } from '../src/ai/orchestrator/classifier.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================================================
// WEEKLY PLAN GENERATION
// ============================================================================

/**
 * Generate a 7-day action plan for a pillar
 * 
 * Queries the orchestrator with a special prompt to create:
 * - Daily micro-goals (1-3 per day)
 * - Habits to build (frequency, timing, difficulty)
 * - Time-blocked schedule (morning, afternoon, evening)
 * - Progress checkpoints (mid-week & end-of-week)
 * 
 * POST /api/ai/weeklyPlan/:pillar
 * 
 * Body: {
 *   theme?: string,        // Optional: "maintenance", "intensive", "recovery"
 *   startDate?: string,    // Optional: ISO date (defaults to Monday next week)
 *   difficulty?: number    // Optional: 1-5 (default: 3)
 * }
 * 
 * Response: {
 *   ok: true,
 *   planId: string,
 *   pillar: string,
 *   week: { startDate, endDate },
 *   theme: string,
 *   days: [
 *     {
 *       date: "2025-12-08",
 *       dayOfWeek: "Monday",
 *       focus: "Foundation building",
 *       schedule: [
 *         { time: "06:00-06:30", activity: "Morning routine", type: "habit" },
 *         { time: "19:00-19:30", activity: "Evening reflection", type: "reflection" }
 *       ],
 *       goals: [
 *         { title: "...", description: "...", priority: "high" }
 *       ],
 *       habits: [
 *         { title: "...", frequency: "daily", duration: 15 }
 *       ],
 *       checkpoint?: "Review progress so far"
 *     },
 *     ...
 *   ],
 *   summary: "...",
 *   estimatedCompletionTime: number  // minutes per week
 * }
 */
router.post('/:pillar', jwtAuthMiddleware, async (req, res) => {
  try {
    const { pillar } = req.params;
    const { theme = 'maintenance', startDate = null, difficulty = 3 } = req.body;
    const userId = req.userId;

    // Validate pillar
    const validPillars = ['sleep', 'fitness', 'mental-health', 'nutrition', 'finances', 'physical-health', 'social', 'spirituality'];
    if (!validPillars.includes(pillar)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid pillar'
      });
    }

    // Load user memory
    const memory = await loadMemory(userId);

    // Calculate week dates
    const weekStart = getNextMonday(startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Build weekly plan prompt
    const weeklyPlanPrompt = buildWeeklyPlanPrompt({
      pillar,
      theme,
      difficulty,
      weekStart,
      userMemory: memory.pillars[pillar] || {}
    });

    // Generate plan using orchestrator
    const { northstarOrchestrator } = await import('../src/ai/orchestrator/northstarOrchestrator.js');
    
    const aiResponse = await northstarOrchestrator({
      userId,
      message: weeklyPlanPrompt,
      explicitPillar: pillar,
      memory
    });

    // Parse AI response into structured plan
    const weeklyPlan = parseWeeklyPlanResponse({
      aiResponse,
      pillar,
      weekStart,
      weekEnd,
      theme
    });

    // Save plan to memory
    memory.pillars[pillar] = memory.pillars[pillar] || {};
    memory.pillars[pillar].currentWeeklyPlan = {
      ...weeklyPlan,
      generatedAt: new Date(),
      theme,
      difficulty
    };
    await saveMemory(userId, memory);

    logger.info(`Weekly plan generated for ${userId} - pillar: ${pillar}, theme: ${theme}`);

    res.json({
      ok: true,
      planId: `${pillar}-${weekStart.toISOString().split('T')[0]}`,
      pillar,
      week: {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      },
      theme,
      days: weeklyPlan.days,
      summary: weeklyPlan.summary,
      estimatedCompletionTime: weeklyPlan.estimatedCompletionTime || 0
    });
  } catch (error) {
    logger.error(`Error generating weekly plan: ${error.message}`);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * Get current weekly plan for a pillar
 * 
 * GET /api/ai/weeklyPlan/:pillar
 */
router.get('/:pillar', jwtAuthMiddleware, async (req, res) => {
  try {
    const { pillar } = req.params;
    const userId = req.userId;

    const memory = await loadMemory(userId);
    const currentPlan = memory.pillars[pillar]?.currentWeeklyPlan;

    if (!currentPlan) {
      return res.status(404).json({
        ok: false,
        error: 'No weekly plan generated yet'
      });
    }

    res.json({
      ok: true,
      pillar,
      plan: currentPlan
    });
  } catch (error) {
    logger.error(`Error fetching weekly plan: ${error.message}`);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a prompt to generate a 7-day action plan
 */
function buildWeeklyPlanPrompt({ pillar, theme, difficulty, weekStart, userMemory }) {
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const themeDescription = {
    maintenance: 'Maintain current habits and steady progress',
    intensive: 'Push harder with challenging goals and daily commitments',
    recovery: 'Gentle pace with focus on sustainable habits'
  }[theme] || 'Balanced approach';

  return `Create a detailed 7-day action plan for the ${pillar} pillar starting ${weekStartStr}.

Theme: ${theme} (${themeDescription})
Difficulty Level: ${difficulty}/5

Please structure the plan as follows for each day (Monday-Sunday):

**FORMAT FOR EACH DAY:**
Day: [Date and Day of Week]
Focus: [One-sentence theme for the day]

Schedule:
- [Time]: [Activity] ([duration] min) [Type: habit/reflection/exercise/etc]

Daily Goals (1-3):
- [Goal 1]
- [Goal 2]

Daily Habits:
- [Habit name] - [Frequency] - [Duration]

Checkpoint (for Wed & Sun):
- [Mid-week or end-of-week progress check]

Include:
1. Specific times (not vague like "morning")
2. Realistic durations that total 30-90 min/day depending on difficulty
3. A mix of big wins and quick wins
4. At least one reflection or progress checkpoint per week
5. Progressive difficulty (easier early week, building to harder)

End with:
SUMMARY: [2-3 sentences about the week's focus]
ESTIMATED TIME: [Total minutes per week needed]`;
}

/**
 * Parse AI response into structured weekly plan
 */
function parseWeeklyPlanResponse({ aiResponse, pillar, weekStart, weekEnd, theme }) {
  // TODO: Implement sophisticated parsing of AI response into structured format
  // For now, return basic structure
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    days.push({
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek: dayNames[currentDate.getDay()],
      focus: `Day ${i + 1} focus`,
      schedule: [],
      goals: [],
      habits: [],
      checkpoint: i === 3 || i === 6 ? 'Review progress' : undefined
    });
  }

  return {
    days,
    summary: aiResponse.text || 'Weekly plan generated',
    estimatedCompletionTime: 300
  };
}

/**
 * Get next Monday (or specific date)
 */
function getNextMonday(startDate) {
  if (startDate) {
    return new Date(startDate);
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return nextMonday;
}

export default router;
