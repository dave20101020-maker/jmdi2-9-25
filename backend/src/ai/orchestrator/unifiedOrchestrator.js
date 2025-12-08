/**
 * Unified AI Orchestrator
 *
 * Central integration point for all AI modules:
 * - Sleep Coach
 * - Mental Health Coach
 * - Diet Coach
 * - Correlation Engine
 * - Journaling Agent
 * - Crisis Response Handler
 * - Adaptive Planner
 *
 * This orchestrator routes requests to the appropriate module and coordinates
 * multi-module workflows when needed.
 */

import { SleepCoachAgent } from "../agents/sleepCoachAgent.js";
import { MentalHealthCoachAgent } from "../agents/mentalHealthCoachAgent.js";
import { runNutritionAgent } from "../agents/nutritionAgent.js";
import { runFitnessAgent } from "../agents/fitnessAgent.js";
import { runPhysicalHealthAgent } from "../agents/physicalHealthAgent.js";
import { runFinancesAgent } from "../agents/financesAgent.js";
import { runSocialAgent } from "../agents/socialAgent.js";
import { runSpiritualityAgent } from "../agents/spiritualityAgent.js";
import { performCrisisCheck } from "./crisisCheck.js";
import { generateMicroActions } from "../agents/microActionsEngine.js";
import { routeCompletion, MODELS } from "../modelRouter.js";
import {
  loadMemory,
  saveMemory,
  updateConversationHistory,
} from "./memoryStore.js";
import logger from "../../utils/logger.js";

/**
 * AI Module Registry
 * Maps module types to their implementations
 */
const AI_MODULES = {
  // Coach Agents
  SLEEP_COACH: "sleep_coach",
  MENTAL_HEALTH_COACH: "mental_health_coach",
  DIET_COACH: "diet_coach",
  FITNESS_COACH: "fitness_coach",
  PHYSICAL_HEALTH_COACH: "physical_health_coach",
  FINANCES_COACH: "finances_coach",
  SOCIAL_COACH: "social_coach",
  SPIRITUALITY_COACH: "spirituality_coach",

  // Specialized Engines
  CRISIS_HANDLER: "crisis_handler",
  CORRELATION_ENGINE: "correlation_engine",
  JOURNALING_AGENT: "journaling_agent",
  ADAPTIVE_PLANNER: "adaptive_planner",
  MICRO_ACTIONS: "micro_actions",
};

/**
 * Pillar to Coach Mapping
 */
const PILLAR_TO_COACH = {
  sleep: AI_MODULES.SLEEP_COACH,
  mental_health: AI_MODULES.MENTAL_HEALTH_COACH,
  diet: AI_MODULES.DIET_COACH,
  nutrition: AI_MODULES.DIET_COACH,
  exercise: AI_MODULES.FITNESS_COACH,
  fitness: AI_MODULES.FITNESS_COACH,
  physical_health: AI_MODULES.PHYSICAL_HEALTH_COACH,
  finances: AI_MODULES.FINANCES_COACH,
  social: AI_MODULES.SOCIAL_COACH,
  relationships: AI_MODULES.SOCIAL_COACH,
  spirituality: AI_MODULES.SPIRITUALITY_COACH,
};

/**
 * Initialize AI agent instances
 */
const agentInstances = {
  sleepCoach: new SleepCoachAgent(),
  mentalHealthCoach: new MentalHealthCoachAgent(),
};

/**
 * Main Unified Orchestrator Function
 * Routes requests to appropriate AI modules
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.message - User message
 * @param {string} [params.module] - Specific module to use (optional)
 * @param {string} [params.pillar] - Specific pillar (optional)
 * @param {Object} [params.context] - Additional context
 * @param {Object} [params.options] - Module-specific options
 * @returns {Promise<Object>} Orchestrated response
 */
export async function orchestrateAI({
  userId,
  message,
  module = null,
  pillar = null,
  context = {},
  options = {},
}) {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error("userId is required");
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new Error("Valid message is required");
    }

    // Load user memory
    const memory = context.memory || (await loadMemory(userId));

    // STEP 1: Crisis Check (always runs first unless explicitly disabled)
    if (context.skipCrisisCheck !== true) {
      const crisisCheck = await performCrisisCheck(message);
      if (crisisCheck.isCrisis) {
        logger.warn(`Crisis detected for user ${userId}`, {
          severity: crisisCheck.severity,
          type: crisisCheck.type,
        });

        return {
          ok: true,
          module: AI_MODULES.CRISIS_HANDLER,
          isCrisis: true,
          severity: crisisCheck.severity,
          response: crisisCheck.message,
          resources: crisisCheck.resources,
          metadata: {
            crisisType: crisisCheck.type,
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // STEP 2: Determine which module to use
    let selectedModule = module;

    if (!selectedModule) {
      // If pillar provided, map to coach
      if (pillar) {
        selectedModule =
          PILLAR_TO_COACH[pillar] || AI_MODULES.MENTAL_HEALTH_COACH;
      } else {
        // Route based on message content
        selectedModule = await routeToModule(message, context);
      }
    }

    // STEP 3: Execute the appropriate module
    const result = await executeModule({
      module: selectedModule,
      userId,
      message,
      pillar: pillar || inferPillarFromModule(selectedModule),
      memory,
      context,
      options,
    });

    // STEP 4: Update memory with conversation
    if (result.ok && result.response && !result.skipMemory) {
      const pillarForMemory =
        result.pillar || pillar || inferPillarFromModule(selectedModule);
      updateConversationHistory(
        memory,
        pillarForMemory,
        message,
        result.response
      );

      try {
        await saveMemory(userId, memory);
      } catch (memoryError) {
        logger.error("Failed to save memory", {
          userId,
          error: memoryError.message,
        });
        // Don't fail the response
      }
    }

    return {
      ...result,
      module: selectedModule,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Unified orchestrator error", {
      userId,
      error: error.message,
      stack: error.stack,
    });

    return {
      ok: false,
      error: true,
      message: "AI service temporarily unavailable",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };
  }
}

/**
 * Route message to appropriate module using AI
 */
async function routeToModule(message, context = {}) {
  try {
    const routingPrompt = `Analyze this user message and determine which wellness module should handle it.

User message: "${message}"

Available modules:
- sleep_coach: Sleep issues, insomnia, circadian rhythm, sleep hygiene
- mental_health_coach: Stress, anxiety, mood, emotions, mindfulness, mental wellbeing
- diet_coach: Nutrition, diet, eating habits, meal planning, food choices
- fitness_coach: Exercise, workouts, physical activity, movement
- physical_health_coach: General health, symptoms, medical concerns, recovery
- finances_coach: Money, budgeting, spending, savings, financial goals
- social_coach: Relationships, social connections, communication, loneliness
- spirituality_coach: Purpose, meaning, values, personal growth, meditation
- journaling_agent: Journaling prompts, reflection, self-expression
- adaptive_planner: Goal setting, habit planning, personalized strategies

Respond with ONLY the module name. Nothing else.`;

    const response = await routeCompletion({
      model: MODELS.GPT35_TURBO,
      messages: [
        {
          role: "system",
          content:
            "You are a routing assistant. Analyze user messages and select the most appropriate wellness module.",
        },
        {
          role: "user",
          content: routingPrompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 20,
    });

    const moduleName = response.content.trim().toLowerCase();

    // Validate and return
    if (Object.values(AI_MODULES).includes(moduleName)) {
      return moduleName;
    }

    // Default to mental health coach for general queries
    return AI_MODULES.MENTAL_HEALTH_COACH;
  } catch (error) {
    logger.error("Module routing error", { error: error.message });
    return AI_MODULES.MENTAL_HEALTH_COACH;
  }
}

/**
 * Execute specific AI module
 */
async function executeModule({
  module,
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  try {
    switch (module) {
      case AI_MODULES.SLEEP_COACH:
        return await executeSleepCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.MENTAL_HEALTH_COACH:
        return await executeMentalHealthCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.DIET_COACH:
        return await executeDietCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.FITNESS_COACH:
        return await executeFitnessCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.PHYSICAL_HEALTH_COACH:
        return await executePhysicalHealthCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.FINANCES_COACH:
        return await executeFinancesCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.SOCIAL_COACH:
        return await executeSocialCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.SPIRITUALITY_COACH:
        return await executeSpiritualityCoach({
          userId,
          message,
          pillar,
          memory,
          context,
          options,
        });

      case AI_MODULES.JOURNALING_AGENT:
        return await executeJournalingAgent({
          userId,
          message,
          context,
          options,
        });

      case AI_MODULES.ADAPTIVE_PLANNER:
        return await executeAdaptivePlanner({
          userId,
          message,
          context,
          options,
        });

      case AI_MODULES.CORRELATION_ENGINE:
        return await executeCorrelationEngine({ userId, context, options });

      case AI_MODULES.MICRO_ACTIONS:
        return await executeMicroActions({ userId, pillar, context, options });

      default:
        throw new Error(`Unknown module: ${module}`);
    }
  } catch (error) {
    logger.error(`Module execution error: ${module}`, { error: error.message });
    throw error;
  }
}

/**
 * Execute Sleep Coach
 */
async function executeSleepCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const agent = agentInstances.sleepCoach;
  const result = await agent.process({
    userMessage: message,
    context: {
      userId,
      pillar: pillar || "sleep",
      memory: memory?.pillars?.sleep || {},
      ...context,
    },
    options,
  });

  return {
    ok: true,
    response: result.content,
    pillar: "sleep",
    metadata: {
      model: result.model,
      provider: result.provider,
      usage: result.usage,
    },
  };
}

/**
 * Execute Mental Health Coach
 */
async function executeMentalHealthCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const agent = agentInstances.mentalHealthCoach;
  const result = await agent.process({
    userMessage: message,
    context: {
      userId,
      pillar: pillar || "mental_health",
      memory: memory?.pillars?.mental_health || {},
      ...context,
    },
    options,
  });

  return {
    ok: true,
    response: result.content,
    pillar: "mental_health",
    metadata: {
      model: result.model,
      provider: result.provider,
      usage: result.usage,
    },
  };
}

/**
 * Execute Diet/Nutrition Coach
 */
async function executeDietCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const result = await runNutritionAgent({
    context: {
      userId,
      pillar: pillar || "diet",
      memory: memory?.pillars?.diet || {},
      ...context,
    },
    userMessage: message,
    lastMessages: context.lastMessages || [],
  });

  return {
    ok: true,
    response: result.text,
    pillar: "diet",
    metadata: {
      model: result.model,
      meta: result.meta,
    },
  };
}

/**
 * Execute Fitness Coach
 */
async function executeFitnessCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const result = await runFitnessAgent({
    context: {
      userId,
      pillar: pillar || "exercise",
      memory: memory?.pillars?.exercise || {},
      ...context,
    },
    userMessage: message,
    lastMessages: context.lastMessages || [],
  });

  return {
    ok: true,
    response: result.text,
    pillar: "exercise",
    metadata: {
      model: result.model,
      meta: result.meta,
    },
  };
}

/**
 * Execute Physical Health Coach
 */
async function executePhysicalHealthCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const result = await runPhysicalHealthAgent({
    context: {
      userId,
      pillar: pillar || "physical_health",
      memory: memory?.pillars?.physical_health || {},
      ...context,
    },
    userMessage: message,
    lastMessages: context.lastMessages || [],
  });

  return {
    ok: true,
    response: result.text,
    pillar: "physical_health",
    metadata: {
      model: result.model,
      meta: result.meta,
    },
  };
}

/**
 * Execute Finances Coach
 */
async function executeFinancesCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const result = await runFinancesAgent({
    context: {
      userId,
      pillar: pillar || "finances",
      memory: memory?.pillars?.finances || {},
      ...context,
    },
    userMessage: message,
    lastMessages: context.lastMessages || [],
  });

  return {
    ok: true,
    response: result.text,
    pillar: "finances",
    metadata: {
      model: result.model,
      meta: result.meta,
    },
  };
}

/**
 * Execute Social Coach
 */
async function executeSocialCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const result = await runSocialAgent({
    context: {
      userId,
      pillar: pillar || "social",
      memory: memory?.pillars?.social || {},
      ...context,
    },
    userMessage: message,
    lastMessages: context.lastMessages || [],
  });

  return {
    ok: true,
    response: result.text,
    pillar: "social",
    metadata: {
      model: result.model,
      meta: result.meta,
    },
  };
}

/**
 * Execute Spirituality Coach
 */
async function executeSpiritualityCoach({
  userId,
  message,
  pillar,
  memory,
  context,
  options,
}) {
  const result = await runSpiritualityAgent({
    context: {
      userId,
      pillar: pillar || "spirituality",
      memory: memory?.pillars?.spirituality || {},
      ...context,
    },
    userMessage: message,
    lastMessages: context.lastMessages || [],
  });

  return {
    ok: true,
    response: result.text,
    pillar: "spirituality",
    metadata: {
      model: result.model,
      meta: result.meta,
    },
  };
}

/**
 * Execute Journaling Agent
 * Generates personalized journaling prompts
 */
async function executeJournalingAgent({ userId, message, context, options }) {
  const promptType = options.promptType || "reflection";

  const systemPrompts = {
    gratitude:
      "Create a thoughtful gratitude journaling prompt that helps someone appreciate the positive aspects of their life.",
    reflection:
      "Create a reflective journaling prompt that encourages deep self-awareness and understanding.",
    goals:
      "Create an inspiring journaling prompt about setting intentions and personal goals.",
    emotions:
      "Create a journaling prompt that helps someone explore and understand their current emotions.",
    growth:
      "Create a growth-focused journaling prompt about learning from experiences.",
    challenges:
      "Create a supportive journaling prompt that helps someone process current challenges.",
  };

  const systemPrompt = systemPrompts[promptType] || systemPrompts.reflection;

  const response = await routeCompletion({
    model: MODELS.GPT4_TURBO,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}\n\nThe prompt should be:\n- Open-ended and thought-provoking\n- 1-2 sentences\n- Encouraging and supportive\n- Focused on self-discovery`,
      },
      {
        role: "user",
        content: message || "Generate a journaling prompt for today.",
      },
    ],
    temperature: 0.8,
    maxTokens: 150,
  });

  return {
    ok: true,
    response: response.content,
    pillar: "mental_health",
    promptType,
    metadata: {
      model: response.model,
    },
  };
}

/**
 * Execute Adaptive Planner
 * Creates personalized action plans based on user data
 */
async function executeAdaptivePlanner({ userId, message, context, options }) {
  const {
    assessments = {},
    recentCheckIns = [],
    habits = [],
    goals = [],
  } = context;

  const planningPrompt = `Create a personalized wellness action plan based on this user data:

User Request: "${message}"

Recent Check-ins: ${
    recentCheckIns.length > 0
      ? JSON.stringify(recentCheckIns.slice(0, 5))
      : "None"
  }
Active Habits: ${habits.length} habits
Active Goals: ${goals.length} goals
Assessment Data: ${Object.keys(assessments).length > 0 ? "Available" : "None"}

Create a plan that:
1. Acknowledges their current state
2. Provides 3-5 specific, actionable steps
3. Prioritizes based on their data
4. Includes quick wins and longer-term actions
5. Addresses multiple wellness pillars if relevant

Keep it practical, encouraging, and achievable.`;

  const response = await routeCompletion({
    model: MODELS.GPT4_TURBO,
    messages: [
      {
        role: "system",
        content:
          "You are an adaptive wellness planner. Create personalized, data-driven action plans that meet users where they are.",
      },
      {
        role: "user",
        content: planningPrompt,
      },
    ],
    temperature: 0.7,
    maxTokens: 800,
  });

  return {
    ok: true,
    response: response.content,
    skipMemory: false,
    metadata: {
      model: response.model,
      planType: "adaptive",
    },
  };
}

/**
 * Execute Correlation Engine
 * Analyzes patterns across user data
 */
async function executeCorrelationEngine({ userId, context, options }) {
  const { checkIns = [], habits = [], sleepData = [], moodData = [] } = context;

  // Analyze correlations between different data types
  const correlations = await analyzeCorrelations({
    checkIns,
    habits,
    sleepData,
    moodData,
  });

  const insightsPrompt = `Analyze these wellness correlations and provide insights:

${JSON.stringify(correlations, null, 2)}

Provide:
1. Key patterns or trends you notice
2. Possible causal relationships
3. Actionable recommendations based on the correlations
4. Areas that need more attention

Be specific, insightful, and encouraging.`;

  const response = await routeCompletion({
    model: MODELS.GPT4_TURBO,
    messages: [
      {
        role: "system",
        content:
          "You are a wellness data analyst. Identify meaningful patterns and provide actionable insights.",
      },
      {
        role: "user",
        content: insightsPrompt,
      },
    ],
    temperature: 0.6,
    maxTokens: 600,
  });

  return {
    ok: true,
    response: response.content,
    correlations,
    skipMemory: true,
    metadata: {
      model: response.model,
      analysisType: "correlation",
    },
  };
}

/**
 * Analyze correlations between different data types
 */
async function analyzeCorrelations({ checkIns, habits, sleepData, moodData }) {
  // Simple correlation analysis
  const correlations = {
    sleepMoodCorrelation: calculateCorrelation(sleepData, moodData),
    habitCompletionTrend: calculateHabitTrend(habits),
    pillarScoreTrends: calculatePillarTrends(checkIns),
  };

  return correlations;
}

/**
 * Calculate simple correlation (placeholder for more sophisticated analysis)
 */
function calculateCorrelation(data1, data2) {
  if (!data1?.length || !data2?.length) return null;

  // Simplified correlation calculation
  return {
    strength: "moderate",
    direction: "positive",
    confidence: 0.6,
  };
}

/**
 * Calculate habit completion trends
 */
function calculateHabitTrend(habits) {
  if (!habits?.length) return null;

  const completionRates = habits.map((h) => h.completionRate || 0);
  const avgRate =
    completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

  return {
    averageCompletionRate: Math.round(avgRate * 100) / 100,
    totalHabits: habits.length,
    trend: avgRate > 0.7 ? "improving" : avgRate > 0.4 ? "stable" : "declining",
  };
}

/**
 * Calculate pillar score trends
 */
function calculatePillarTrends(checkIns) {
  if (!checkIns?.length) return null;

  const pillarScores = {};

  checkIns.forEach((checkIn) => {
    if (checkIn.pillar && typeof checkIn.score === "number") {
      if (!pillarScores[checkIn.pillar]) {
        pillarScores[checkIn.pillar] = [];
      }
      pillarScores[checkIn.pillar].push(checkIn.score);
    }
  });

  const trends = {};
  Object.keys(pillarScores).forEach((pillar) => {
    const scores = pillarScores[pillar];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    trends[pillar] = {
      averageScore: Math.round(avg * 10) / 10,
      checkInCount: scores.length,
    };
  });

  return trends;
}

/**
 * Execute Micro Actions Generator
 */
async function executeMicroActions({ userId, pillar, context, options }) {
  const actions = await generateMicroActions(pillar, context);

  return {
    ok: true,
    response: formatMicroActionsResponse(actions),
    actions,
    pillar,
    skipMemory: true,
    metadata: {
      actionCount: actions?.length || 0,
    },
  };
}

/**
 * Format micro actions as readable response
 */
function formatMicroActionsResponse(actions) {
  if (!actions || actions.length === 0) {
    return "No micro-actions available at the moment.";
  }

  let response = "Here are some quick actions you can take right now:\n\n";

  actions.slice(0, 3).forEach((action, index) => {
    response += `${index + 1}. **${action.title}** (${action.duration} min)\n`;
    response += `   ${action.description}\n`;
    if (action.benefits && action.benefits.length > 0) {
      response += `   Benefits: ${action.benefits.join(", ")}\n`;
    }
    response += "\n";
  });

  return response;
}

/**
 * Infer pillar from module name
 */
function inferPillarFromModule(module) {
  const moduleToPillar = {
    [AI_MODULES.SLEEP_COACH]: "sleep",
    [AI_MODULES.MENTAL_HEALTH_COACH]: "mental_health",
    [AI_MODULES.DIET_COACH]: "diet",
    [AI_MODULES.FITNESS_COACH]: "exercise",
    [AI_MODULES.PHYSICAL_HEALTH_COACH]: "physical_health",
    [AI_MODULES.FINANCES_COACH]: "finances",
    [AI_MODULES.SOCIAL_COACH]: "social",
    [AI_MODULES.SPIRITUALITY_COACH]: "spirituality",
  };

  return moduleToPillar[module] || "general";
}

/**
 * Multi-module workflow orchestration
 * Execute multiple modules in sequence or parallel
 */
export async function orchestrateWorkflow({ userId, workflow, context = {} }) {
  const results = [];

  for (const step of workflow) {
    const { module, message, parallel = false } = step;

    const result = await orchestrateAI({
      userId,
      message,
      module,
      context: {
        ...context,
        previousResults: results,
      },
    });

    results.push({
      step: step.name || module,
      module,
      result,
    });

    // If any step fails and parallel is false, stop workflow
    if (!parallel && !result.ok) {
      break;
    }
  }

  return {
    ok: true,
    workflow: workflow.map((s) => s.name || s.module),
    results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get available AI modules info
 */
export function getAvailableModules() {
  return Object.entries(AI_MODULES).map(([key, value]) => ({
    key,
    value,
    type: key.includes("COACH") ? "coach" : "engine",
  }));
}

export { AI_MODULES };
