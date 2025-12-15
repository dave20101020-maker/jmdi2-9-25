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
import { startAssessmentSession } from "../src/assessments/assessmentSessions.js";

const router = express.Router();

// NOTE: Auth/consent middleware is applied AFTER /chat for now.
// /chat is temporarily unauthenticated to make AI responses deterministic.

const providerKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
const hasAnyLlmKey = Boolean(
  providerKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
);
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

function sseWrite(res, event, data) {
  if (!res || res.writableEnded || res.destroyed) return;

  const safeWrite = (chunk) => {
    if (!res || res.writableEnded || res.destroyed) return false;
    try {
      res.write(chunk);
      return true;
    } catch (err) {
      // Common on client disconnects (EPIPE / ERR_STREAM_DESTROYED).
      try {
        res.destroy();
      } catch {}
      return false;
    }
  };

  if (event) {
    if (!safeWrite(`event: ${event}\n`)) return;
  }

  const payload =
    typeof data === "string" ? data : data != null ? JSON.stringify(data) : "";

  const lines = payload.split("\n");
  for (const line of lines) {
    if (!safeWrite(`data: ${line}\n`)) return;
  }
  safeWrite("\n");
}

function normalizePillarId(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  return raw.replace(/-/g, "_");
}

function tryParseCommand(message) {
  const trimmed = String(message || "").trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    const type = String(parsed.type || "").trim();
    if (!type) return null;
    return parsed;
  } catch {
    return null;
  }
}

function detectAssessmentIntent({ message, contextPillar }) {
  const text = String(message || "").toLowerCase();
  const pillar = normalizePillarId(contextPillar) || null;

  // Explicit overlap redirects
  if (text.includes("adhd")) {
    return { pillar: "mental_health", assessmentKey: "ADHD_CHECK" };
  }

  if (
    text.includes("disc") ||
    text.includes("personality test") ||
    text.includes("personality")
  ) {
    return { pillar: "social", assessmentKey: "STYLE_COMPASS" };
  }

  if (
    text.includes("sleep apnea") ||
    text.includes("stop-bang") ||
    text.includes("stop bang")
  ) {
    return { pillar: "sleep", assessmentKey: "STOPBANG" };
  }

  if (
    text.includes("insomnia") ||
    (text.includes("sleep") && text.includes("test"))
  ) {
    return { pillar: "sleep", assessmentKey: "ISI" };
  }

  if (text.includes("sleepiness") || text.includes("daytime sleepy")) {
    return { pillar: "sleep", assessmentKey: "ESS" };
  }

  if (
    text.includes("anxiety") ||
    text.includes("panic") ||
    text.includes("stress test")
  ) {
    return { pillar: "mental_health", assessmentKey: "GAD7" };
  }

  if (
    text.includes("depression") ||
    text.includes("depressed") ||
    text.includes("low mood")
  ) {
    return { pillar: "mental_health", assessmentKey: "PHQ9" };
  }

  if (
    text.includes("memory") ||
    text.includes("cognitive") ||
    text.includes("dementia") ||
    text.includes("brain test")
  ) {
    return { pillar: "neuroshield", assessmentKey: "NEUROSHIELD" };
  }

  // Generic test requests
  const asksForTest =
    /\b(test|tests|assessment|assessments|screening|questionnaire)\b/.test(
      text
    ) ||
    /\bdo i have\b/.test(text) ||
    /\bcan you do\b/.test(text);

  if (!asksForTest) return null;

  // Contextual defaults
  if (pillar === "sleep") return { pillar: "sleep", assessmentKey: "ISI" };
  if (pillar === "mental_health")
    return { pillar: "mental_health", assessmentKey: "WHO5" };
  if (pillar === "neuroshield")
    return { pillar: "neuroshield", assessmentKey: "NEUROSHIELD" };

  return { pillar: "mental_health", assessmentKey: "WHO5" };
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
    const UNIFIED_SAFE_FALLBACK_RESPONSE = {
      success: true,
      ok: true,
      reply:
        "Hi! I'm NorthStar AI. I’m here to help and can guide you step by step.",
      agent: "northstar",
      pillar: "general",
      fallback: true,
    };

    const requestId = newAnonSessionId();
    res.set("x-ns-unified-chat", "1");
    res.set("x-ns-request-id", requestId);

    console.log("[AI][unified.chat] ROUTE_ENTRY", {
      path: req.path,
      ip: req.ip,
      requestId,
    });
    console.log("[AI][unified.chat] BODY", req.body);

    try {
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

      const requestedMode = (requestContext?.mode || "")
        .toString()
        .toLowerCase();
      const requestedContextPillarId = (requestContext?.pillarId || "")
        .toString()
        .toLowerCase();

      // Pillar agents may ONLY respond if explicit pillar_direct context exists.
      const explicitMode = requestedMode === "pillar_direct";
      if (!message || typeof message !== "string" || !message.trim()) {
        console.log("[AI][unified.chat] BEFORE_RES_JSON", {
          requestId,
          reason: "missing_message",
        });
        return res.status(400).json({
          success: false,
          ok: false,
          error: "Message is required",
          message: "Message is required",
        });
      }

      // Provider key is only required for LLM chat. Assessments run locally.
      const likelyAssessmentCommand = Boolean(
        tryParseCommand(message)?.type === "assessment.start"
      );
      const likelyAssessmentIntent = Boolean(
        detectAssessmentIntent({
          message,
          contextPillar:
            requestedMode === "pillar_direct" ? requestedContextPillarId : null,
        })
      );

      if (
        !hasAnyLlmKey &&
        !likelyAssessmentCommand &&
        !likelyAssessmentIntent
      ) {
        console.log("[AI][unified.chat] BEFORE_RES_JSON", {
          requestId,
          reason: "provider_key_missing",
        });
        return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
      }

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

      // --- Assessment engine interception (commands + test intent) ---
      const cmd = tryParseCommand(userMessage);
      if (cmd?.type === "assessment.start") {
        const started = await startAssessmentSession({
          userId,
          pillar: cmd.pillar || requestedContextPillarId || requestedPillar,
          assessmentKey: cmd.assessmentKey,
        });

        if (started?.ok && started.payload) {
          const payloadText = JSON.stringify(started.payload);
          console.log("[AI][unified.chat] BEFORE_RES_JSON", {
            requestId,
            reason: "assessment_command",
            pillar: started.payload.pillar,
            assessmentKey: started.payload.assessmentKey,
          });
          return res.status(200).json({
            success: true,
            ok: true,
            reply: payloadText,
            pillar: started.payload.pillar,
            agent: "assessment_engine",
            module: "assessments",
          });
        }
      }

      const assessmentIntent = detectAssessmentIntent({
        message: userMessage,
        contextPillar:
          requestedMode === "pillar_direct"
            ? requestedContextPillarId || requestedPillar
            : null,
      });

      if (assessmentIntent) {
        const started = await startAssessmentSession({
          userId,
          pillar: assessmentIntent.pillar,
          assessmentKey: assessmentIntent.assessmentKey,
        });

        if (started?.ok && started.payload) {
          const payloadText = JSON.stringify(started.payload);
          console.log("[AI][unified.chat] BEFORE_RES_JSON", {
            requestId,
            reason: "assessment_intent",
            pillar: started.payload.pillar,
            assessmentKey: started.payload.assessmentKey,
          });
          return res.status(200).json({
            success: true,
            ok: true,
            reply: payloadText,
            pillar: started.payload.pillar,
            agent: "assessment_engine",
            module: "assessments",
          });
        }
      }

      console.info("[AI][unified.chat] routing", {
        userId: authUserId === "anonymous" ? "anonymous" : "authenticated",
        requestedMode: requestedMode || null,
        requestedContextPillarId: requestedContextPillarId || null,
        explicitMode,
        explicitPillar: explicitPillar || null,
        module: typeof requestedModule === "string" ? requestedModule : null,
        requestId,
      });

      console.log("[AI][unified.chat] BEFORE_NORTHSTAR_ORCHESTRATOR", {
        requestId,
        explicitPillar: explicitPillar || null,
        requestedMode: requestedMode || null,
        requestedContextPillarId: requestedContextPillarId || null,
      });
      const result = await runNorthStarAI({
        userId,
        message: userMessage,
        explicitPillar,
        requestContext,
        lastMessages: [],
      });

      console.log("[AI][unified.chat] AFTER_NORTHSTAR_ORCHESTRATOR", {
        requestId,
        ok: Boolean(result?.ok),
        pillar: result?.pillar || null,
        agent: result?.agent || null,
      });

      const reply =
        result?.text || result?.response || result?.reply || result?.message;

      const saveSummary = result?.meta?.saveSummary || null;

      const ok = Boolean(result?.ok);

      const rateLimitedAll = Boolean(
        result?.meta?.rateLimitedAll || result?.rateLimitedAll
      );

      if (rateLimitedAll) {
        console.log("[AI][unified.chat] BEFORE_RES_JSON", {
          requestId,
          reason: "rate_limited_all",
        });
        return res.status(200).json({
          success: false,
          ok: false,
          reply:
            reply ||
            "NorthStar AI is busy right now. Please try again in about a minute.",
          pillar: result?.pillar || explicitPillar || "general",
          agent: result?.agent || null,
          module: requestedModule || null,
          saveSummary,
        });
      }

      // Deterministic fallback semantics:
      // - Never return { success:false } alongside a reply.
      // - If provider routing fails, still return success:true with a safe fallback reply.
      if (!reply || !ok) {
        console.log("[AI][unified.chat] BEFORE_RES_JSON", {
          requestId,
          reason: !reply ? "missing_reply" : "degraded_fallback",
        });

        return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
      }

      console.log("[AI][unified.chat] BEFORE_RES_JSON", {
        requestId,
        reason: "success",
      });
      return res.status(200).json({
        success: true,
        ok: true,
        reply,
        pillar: result?.pillar || explicitPillar || null,
        agent: result?.agent || null,
        module: requestedModule || null,
        saveSummary,
      });
    } catch (error) {
      console.error("[AI][unified.chat] AI_ROUTE_CRASH", error);
      console.error("[AI][unified.chat] AI_ROUTE_CRASH_STACK", error?.stack);
      return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
    }

    // Final safety return (should be unreachable)
    return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
  })
);

/**
 * POST /api/ai/unified/chat/stream
 * SSE streaming variant of /chat.
 *
 * Emits:
 * - event: token (string delta)
 * - event: meta (final JSON: { ok, pillar, agent, provider, module, saveSummary })
 * - event: done
 */
router.post(
  "/chat/stream",
  aiRateLimitMiddleware,
  sanitizationMiddleware,
  asyncHandler(async (req, res) => {
    const UNIFIED_SAFE_FALLBACK_RESPONSE = {
      success: true,
      ok: true,
      reply:
        "Hi! I'm NorthStar AI. I’m here to help and can guide you step by step.",
      agent: "northstar",
      pillar: "general",
      fallback: true,
    };

    const requestId = newAnonSessionId();
    res.set("x-ns-unified-chat", "1");
    res.set("x-ns-request-id", requestId);
    try {
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

      const requestedMode = (requestContext?.mode || "")
        .toString()
        .toLowerCase();
      const requestedContextPillarId = (requestContext?.pillarId || "")
        .toString()
        .toLowerCase();

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          success: false,
          ok: false,
          error: "Message is required",
          message: "Message is required",
        });
      }

      // Provider key is only required for LLM chat. Assessments run locally.
      const likelyAssessmentCommand = Boolean(
        tryParseCommand(message)?.type === "assessment.start"
      );
      const likelyAssessmentIntent = Boolean(
        detectAssessmentIntent({
          message,
          contextPillar:
            requestedMode === "pillar_direct" ? requestedContextPillarId : null,
        })
      );

      if (!providerKey && !likelyAssessmentCommand && !likelyAssessmentIntent) {
        return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
      }

      const authUserId =
        req.user?._id?.toString?.() || req.user?.id || "anonymous";

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

      // Deterministic guard:
      // - pillar_direct => force requested pillar
      // - anything else => force NorthStar (general)
      let explicitPillar;
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

      // --- Assessment engine interception (commands + test intent) ---
      const cmd = tryParseCommand(userMessage);
      if (cmd?.type === "assessment.start") {
        const started = await startAssessmentSession({
          userId,
          pillar: cmd.pillar || requestedContextPillarId || requestedPillar,
          assessmentKey: cmd.assessmentKey,
        });

        if (started?.ok && started.payload) {
          const payloadText = JSON.stringify(started.payload);
          return res.status(200).json({
            success: true,
            ok: true,
            reply: payloadText,
            pillar: started.payload.pillar,
            agent: "assessment_engine",
            module: "assessments",
          });
        }
      }

      const assessmentIntent = detectAssessmentIntent({
        message: userMessage,
        contextPillar:
          requestedMode === "pillar_direct"
            ? requestedContextPillarId || requestedPillar
            : null,
      });

      if (assessmentIntent) {
        const started = await startAssessmentSession({
          userId,
          pillar: assessmentIntent.pillar,
          assessmentKey: assessmentIntent.assessmentKey,
        });

        if (started?.ok && started.payload) {
          const payloadText = JSON.stringify(started.payload);
          return res.status(200).json({
            success: true,
            ok: true,
            reply: payloadText,
            pillar: started.payload.pillar,
            agent: "assessment_engine",
            module: "assessments",
          });
        }
      }

      const result = await runNorthStarAI({
        userId,
        message: userMessage,
        explicitPillar,
        requestContext,
        lastMessages: [],
      });

      const reply =
        result?.text || result?.response || result?.reply || result?.message;
      const ok = Boolean(result?.ok);

      if (!ok || !reply) {
        return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
      }

      return res.status(200).json({
        success: true,
        ok: true,
        reply,
        pillar: result?.pillar || explicitPillar || null,
        agent: result?.agent || null,
        module: requestedModule || null,
      });
    } catch (error) {
      console.error("[AI][unified.chat.stream] AI_ROUTE_CRASH", error);
      return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
    }

    // Final safety return (should be unreachable)
    return res.status(200).json(UNIFIED_SAFE_FALLBACK_RESPONSE);
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
