import express from 'express';
import {
  coachAgent,
  dailyPlanAgent,
  pillarAnalysisAgent,
  weeklyReflectionAgent,
} from '../controllers/aiController.js';

const router = express.Router();

/**
 * POST /api/ai/coach
 * Endpoint for coaching agent
 * Body: { prompt, userContext?, pillarFocus? }
 */
router.post('/coach', coachAgent);

/**
 * POST /api/ai/daily-plan
 * Endpoint for daily plan agent
 * Body: { prompt, userGoals?, timeAvailable? }
 */
router.post('/daily-plan', dailyPlanAgent);

/**
 * POST /api/ai/pillar-analysis
 * Endpoint for pillar analysis agent
 * Body: { prompt, currentScores?, focusAreas? }
 */
router.post('/pillar-analysis', pillarAnalysisAgent);

/**
 * POST /api/ai/weekly-reflection
 * Endpoint for weekly reflection agent
 * Body: { prompt, weeklyData?, pillarScores? }
 */
router.post('/weekly-reflection', weeklyReflectionAgent);

export default router;
