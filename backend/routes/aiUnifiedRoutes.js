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
import OpenAI from "openai";
import crypto from "crypto";
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
import { getProviderHealth } from "../utils/providerHealth.js";
import { runNorthStarAI } from "../src/ai/orchestrator/northstarOrchestrator.js";

const router = express.Router();

// NOTE: Auth/consent middleware is applied AFTER /chat for now.
// /chat is temporarily unauthenticated to make AI responses deterministic.

const providerKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
const openai = new OpenAI({
  apiKey: providerKey,
  timeout: 30_000,
});

const FALLBACK_REPLY =
  "NorthStar AI is temporarily unavailable. Here is a safe fallback response: Try a small next step, write down one intention for today, and pick a single action you can complete in 5 minutes.";

function newAnonSessionId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
}

/**
 * POST /api/ai/unified/chat
 * TEMP: Deterministic chat endpoint (no orchestrator/memory/pillar routing)
 * TEMP: Unauthenticated while hardening reliability
 *
 * Body:
 * - message: string (required)
 * - pillar/module/options may be provided
 *   - pillar: backend pillar id (sleep, mental_health, nutrition, fitness, physical_health, finances, social, spirituality)
 *   - module: string (optional, e.g. 'neuroshield')
 *   - options.explicitMode: boolean (if true, forces routing to the requested pillar)
 */
router.post(
  "/chat",
  aiRateLimitMiddleware,
  sanitizationMiddleware,
  asyncHandler(async (req, res) => {
    const requestId = newAnonSessionId();
    res.set("x-ns-unified-chat", "1");
    res.set("x-ns-request-id", requestId);

    console.info("[AI][unified.chat] request received", {
      path: req.path,
      ip: req.ip,
      requestId,
    });
    console.info("[AI][unified.chat] request body", req.body);

    const message = req.body?.message;
    const requestedPillar = req.body?.pillar;
    const requestedModule = req.body?.module;
    const requestContext =
      req.body?.aiContext ||
      req.body?.context ||
      req.body?.options?.aiContext ||
      req.body?.options?.uiContext ||
      req.body?.options?.context ||
      null;

    const requestedMode = (requestContext?.mode || "").toString().toLowerCase();
    const requestedContextPillarId = (requestContext?.pillarId || "")
      .toString()
      .toLowerCase();

    // Pillar agents may ONLY respond if explicit pillar_direct context exists.
    const explicitMode = requestedMode === "pillar_direct";
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(200).json({
        success: false,
        error: "Message is required",
        reply: FALLBACK_REPLY,
      });
    }

    if (!providerKey) {
      return res.status(200).json({
        success: false,
        error: "Provider key missing. Set OPENAI_API_KEY or AI_PROVIDER_KEY.",
        reply: FALLBACK_REPLY,
      });
    }

    try {
      const authUserId =
        req.user?._id?.toString?.() || req.user?.id || "anonymous";

      // Anonymous users must still persist to a temporary session store.
      // Use a cookie to scope memory to a single anonymous browser session.
      let userId = authUserId;
      if (authUserId === "anonymous") {
        const existing = req.cookies?.ns_anon;
        const anonId =
          typeof existing === "string" && existing.trim()
            ? existing.trim()
            : newAnonSessionId();

        if (anonId !== existing) {
          res.cookie("ns_anon", anonId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 30,
          });
        }

        userId = `anon:${anonId}`;
      }

      let explicitPillar;

      // Deterministic guard:
      // - pillar_direct => force requested pillar
      // - anything else => force NorthStar (general)
      if (requestedMode === "pillar_direct") {
        explicitPillar =
          requestedContextPillarId ||
          (typeof requestedPillar === "string" && requestedPillar
            ? requestedPillar
            : undefined);
      } else {
        explicitPillar = "general";
      }

      const userMessage =
        typeof requestedModule === "string" && requestedModule.trim()
          ? `[module:${requestedModule.trim()}]\n${message.trim()}`
          : message.trim();

      console.info("[AI][unified.chat] routing", {
        userId: authUserId === "anonymous" ? "anonymous" : "authenticated",
        requestedMode: requestedMode || null,
        requestedContextPillarId: requestedContextPillarId || null,
        explicitMode,
        explicitPillar: explicitPillar || null,
        module: typeof requestedModule === "string" ? requestedModule : null,
        requestId,
      });

      const result = await runNorthStarAI({
        userId,
        message: userMessage,
        explicitPillar,
        requestContext,
        lastMessages: [],
      });

      const reply =
        result?.text || result?.response || result?.reply || result?.message;

      const saveSummary = result?.meta?.saveSummary || null;

      const ok = Boolean(result?.ok);

      if (!reply) {
        return res.status(200).json({
          success: false,
          ok: false,
          error: result?.message || "AI temporarily unavailable",
          reply: FALLBACK_REPLY,
          pillar: result?.pillar || explicitPillar || null,
          agent: result?.agent || null,
          module: requestedModule || null,
          saveSummary,
        });
      }

      if (!ok) {
        return res.status(200).json({
          success: false,
          ok: false,
          error: result?.message || "AI temporarily unavailable",
          reply,
          pillar: result?.pillar || explicitPillar || null,
          agent: result?.agent || null,
          module: requestedModule || null,
          saveSummary,
        });
      }

      return res.status(200).json({
        success: true,
        ok: true,
        reply,
        pillar: result?.pillar || explicitPillar || null,
        agent: result?.agent || null,
        module: requestedModule || null,
        saveSummary,
      });
    } catch (err) {
      console.info("[AI][unified.chat] orchestrator error", {
        message: err?.message,
        name: err?.name,
        requestId,
      });
      return res.status(200).json({
        success: false,
        ok: false,
        error: err?.message || "AI provider failure",
        reply: FALLBACK_REPLY,
      });
    }
  })
);

// Apply auth and consent middleware to remaining routes
router.use(authRequired);
router.use(requireSensitiveConsent);

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
 * Structured AI provider health check
 */
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    try {
      const health = await getProviderHealth();

      return res.json({
        server: "ok",
        ai_provider_present: health.aiProviderPresent,
        ai_provider_status: health.aiProviderStatus,
        last_provider_check: health.lastProviderCheck,
      });
    } catch (error) {
      return res.status(503).json({
        server: "error",
        ai_provider_present: false,
        ai_provider_status: "error",
        last_provider_check: new Date().toISOString(),
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  })
);

export default router;
