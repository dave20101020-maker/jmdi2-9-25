/**
 * Unified AI Routes
 *
 * Clean API endpoints for all AI modules:
 * - Chat (all coaches)
 * - Journaling prompts
 * - Adaptive planning
 * - Correlation analysis
 * - Micro-actions
 * - Wellness workflows
 */

import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  authRequired,
  requireFeatureAccess,
} from "../middleware/authMiddleware.js";
import { requireSensitiveConsent } from "../middleware/consentGuard.js";
import { aiRateLimitMiddleware } from "../middleware/rateLimiter.js";
import { sanitizationMiddleware } from "../middleware/sanitization.js";
import { FEATURE_KEYS } from "../utils/entitlements.js";
import aiOrchestratorService from "../services/aiOrchestratorService.js";

const router = express.Router();

// Apply auth and consent middleware to all routes
router.use(authRequired);
router.use(requireSensitiveConsent);

/**
 * POST /api/ai/unified/chat
 * Universal chat endpoint - routes to appropriate coach/module
 *
 * Body:
 * - message: string (required)
 * - pillar: string (optional) - force specific pillar
 * - module: string (optional) - force specific module
 */
router.post(
  "/chat",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  sanitizationMiddleware,
  asyncHandler(async (req, res) => {
    const { message, pillar, module, options = {} } = req.body;
    const userId = req.user._id;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Message is required",
      });
    }

    const result = await aiOrchestratorService.processAIChat({
      userId,
      message,
      pillar,
      module,
      options,
    });

    if (!result.ok) {
      return res.status(result.isCrisis ? 200 : 503).json(result);
    }

    return res.json(result);
  })
);

/**
 * POST /api/ai/unified/journaling
 * Generate personalized journaling prompt
 *
 * Body:
 * - promptType: string (optional) - 'gratitude', 'reflection', 'goals', 'emotions', 'growth', 'challenges'
 * - customMessage: string (optional) - custom request
 */
router.post(
  "/journaling",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  asyncHandler(async (req, res) => {
    const { promptType = "reflection", customMessage } = req.body;
    const userId = req.user._id;

    const result = await aiOrchestratorService.generateJournalingPrompt({
      userId,
      promptType,
      customMessage,
    });

    return res.json(result);
  })
);

/**
 * POST /api/ai/unified/plan
 * Generate adaptive wellness plan
 *
 * Body:
 * - focus: string (optional) - 'overall wellness', 'sleep', 'stress', etc.
 * - timeframe: string (optional) - 'day', 'week', 'month'
 */
router.post(
  "/plan",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  asyncHandler(async (req, res) => {
    const { focus = "overall wellness", timeframe = "week" } = req.body;
    const userId = req.user._id;

    const result = await aiOrchestratorService.generateAdaptivePlan({
      userId,
      focus,
      timeframe,
    });

    return res.json(result);
  })
);

/**
 * POST /api/ai/unified/correlations
 * Analyze wellness patterns and correlations
 *
 * Body:
 * - timeframe: number (optional) - days to analyze (default 30)
 */
router.post(
  "/correlations",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  asyncHandler(async (req, res) => {
    const { timeframe = 30 } = req.body;
    const userId = req.user._id;

    const result = await aiOrchestratorService.analyzeCorrelations({
      userId,
      timeframe,
    });

    return res.json(result);
  })
);

/**
 * POST /api/ai/unified/micro-actions
 * Generate quick micro-actions for a pillar
 *
 * Body:
 * - pillar: string (required) - pillar to generate actions for
 */
router.post(
  "/micro-actions",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  asyncHandler(async (req, res) => {
    const { pillar } = req.body;
    const userId = req.user._id;

    if (!pillar) {
      return res.status(400).json({
        ok: false,
        error: "Pillar is required",
      });
    }

    const result = await aiOrchestratorService.generateMicroActionsForPillar({
      userId,
      pillar,
    });

    return res.json(result);
  })
);

/**
 * POST /api/ai/unified/workflow
 * Execute multi-step wellness workflow
 *
 * Body:
 * - workflowType: string (required) - 'morning_routine', 'evening_reflection', 'wellness_assessment'
 */
router.post(
  "/workflow",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  asyncHandler(async (req, res) => {
    const { workflowType } = req.body;
    const userId = req.user._id;

    if (!workflowType) {
      return res.status(400).json({
        ok: false,
        error: "Workflow type is required",
      });
    }

    const result = await aiOrchestratorService.executeWellnessWorkflow({
      userId,
      workflowType,
    });

    return res.json(result);
  })
);

/**
 * GET /api/ai/unified/modules
 * Get available AI modules and workflows info
 */
router.get(
  "/modules",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  asyncHandler(async (req, res) => {
    const info = await aiOrchestratorService.getAIModuleInfo();
    return res.json(info);
  })
);

/**
 * GET /api/ai/unified/memory
 * Get user's AI memory summary
 */
router.get(
  "/memory",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const summary = await aiOrchestratorService.getAIMemorySummary(userId);
    return res.json(summary);
  })
);

/**
 * POST /api/ai/unified/memory/reset
 * Reset user's AI memory
 */
router.post(
  "/memory/reset",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const result = await aiOrchestratorService.resetAIMemory(userId);
    return res.json(result);
  })
);

/**
 * GET /api/ai/unified/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "Unified AI Orchestrator",
    status: "operational",
    timestamp: new Date().toISOString(),
    modules: [
      "sleep_coach",
      "mental_health_coach",
      "diet_coach",
      "fitness_coach",
      "physical_health_coach",
      "finances_coach",
      "social_coach",
      "spirituality_coach",
      "crisis_handler",
      "correlation_engine",
      "journaling_agent",
      "adaptive_planner",
      "micro_actions",
    ],
  });
});

export default router;
