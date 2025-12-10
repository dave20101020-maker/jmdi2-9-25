/**
 * AI Chat Routes
 * Integrates NorthStar orchestrator with Express
 *
 * Endpoints:
 * - POST /api/ai/chat - Main chat endpoint
 * - GET /api/ai/health - Health check
 * - POST /api/ai/reset - Reset user memory (dev only)
 */

import express from "express";
import { z } from "zod";
import { runNorthStarAI } from "../src/ai/orchestrator/northstarOrchestrator.js";
import { aiRateLimitMiddleware } from "../middleware/rateLimiter.js";
import { sanitizationMiddleware } from "../middleware/sanitization.js";
import {
  authRequired,
  requireFeatureAccess,
} from "../middleware/authMiddleware.js";
import { requireSensitiveConsent } from "../middleware/consentGuard.js";
import { memoryStore } from "../src/ai/orchestrator/memoryStore.js";
import asyncHandler from "../utils/asyncHandler.js";
import { FEATURE_KEYS } from "../utils/entitlements.js";
import { validate } from "../middleware/validate.js";
import { recordEvent } from "../utils/eventLogger.js";
import { applyAiDisclaimer } from "../src/ai/disclaimer.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authRequired);
router.use(requireSensitiveConsent);

const getAuthenticatedUserId = (req) => req.user?._id?.toString();

/**
 * Health check endpoint (no rate limiting)
 */
router.get(
  "/health",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  (req, res) => {
    res.json({
      ok: true,
      service: "NorthStar AI",
      status: "operational",
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Main chat endpoint
 *
 * POST /api/ai/chat
 *
 * Request body:
 * {
 *   message: string (required) - User message
 *   pillar?: string - Specific pillar (optional)
 *   explicitMode?: boolean - Skip pillar detection (optional)
 * }
 *
 * Response:
 * {
 *   ok: true/false
 *   agent?: string - Which agent responded
 *   pillar?: string - Detected/used pillar
 *   response: string - AI response
 *   memory?: object - Updated memory state (optional)
 *   rateLimit?: object - Rate limit info
 *   error?: string - Error message if ok is false
 * }
 */
router.post(
  "/chat",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  aiRateLimitMiddleware,
  sanitizationMiddleware,
  validate({
    body: z.object({
      message: z.string().min(1),
      pillar: z.string().optional(),
      explicitMode: z.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { message, pillar, explicitMode } = req.body;
    const userId = getAuthenticatedUserId(req);

    // Validate required fields
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid message field",
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Message cannot be empty",
      });
    }

    try {
      // Load user memory
      const memory = await memoryStore.loadMemory(userId);

      // Get previous messages for context
      let lastMessages = [];
      if (memory && pillar) {
        const history = memoryStore.getConversationHistory(memory, pillar);
        lastMessages = history;
      }

      // Run orchestrator (which handles its own error catching)
      const result = await runNorthStarAI({
        userId,
        message,
        lastMessages,
        explicitPillar: pillar,
        memory,
        appItems: undefined, // Could be loaded from database
      });

      if (!result.ok && result.error) {
        // AI unavailable - return fallback response
        return res.status(503).json({
          ok: false,
          error: result.error,
          message: result.message,
          agent: result.agent,
          pillar: result.pillar,
        });
      }

      // Save updated memory
      const updatedMemory = result.memory || memory;
      if (updatedMemory && !result.error) {
        try {
          await memoryStore.saveMemory(userId, updatedMemory);
        } catch (saveError) {
          console.error("Memory save error:", saveError);
          // Don't fail the response
        }
      }

      // Success response
      const responseBody = applyAiDisclaimer({
        ok: true,
        agent: result.agent,
        pillar: result.pillar,
        response: result.text,
        memory: updatedMemory
          ? {
              pillarNames: Object.keys(updatedMemory),
              lastUpdated: new Date().toISOString(),
            }
          : undefined,
        rateLimit: req.rateLimit,
      });

      await recordEvent("ai_chat_engagement", {
        userId,
        source: "api/ai/chat",
        ip: req.ip,
        payload: {
          pillar: result.pillar,
          agent: result.agent,
          explicitMode: !!explicitMode,
        },
      });

      return res.json(responseBody);
    } catch (error) {
      console.error("AI chat error:", error);

      // Return fallback response on unexpected errors
      res.status(503).json({
        ok: false,
        error: true,
        message: "AI temporarily unavailable",
        agent: null,
      });
    }
  })
);

/**
 * Get user memory (dev endpoint)
 *
 * GET /api/orchestrator/memory
 */
router.get(
  "/memory",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  asyncHandler(async (req, res) => {
    const userId = getAuthenticatedUserId(req);

    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        ok: false,
        error: "Not available in production",
      });
    }

    try {
      const memory = await memoryStore.loadMemory(userId);
      res.json({
        ok: true,
        userId,
        memory: memory || {},
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error.message,
      });
    }
  })
);

/**
 * Reset user memory (dev endpoint)
 *
 * POST /api/orchestrator/reset
 */
router.post(
  "/reset",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  asyncHandler(async (req, res) => {
    const userId = getAuthenticatedUserId(req);

    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        ok: false,
        error: "Not available in production",
      });
    }

    try {
      memoryStore.clearMemory(userId);
      res.json({
        ok: true,
        message: "Memory cleared",
        userId,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error.message,
      });
    }
  })
);

/**
 * Get agent info (helpful for frontend)
 *
 * GET /api/ai/agents
 */
router.get(
  "/agents",
  requireFeatureAccess(FEATURE_KEYS.AI_CHAT),
  (req, res) => {
    const agents = {
      sleep: {
        name: "Dr. Luna",
        pillar: "sleep",
        icon: "🌙",
        description: "Sleep quality and recovery specialist",
        capabilities: [
          "Sleep schedule optimization",
          "Circadian rhythm alignment",
          "Sleep environment assessment",
          "Recovery tracking",
        ],
      },
      mentalHealth: {
        name: "Dr. Serenity",
        pillar: "mentalHealth",
        icon: "🧠",
        description: "Mental health and emotional wellness coach",
        capabilities: [
          "Mood tracking",
          "Stress assessment",
          "Emotional regulation",
          "Crisis support",
          "Cognitive reframing",
        ],
      },
      nutrition: {
        name: "Chef Nourish",
        pillar: "nutrition",
        icon: "🥗",
        description: "Personalized nutrition expert",
        capabilities: [
          "Macronutrient optimization",
          "Meal planning",
          "Food preferences",
          "Restaurant recommendations",
          "Craving management",
        ],
      },
      fitness: {
        name: "Coach Atlas",
        pillar: "fitness",
        icon: "💪",
        description: "Explosive fitness and training specialist",
        capabilities: [
          "Program design",
          "Performance tracking",
          "Injury prevention",
          "Progressive overload",
          "Exercise modifications",
        ],
      },
      physicalHealth: {
        name: "Dr. Vitality",
        pillar: "physicalHealth",
        icon: "⚕️",
        description: "Comprehensive physical health management",
        capabilities: [
          "Health screening",
          "Risk assessment",
          "Disease prevention",
          "Biomarker tracking",
          "Longevity optimization",
        ],
      },
      finances: {
        name: "Adviser Prosper",
        pillar: "finances",
        icon: "💰",
        description: "Wealth-building and financial advisor",
        capabilities: [
          "Budget optimization",
          "Debt reduction",
          "Investment strategy",
          "Wealth tracking",
          "Financial goal planning",
        ],
      },
      social: {
        name: "Coach Connect",
        pillar: "social",
        icon: "🤝",
        description: "Connection and relationship specialist",
        capabilities: [
          "Social circle mapping",
          "Conversation skills",
          "Boundary setting",
          "Relationship building",
          "Community engagement",
        ],
      },
      spirituality: {
        name: "Guide Zenith",
        pillar: "spirituality",
        icon: "✨",
        description: "Purpose, meaning, and contemplative wisdom",
        capabilities: [
          "Values clarification",
          "Purpose discovery",
          "Mindfulness practices",
          "Meaning-making",
          "Spiritual growth",
        ],
      },
    };

    res.json({
      ok: true,
      agents,
      count: Object.keys(agents).length,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
