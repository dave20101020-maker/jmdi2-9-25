/**
 * Advanced Features API Routes
 * 
 * Endpoints for:
 * - Dashboard data (habits, scores, trends, insights)
 * - Weekly reviews
 * - Micro-actions
 * - Habit/goal suggestions
 * - Coach escalations
 * - Response tracking and feedback
 * 
 * File: backend/routes/advancedFeatures.js
 */

import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { generateWeeklyReview, storeWeeklyReview } from '../src/ai/agents/weeklyReviewAgent.js';
import { generateMicroActions, completeMicroAction } from '../src/ai/agents/microActionsEngine.js';
import { getSuggestions, acceptSuggestion } from '../src/ai/agents/habitsGoalSuggester.js';
import { analyzeEscalationNeeds, createEscalation } from '../src/ai/agents/coachEscalationSystem.js';
import {
  trackResponse,
  recordFeedback,
  calculateConfidenceScore,
  getQualityMetrics,
  getEscalationStats,
  generateQualityReport,
} from '../src/ai/agents/responseTracking.js';
import Habit from '../models/Habit.js';
import PillarScore from '../models/PillarScore.js';
import Entry from '../models/Entry.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(jwtAuthMiddleware);

// =============================================================================
// DASHBOARD ENDPOINTS
// =============================================================================

/**
 * GET /api/advanced/dashboard
 * Get complete dashboard data (habits, scores, trends, insights)
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    // Get active habits
    const habits = await Habit.find({
      userId,
      isActive: true,
    })
      .sort({ streakCount: -1 })
      .lean();

    // Get pillar scores
    const pillarScores = await PillarScore.find({ userId }).lean();

    // Get trend data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await Entry.find({
      userId,
      type: 'checkin',
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Aggregate trend data by date
    const trendData = {};
    entries.forEach((entry) => {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!trendData[date]) {
        trendData[date] = {};
      }
      trendData[date][entry.pillar] = entry.score / 10; // Normalize to 0-10
    });

    const trendArray = Object.entries(trendData)
      .map(([date, scores]) => ({
        date,
        ...scores,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get recent AI insights
    const aiInsights = await Entry.find({
      userId,
      type: 'ai-response',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      ok: true,
      dashboard: {
        habits,
        pillarScores,
        trendData: trendArray,
        aiInsights: aiInsights.map((insight) => ({
          _id: insight._id,
          pillar: insight.pillar,
          content: insight.metadata?.summary || insight.notes || 'AI insight provided',
          createdAt: insight.createdAt,
        })),
      },
    });
  })
);

// =============================================================================
// WEEKLY REVIEW ENDPOINTS
// =============================================================================

/**
 * GET /api/advanced/weekly-review
 * Generate and retrieve weekly review
 */
router.get(
  '/weekly-review',
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    const review = await generateWeeklyReview(userId);

    // Store the review
    await storeWeeklyReview(userId, review);

    res.json({
      ok: true,
      review,
    });
  })
);

/**
 * GET /api/advanced/weekly-reviews/history
 * Get history of weekly reviews
 */
router.get(
  '/weekly-reviews/history',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const limit = req.query.limit || 10;

    const reviews = await Entry.find({
      userId,
      type: 'weekly-review',
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      ok: true,
      reviews,
      count: reviews.length,
    });
  })
);

// =============================================================================
// MICRO-ACTIONS ENDPOINTS
// =============================================================================

/**
 * GET /api/advanced/micro-actions/:pillar
 * Get micro-actions for a pillar
 */
router.get(
  '/micro-actions/:pillar',
  asyncHandler(async (req, res) => {
    const { pillar } = req.params;

    const result = await generateMicroActions(pillar);

    res.json(result);
  })
);

/**
 * POST /api/advanced/micro-actions/:pillar/complete/:actionId
 * Mark a micro-action as completed
 */
router.post(
  '/micro-actions/:pillar/complete/:actionId',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { pillar, actionId } = req.params;

    const result = await completeMicroAction(userId, actionId, pillar);

    res.json(result);
  })
);

// =============================================================================
// HABIT & GOAL SUGGESTIONS ENDPOINTS
// =============================================================================

/**
 * GET /api/advanced/suggestions
 * Get personalized habit/goal suggestions
 */
router.get(
  '/suggestions',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const limit = req.query.limit || 5;

    const result = await getSuggestions(userId, parseInt(limit));

    res.json(result);
  })
);

/**
 * POST /api/advanced/suggestions/:suggestionId/accept
 * Accept a suggestion and create habit from it
 */
router.post(
  '/suggestions/:suggestionId/accept',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { suggestionId } = req.params;
    const { suggestion } = req.body;

    const result = await acceptSuggestion(userId, suggestion);

    res.json(result);
  })
);

// =============================================================================
// ESCALATION ENDPOINTS
// =============================================================================

/**
 * POST /api/advanced/analyze-escalation
 * Analyze if user message needs escalation
 */
router.post(
  '/analyze-escalation',
  asyncHandler(async (req, res) => {
    const { message, messageHistory } = req.body;

    const escalation = analyzeEscalationNeeds(message, messageHistory || []);

    res.json({
      ok: true,
      escalation,
    });
  })
);

/**
 * POST /api/advanced/escalate
 * Create escalation and notify coaches
 */
router.post(
  '/escalate',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { escalation, userMessage } = req.body;

    const result = await createEscalation(userId, escalation, userMessage);

    res.json(result);
  })
);

// =============================================================================
// RESPONSE TRACKING ENDPOINTS
// =============================================================================

/**
 * POST /api/advanced/track-response
 * Track an AI response
 */
router.post(
  '/track-response',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { pillar, response } = req.body;

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(response);

    const result = await trackResponse(userId, pillar, {
      ...response,
      confidenceScore,
    });

    res.json({
      ...result,
      confidenceScore,
    });
  })
);

/**
 * POST /api/advanced/feedback/:trackingId
 * Record user feedback on AI response
 * Body: { feedback: "HELPFUL|SOMEWHAT_HELPFUL|NEUTRAL|NOT_HELPFUL|CONFUSED", comment?: "..." }
 */
router.post(
  '/feedback/:trackingId',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { trackingId } = req.params;
    const { feedback, comment } = req.body;

    const result = await recordFeedback(userId, trackingId, feedback, comment);

    res.json(result);
  })
);

/**
 * GET /api/advanced/quality-metrics
 * Get quality metrics for AI responses
 * Query: ?pillar=sleep&days=30
 */
router.get(
  '/quality-metrics',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { pillar, days } = req.query;

    const result = await getQualityMetrics(userId, pillar, parseInt(days) || 30);

    res.json(result);
  })
);

/**
 * GET /api/advanced/escalation-stats
 * Get escalation statistics
 * Query: ?days=30
 */
router.get(
  '/escalation-stats',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { days } = req.query;

    const result = await getEscalationStats(userId, parseInt(days) || 30);

    res.json(result);
  })
);

/**
 * GET /api/advanced/quality-report
 * Get comprehensive quality report
 * Query: ?days=30
 */
router.get(
  '/quality-report',
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { days } = req.query;

    const result = await generateQualityReport(userId, parseInt(days) || 30);

    res.json(result);
  })
);

// =============================================================================
// COMBINED ENDPOINTS (Multiple features in one call)
// =============================================================================

/**
 * GET /api/advanced/wellness-snapshot
 * Get complete wellness snapshot (dashboard + suggestions + metrics)
 */
router.get(
  '/wellness-snapshot',
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    // Parallel requests
    const [dashboard, suggestions, qualityReport] = await Promise.all([
      // Dashboard data
      (async () => {
        const habits = await Habit.find({ userId, isActive: true }).lean();
        const pillarScores = await PillarScore.find({ userId }).lean();
        return { habits, pillarScores };
      })(),
      // Suggestions
      getSuggestions(userId, 3),
      // Quality report
      generateQualityReport(userId, 7), // Last week
    ]);

    res.json({
      ok: true,
      snapshot: {
        dashboard,
        suggestions,
        qualityReport,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

export default router;
