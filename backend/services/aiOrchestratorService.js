/**
 * AI Orchestrator Service
 *
 * Service layer for unified AI orchestrator.
 * Provides clean interface for controllers and routes.
 */

import {
  orchestrateAI,
  orchestrateWorkflow,
  AI_MODULES,
  getAvailableModules,
} from "../src/ai/orchestrator/unifiedOrchestrator.js";
import { loadMemory, saveMemory } from "../src/ai/orchestrator/memoryStore.js";
import { callProviderWithResilience } from "../src/services/aiProviderWrapper.js";
import User from "../models/User.js";
import PillarCheckIn from "../models/PillarCheckIn.js";
import Habit from "../models/Habit.js";
import logger from "../utils/logger.js";

const runWithResilience = (label, fn) => callProviderWithResilience(label, fn);

/**
 * Process AI chat message with unified orchestrator
 */
export async function processAIChat({
  userId,
  message,
  pillar = null,
  module = null,
  options = {},
}) {
  try {
    // Load user data for context
    const [user, recentCheckIns, habits] = await Promise.all([
      User.findById(userId).lean(),
      PillarCheckIn.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Habit.find({ userId, isActive: true }).lean(),
    ]);

    // Build context
    const context = {
      userProfile: user,
      recentCheckIns,
      habits,
      allowedPillars: user?.allowedPillars || [],
    };

    // Orchestrate AI response
    const result = await runWithResilience("processAIChat", () =>
      orchestrateAI({
        userId: userId.toString(),
        message,
        pillar,
        module,
        context,
        options,
      })
    );

    return result;
  } catch (error) {
    logger.error("AI Chat processing error", {
      userId,
      error: error.message,
      stack: error.stack,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to process AI chat request",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };
  }
}

/**
 * Generate personalized journaling prompt
 */
export async function generateJournalingPrompt({
  userId,
  promptType = "reflection",
  customMessage = null,
}) {
  try {
    const message =
      customMessage || `Generate a ${promptType} journaling prompt`;

    const result = await runWithResilience("generateJournalingPrompt", () =>
      orchestrateAI({
        userId: userId.toString(),
        message,
        module: AI_MODULES.JOURNALING_AGENT,
        options: { promptType },
        context: { skipCrisisCheck: true },
      })
    );

    return result;
  } catch (error) {
    logger.error("Journaling prompt generation error", {
      userId,
      promptType,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to generate journaling prompt",
    };
  }
}

/**
 * Generate adaptive wellness plan
 */
export async function generateAdaptivePlan({
  userId,
  focus = "overall wellness",
  timeframe = "week",
}) {
  try {
    // Load comprehensive user data
    const [user, checkIns, habits, assessments] = await Promise.all([
      User.findById(userId).lean(),
      PillarCheckIn.find({ userId }).sort({ createdAt: -1 }).limit(30).lean(),
      Habit.find({ userId, isActive: true }).lean(),
      // Add assessment model query when available
      Promise.resolve([]),
    ]);

    const message = `Create a ${timeframe} wellness plan focusing on ${focus}`;

    const result = await runWithResilience("generateAdaptivePlan", () =>
      orchestrateAI({
        userId: userId.toString(),
        message,
        module: AI_MODULES.ADAPTIVE_PLANNER,
        context: {
          skipCrisisCheck: true,
          assessments,
          recentCheckIns: checkIns,
          habits,
          goals: [], // Add goals when available
          userProfile: user,
        },
      })
    );

    return result;
  } catch (error) {
    logger.error("Adaptive plan generation error", {
      userId,
      focus,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to generate adaptive plan",
    };
  }
}

/**
 * Analyze wellness correlations
 */
export async function analyzeCorrelations({ userId, timeframe = 30 }) {
  try {
    // Load data for correlation analysis
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframe);

    const [checkIns, habits] = await Promise.all([
      PillarCheckIn.find({
        userId,
        createdAt: { $gte: cutoffDate },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Habit.find({ userId, isActive: true }).lean(),
    ]);

    // Extract sleep and mood data from check-ins
    const sleepData = checkIns
      .filter((ci) => ci.pillar === "sleep")
      .map((ci) => ({ date: ci.createdAt, score: ci.score, data: ci.data }));

    const moodData = checkIns
      .filter((ci) => ci.pillar === "mental_health")
      .map((ci) => ({ date: ci.createdAt, score: ci.score, data: ci.data }));

    const result = await runWithResilience("analyzeCorrelations", () =>
      orchestrateAI({
        userId: userId.toString(),
        message: "Analyze my wellness patterns and correlations",
        module: AI_MODULES.CORRELATION_ENGINE,
        context: {
          skipCrisisCheck: true,
          checkIns,
          habits,
          sleepData,
          moodData,
        },
      })
    );

    return result;
  } catch (error) {
    logger.error("Correlation analysis error", {
      userId,
      timeframe,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to analyze correlations",
    };
  }
}

/**
 * Generate micro-actions for a pillar
 */
export async function generateMicroActionsForPillar({ userId, pillar }) {
  try {
    const result = await runWithResilience(
      "generateMicroActionsForPillar",
      () =>
        orchestrateAI({
          userId: userId.toString(),
          message: `Generate quick actions for ${pillar}`,
          module: AI_MODULES.MICRO_ACTIONS,
          pillar,
          context: { skipCrisisCheck: true },
        })
    );

    return result;
  } catch (error) {
    logger.error("Micro-actions generation error", {
      userId,
      pillar,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to generate micro-actions",
    };
  }
}

/**
 * Execute multi-step wellness workflow
 */
export async function executeWellnessWorkflow({ userId, workflowType }) {
  try {
    let workflow = [];

    switch (workflowType) {
      case "morning_routine":
        workflow = [
          {
            name: "Morning Check-in",
            module: AI_MODULES.MENTAL_HEALTH_COACH,
            message: "How am I feeling this morning?",
          },
          {
            name: "Daily Intentions",
            module: AI_MODULES.JOURNALING_AGENT,
            message: "Generate a morning intention prompt",
          },
          {
            name: "Quick Actions",
            module: AI_MODULES.MICRO_ACTIONS,
            message: "What quick actions can I do this morning?",
          },
        ];
        break;

      case "evening_reflection":
        workflow = [
          {
            name: "Day Review",
            module: AI_MODULES.JOURNALING_AGENT,
            message: "Generate an evening reflection prompt",
          },
          {
            name: "Gratitude",
            module: AI_MODULES.JOURNALING_AGENT,
            message: "Generate a gratitude prompt",
          },
          {
            name: "Sleep Preparation",
            module: AI_MODULES.SLEEP_COACH,
            message: "Help me prepare for good sleep tonight",
          },
        ];
        break;

      case "wellness_assessment":
        workflow = [
          {
            name: "Analyze Patterns",
            module: AI_MODULES.CORRELATION_ENGINE,
            message: "Analyze my recent wellness patterns",
          },
          {
            name: "Create Plan",
            module: AI_MODULES.ADAPTIVE_PLANNER,
            message: "Create a personalized plan based on my patterns",
          },
        ];
        break;

      default:
        throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    // Load user context
    const [user, checkIns] = await Promise.all([
      User.findById(userId).lean(),
      PillarCheckIn.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const result = await runWithResilience("executeWellnessWorkflow", () =>
      orchestrateWorkflow({
        userId: userId.toString(),
        workflow,
        context: {
          userProfile: user,
          recentCheckIns: checkIns,
        },
      })
    );

    return result;
  } catch (error) {
    logger.error("Workflow execution error", {
      userId,
      workflowType,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to execute wellness workflow",
    };
  }
}

/**
 * Get AI module information
 */
export async function getAIModuleInfo() {
  return {
    modules: getAvailableModules(),
    workflows: [
      {
        id: "morning_routine",
        name: "Morning Routine",
        description: "Start your day with intention",
        steps: 3,
      },
      {
        id: "evening_reflection",
        name: "Evening Reflection",
        description: "Reflect and prepare for rest",
        steps: 3,
      },
      {
        id: "wellness_assessment",
        name: "Wellness Assessment",
        description: "Analyze patterns and create a plan",
        steps: 2,
      },
    ],
  };
}

/**
 * Get user's AI memory summary
 */
export async function getAIMemorySummary(userId) {
  try {
    const memory = await loadMemory(userId.toString());

    if (!memory || !memory.pillars) {
      return {
        ok: true,
        pillars: {},
        conversationCount: 0,
      };
    }

    const summary = {
      ok: true,
      pillars: {},
      conversationCount: 0,
    };

    Object.keys(memory.pillars).forEach((pillar) => {
      const pillarData = memory.pillars[pillar];
      const conversations = pillarData.conversationHistory || [];

      summary.pillars[pillar] = {
        conversationCount: conversations.length,
        lastInteraction:
          conversations.length > 0
            ? conversations[conversations.length - 1].timestamp
            : null,
      };

      summary.conversationCount += conversations.length;
    });

    return summary;
  } catch (error) {
    logger.error("Memory summary error", {
      userId,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to retrieve memory summary",
    };
  }
}

/**
 * Reset user's AI memory
 */
export async function resetAIMemory(userId) {
  try {
    await saveMemory(userId.toString(), {
      pillars: {},
      lastUpdated: new Date().toISOString(),
    });

    return {
      ok: true,
      message: "AI memory reset successfully",
    };
  } catch (error) {
    logger.error("Memory reset error", {
      userId,
      error: error.message,
    });

    return {
      ok: false,
      error: true,
      message: "Failed to reset memory",
    };
  }
}

export default {
  processAIChat,
  generateJournalingPrompt,
  generateAdaptivePlan,
  analyzeCorrelations,
  generateMicroActionsForPillar,
  executeWellnessWorkflow,
  getAIModuleInfo,
  getAIMemorySummary,
  resetAIMemory,
};
