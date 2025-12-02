import express from 'express';
import {
  coachAgent,
  dailyPlanAgent,
  pillarAnalysisAgent,
  weeklyReflectionAgent,
  weeklyReportAgent,
} from '../controllers/aiController.js';

const router = express.Router();

import { authRequired, requirePillarAccess } from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

// require auth for AI endpoints
router.use(authRequired);

// helper: only enforce pillar access if request body/query contains a pillar key
const conditionalPillarGuard = (keys) => (req, res, next) => {
  const candidateKeys = Array.isArray(keys) ? keys : [keys];
  let found = false;
  for (const k of candidateKeys) {
    if (req.body?.[k] || req.query?.[k]) { found = true; break; }
  }
  if (found) return requirePillarAccess(candidateKeys)(req, res, next);
  return next();
};

/**
 * POST /api/ai/coach
 * Endpoint for coaching agent
 * Body: { prompt, userContext?, pillarFocus? }
 */
router.post('/coach', conditionalPillarGuard(['pillar','pillarFocus']), asyncHandler(coachAgent));

/**
 * POST /api/ai/daily-plan
 * Endpoint for daily plan agent
 * Body: { prompt, userGoals?, timeAvailable? }
 */
router.post('/daily-plan', asyncHandler(dailyPlanAgent));

/**
 * POST /api/ai/pillar-analysis
 * Endpoint for pillar analysis agent
 * Body: { prompt, currentScores?, focusAreas? }
 */
router.post('/pillar-analysis', conditionalPillarGuard(['pillar','pillarFocus']), asyncHandler(pillarAnalysisAgent));

/**
 * POST /api/ai/weekly-reflection
 * Endpoint for weekly reflection agent
 * Body: { prompt, weeklyData?, pillarScores? }
 */
router.post('/weekly-reflection', conditionalPillarGuard(['pillar','pillarScores']), asyncHandler(weeklyReflectionAgent));
router.get('/weekly-report', asyncHandler(weeklyReportAgent));

export default router;
