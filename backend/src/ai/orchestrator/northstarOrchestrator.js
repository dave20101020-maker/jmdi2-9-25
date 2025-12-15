/**
 * NorthStar AI Orchestrator
 *
 * Central orchestrator that routes user messages to the appropriate pillar agent.
 * Handles pillar detection, agent routing, and response formatting.
 *
 * This is the main entry point for all AI coaching interactions in NorthStar.
 */

import { applyPersistenceGate } from "../pipeline/aiResponsePipeline.js";
import {
  routeToSpecificAgent,
  northstarFallbackResponse,
} from "./agentRouter.js";
import {
  loadMemory,
  saveMemory,
  updateConversationHistory,
  getConversationHistory,
} from "./memoryStore.js";

// Re-export memory utilities for convenience
export {
  loadMemory,
  saveMemory,
  updateConversationHistory,
  getConversationHistory,
  addItemToMemory,
  markTopicCovered,
  isTopicCovered,
  updatePillarData,
  clearMemory,
} from "./memoryStore.js";

/**
 * Main NorthStar AI orchestration function
 *
 * Routes user messages to the appropriate wellness pillar agent.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.message - User's message
 * @param {Array} [params.lastMessages=[]] - Recent conversation history
 * @param {string} [params.explicitPillar] - Force a specific pillar (optional)
 * @param {Object} [params.memory] - User memory/preferences (optional)
 * @param {Object} [params.appItems] - Existing user items (habits, goals, etc.)
 * @returns {Promise<{text: string, model: string, pillar: string, meta: Object}>}
 */
export async function runNorthStarAI({
  userId,
  message,
  lastMessages = [],
  explicitPillar,
  requestContext,
  memory,
  appItems,
}) {
  try {
    const isAnonymous =
      userId === "anonymous" ||
      (typeof userId === "string" && userId.startsWith("anon:"));
    const requestedMode = (requestContext?.mode || "").toString().toLowerCase();
    const requestedPillarId = (requestContext?.pillarId || "")
      .toString()
      .toLowerCase();
    let selectionReason = "heuristic_detect";

    // Validate required parameters
    if (!userId) {
      throw new Error("runNorthStarAI requires userId");
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new Error("runNorthStarAI requires a non-empty message string");
    }

    // Load user memory if not provided.
    if (!memory) {
      memory = await loadMemory(userId);
    }

    // HARD GUARD:
    // Pillar agents may ONLY respond if explicit pillar_direct context exists.
    let pillar = "general";
    let requestedAgent = "northstar";
    if (requestedMode === "pillar_direct") {
      const requested = requestedPillarId || explicitPillar;
      if (requested) {
        pillar = requested;
        requestedAgent = "pillar";
        selectionReason = "context.mode=pillar_direct";
      } else {
        pillar = "general";
        requestedAgent = "northstar";
        selectionReason = "pillar_direct_missing_pillarId";
      }
    } else {
      pillar = "general";
      requestedAgent = "northstar";
      selectionReason = requestedMode
        ? `context.mode=${requestedMode}`
        : "default=northstar";
    }

    console.info("[AI][orchestrator] routing decision", {
      userId: isAnonymous ? "anonymous" : "authenticated",
      requestedMode: requestedMode || null,
      requestedPillarId: requestedPillarId || null,
      explicitPillar: explicitPillar || null,
      selectedPillar: pillar,
      selectionReason,
      requestedAgent,
    });

    // Get conversation history from memory for this pillar
    const pillarHistory = getConversationHistory(memory, pillar, 20);

    // Use provided lastMessages if available, otherwise use memory
    const conversationHistory =
      lastMessages.length > 0 ? lastMessages : pillarHistory;

    // Build context for the agent
    const context = {
      userId,
      pillar,
      memory: memory.pillars[pillar] || {},
      appItems: appItems || null,
    };

    // Route to the appropriate agent (wrapped in try/catch for API failures)
    let agentResult;
    try {
      // DEV-ONLY smoke-test switch:
      // When enabled, force NorthStar (general) requests to fail deterministically
      // so the system returns the existing NorthStar-only fallback response.
      const forceNorthStarFail =
        process.env.NODE_ENV !== "production" &&
        String(process.env.DEV_FORCE_NORTHSTAR_FAIL || "").toLowerCase() ===
          "true";

      if (forceNorthStarFail && requestedAgent === "northstar") {
        throw new Error("DEV_FORCE_NORTHSTAR_FAIL enabled");
      }

      agentResult = await routeToSpecificAgent(pillar, {
        context,
        userMessage: message,
        lastMessages: conversationHistory,
      });

      console.info("[AI][orchestrator] agent selected", {
        agent: pillar === "general" ? "northstar" : pillar,
        pillar,
        selectionReason,
      });
    } catch (agentError) {
      console.error(`Agent error for pillar ${pillar}:`, agentError.message);

      // If NorthStar was requested and fails: DO NOT route to a pillar.
      if (requestedAgent === "northstar") {
        const fallback = northstarFallbackResponse({
          reason: agentError?.message,
        });

        // Persistence is still expected even for fallback responses.
        // Persisting does not require an AI provider and keeps UI behavior consistent.
        try {
          const persisted = await applyPersistenceGate({
            memory,
            pillar: "general",
            userMessage: message,
            assistantText: fallback.text,
            agentName: "NorthStar AI",
            saveMemoryFn: saveMemory,
            userId,
          });

          return {
            ...fallback,
            ok: false,
            text: persisted.text,
            meta: {
              ...(fallback.meta || {}),
              saveSummary: persisted.saveSummary,
            },
          };
        } catch (persistError) {
          return fallback;
        }
      }

      return {
        ok: false,
        error: true,
        message: "AI temporarily unavailable",
        agent: null,
        pillar,
      };
    }

    // Persist BEFORE returning any user-facing response.
    // This enforces Base44-style behavior: no advice-only responses.
    const agentName = pillar === "general" ? "NorthStar AI" : pillar;

    const persistence = await applyPersistenceGate({
      memory,
      pillar,
      userMessage: message,
      assistantText: agentResult.text,
      agentName,
      saveMemoryFn: saveMemory,
      userId,
    });

    // Wrap and return the result
    return {
      ok: Boolean(persistence.ok),
      text: persistence.text,
      model: agentResult.model,
      pillar,
      agent: pillar === "general" ? "northstar" : pillar,
      meta: {
        ...(agentResult.meta || {}),
        selectionReason,
        requestedMode: requestedMode || null,
        saveSummary: persistence.saveSummary,
      },
    };
  } catch (error) {
    // Input validation or general errors
    console.error("Orchestrator error:", error.message);
    return {
      ok: false,
      error: true,
      message: "AI temporarily unavailable",
      agent: null,
    };
  }
}

// Backward-compatible export: external callers may import this symbol
// from the orchestrator module.
export { routeToSpecificAgent } from "./agentRouter.js";

/**
 * Detect the most relevant pillar from a user message
 *
 * Uses keyword-based heuristics with priority ordering:
 * 1. Crisis/mental health (highest priority)
 * 2. Sleep issues
 * 3. Money/finances
 * 4. Physical health/symptoms
 * 5. Nutrition/diet
 */
export function detectPillarFromMessage(message) {
  const lower = message.toLowerCase();

  // Avoid auto-activating a pillar on trivial greetings.
  // This keeps the first turn owned by NorthStar unless explicitly overridden.
  const greetingOnly = lower.replace(/[^a-z0-9\s]/g, " ").trim();
  if (
    greetingOnly &&
    greetingOnly.split(/\s+/).length <= 3 &&
    ["hi", "hello", "hey", "yo", "sup", "hiya"].includes(greetingOnly)
  ) {
    return "general";
  }

  // Priority 1: Mental health crisis keywords (highest priority)
  const mentalHealthCrisisKeywords = [
    "suicide",
    "suicidal",
    "kill myself",
    "end it all",
    "self-harm",
    "cut myself",
    "hurt myself",
    "want to die",
    "no reason to live",
    "panic attack",
    "severe anxiety",
    "cant breathe",
    "depressed",
    "depression",
    "hopeless",
    "anxiety",
    "anxious",
    "worried",
    "panic",
    "therapy",
    "therapist",
    "counselor",
    "mental health",
    "mental illness",
    "ptsd",
    "trauma",
    "flashback",
    "medication",
    "antidepressant",
    "mood",
    "sad",
    "crying",
    "overwhelming",
  ];

  if (mentalHealthCrisisKeywords.some((keyword) => lower.includes(keyword))) {
    return "mental_health";
  }

  // Priority 2: Sleep issues
  const sleepKeywords = [
    "sleep",
    "insomnia",
    "can't sleep",
    "cant sleep",
    "tired",
    "fatigue",
    "exhausted",
    "drowsy",
    "snoring",
    "sleep apnea",
    "cpap",
    "nightmare",
    "night terror",
    "dream",
    "wake up",
    "waking up",
    "restless",
    "bedtime",
    "bed time",
    "going to bed",
    "nap",
    "napping",
    "doze",
    "circadian",
    "melatonin",
    "sleep schedule",
  ];

  if (sleepKeywords.some((keyword) => lower.includes(keyword))) {
    return "sleep";
  }

  // Priority 3: Finances/money
  const financeKeywords = [
    "money",
    "budget",
    "debt",
    "loan",
    "credit",
    "pay",
    "payment",
    "bill",
    "expense",
    "save",
    "saving",
    "savings",
    "emergency fund",
    "invest",
    "investment",
    "401k",
    "ira",
    "retirement",
    "income",
    "salary",
    "wage",
    "financial",
    "broke",
    "afford",
    "cost",
    "price",
    "dollar",
    "$",
    "bank",
    "account",
  ];

  if (financeKeywords.some((keyword) => lower.includes(keyword))) {
    return "finances";
  }

  // Priority 4: Physical health/symptoms
  const physicalHealthKeywords = [
    "pain",
    "ache",
    "hurt",
    "sore",
    "doctor",
    "physician",
    "medical",
    "appointment",
    "symptom",
    "sick",
    "illness",
    "disease",
    "blood pressure",
    "cholesterol",
    "diabetes",
    "heart",
    "cardiac",
    "chest",
    "headache",
    "migraine",
    "dizzy",
    "fever",
    "cold",
    "flu",
    "cough",
    "stomach",
    "nausea",
    "digestive",
    "test",
    "screening",
    "lab",
    "result",
    "prescription",
    "medicine",
    "pill",
  ];

  if (physicalHealthKeywords.some((keyword) => lower.includes(keyword))) {
    return "physical_health";
  }

  // Priority 5: Nutrition/diet
  const nutritionKeywords = [
    "food",
    "eat",
    "eating",
    "diet",
    "meal",
    "breakfast",
    "lunch",
    "dinner",
    "recipe",
    "cook",
    "cooking",
    "calorie",
    "protein",
    "carb",
    "fat",
    "macro",
    "nutrition",
    "nutrient",
    "vegetarian",
    "vegan",
    "keto",
    "paleo",
    "weight loss",
    "weight gain",
    "lose weight",
    "hungry",
    "craving",
    "appetite",
    "grocery",
    "ingredient",
    "meal prep",
    "meal plan",
  ];

  if (nutritionKeywords.some((keyword) => lower.includes(keyword))) {
    return "nutrition";
  }

  // Priority 6: Fitness/exercise
  const fitnessKeywords = [
    "workout",
    "exercise",
    "train",
    "training",
    "gym",
    "lift",
    "lifting",
    "weight",
    "run",
    "running",
    "jog",
    "cardio",
    "strength",
    "muscle",
    "gain",
    "bulk",
    "squat",
    "bench",
    "deadlift",
    "press",
    "rep",
    "set",
    "form",
    "technique",
    "fitness",
    "active",
    "movement",
    "program",
    "routine",
    "split",
    "yoga",
    "pilates",
    "stretch",
  ];

  if (fitnessKeywords.some((keyword) => lower.includes(keyword))) {
    return "fitness";
  }

  // Priority 7: Social/relationships
  const socialKeywords = [
    "friend",
    "friendship",
    "lonely",
    "loneliness",
    "relationship",
    "partner",
    "dating",
    "family",
    "parent",
    "sibling",
    "social",
    "people",
    "conversation",
    "connect",
    "connection",
    "community",
    "awkward",
    "shy",
    "introvert",
    "conflict",
    "argument",
    "fight",
    "boundary",
    "boundaries",
    "rejection",
    "rejected",
    "left out",
  ];

  if (socialKeywords.some((keyword) => lower.includes(keyword))) {
    return "social";
  }

  // Priority 8: Spirituality/meaning (default catch-all for existential topics)
  const spiritualityKeywords = [
    "purpose",
    "meaning",
    "spiritual",
    "value",
    "belief",
    "faith",
    "meditation",
    "mindfulness",
    "gratitude",
    "soul",
    "spirit",
    "god",
    "universe",
    "existential",
    "existence",
    "life",
    "death",
    "dying",
    "mortality",
    "philosophy",
    "philosophical",
    "transcendent",
    "divine",
  ];

  if (spiritualityKeywords.some((keyword) => lower.includes(keyword))) {
    return "spirituality";
  }

  // Default fallback: if no clear pillar detected, route to general (NorthStar)
  return "general";
}

/**
 * Get all available pillars
 *
 * @returns {string[]} - Array of pillar names
 */
export function getAvailablePillars() {
  return [
    "sleep",
    "mental_health",
    "nutrition",
    "fitness",
    "physical_health",
    "finances",
    "social",
    "spirituality",
  ];
}

/**
 * Validate if a pillar name is valid
 *
 * @param {string} pillar - Pillar name to validate
 * @returns {boolean} - True if valid pillar
 */
export function isValidPillar(pillar) {
  return getAvailablePillars().includes(pillar);
}
