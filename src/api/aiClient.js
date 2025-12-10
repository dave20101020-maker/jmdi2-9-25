/**
 * AI Client
 *
 * Centralized client for all AI-related API calls.
 * Handles:
 * - Message sending to orchestrator
 * - Pillar-specific agent requests
 * - Crisis detection
 * - Error handling with fallbacks
 * - Standard response formatting
 * - Request caching
 */

import { AI_ENDPOINTS, buildUrl, getAuthHeader } from "@/config/apiConfig";
import {
  parseError,
  getUserFriendlyMessage,
  getRecoverySuggestions,
} from "@/utils/errorHandling";
import { getCachedResponse, setCachedResponse } from "./aiCache";

/**
 * Make authenticated fetch request to AI endpoint
 * Includes caching for read-only requests
 * @param {string} endpoint - The AI endpoint (from AI_ENDPOINTS)
 * @param {object} data - Request body data
 * @param {object} options - Additional options
 * @param {boolean} [options.skipCache=false] - Skip caching
 * @returns {Promise<object>} - Parsed response
 */
async function fetchAI(endpoint, data = {}, options = {}) {
  // Check cache for read-only requests (GET-like)
  if (!options.skipCache) {
    const cached = getCachedResponse(endpoint, data);
    if (cached) {
      return cached;
    }
  }

  const url = buildUrl(endpoint);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = parseError(result || { message: "AI request failed" });
    error.statusCode = response.status;
    throw error;
  }

  // Cache successful responses
  if (!options.skipCache) {
    setCachedResponse(endpoint, data, result);
  }

  return result;
}

/**
 * Send message to orchestrator for AI processing
 *
 * @param {string} message - The user's message
 * @param {object} options - Additional options
 * @param {string} [options.pillar] - Specific pillar to focus on
 * @param {object} [options.context] - Additional context data
 * @param {array} [options.lastMessages] - Recent conversation history
 * @returns {Promise<object>} - Response with { ok, text, agent, pillar } or { ok, isCrisis, resources }
 *
 * @example
 * const response = await aiClient.sendToOrchestrator('I feel anxious', {
 *   pillar: 'mental-health',
 *   context: { recentEvents: [] }
 * })
 *
 * if (response.isCrisis) {
 *   displayCrisisResources(response.resources)
 * } else {
 *   displayMessage(response.text)
 * }
 */
export async function sendToOrchestrator(message, options = {}) {
  try {
    if (!message || !message.trim()) {
      return {
        ok: false,
        error: true,
        message: "Message cannot be empty",
        type: "validation",
      };
    }

    const data = {
      message: message.trim(),
      pillar: options.pillar || null,
      context: options.context || {},
      lastMessages: options.lastMessages || [],
    };

    const result = await fetchAI(AI_ENDPOINTS.ORCHESTRATOR, data);

    // Crisis detection
    if (result.isCrisis) {
      return {
        ok: true,
        isCrisis: true,
        severity: result.severity,
        type: result.type,
        message: result.message,
        resources: result.resources || [],
        timestamp: result.timestamp || new Date().toISOString(),
      };
    }

    // Successful response
    return {
      ok: true,
      text: result.text || "",
      agent: result.agent || "coach",
      pillar: result.pillar || options.pillar || "general",
      model: result.model || "unknown",
      meta: result.meta || {},
    };
  } catch (error) {
    const parsedError = parseError(error);
    return {
      ok: false,
      error: true,
      message: getUserFriendlyMessage(parsedError),
      fallback: true,
      suggestions: getRecoverySuggestions(parsedError),
      statusCode: error.statusCode || 500,
    };
  }
}

/**
 * Send request to a specific pillar agent
 *
 * @param {string} pillar - The pillar ID (e.g., 'mental-health', 'fitness')
 * @param {string} message - The user's message
 * @param {object} options - Additional options
 * @param {object} [options.context] - Additional context data
 * @param {array} [options.lastMessages] - Recent conversation history
 * @returns {Promise<object>} - Response with { ok, text, agent, pillar }
 *
 * @example
 * const response = await aiClient.sendToPillarAgent('fitness', 'Create a workout plan', {
 *   context: { fitnessLevel: 'intermediate' }
 * })
 */
export async function sendToPillarAgent(pillar, message, options = {}) {
  // Use orchestrator but specify the pillar
  return sendToOrchestrator(message, {
    ...options,
    pillar,
  });
}

/**
 * Check if message indicates a crisis
 *
 * @param {string} message - The user's message
 * @returns {Promise<object>} - Response with { isCrisis, severity, resources }
 *
 * @example
 * const result = await aiClient.checkCrisis(userMessage)
 * if (result.isCrisis) {
 *   showCrisisResources(result.resources)
 * }
 */
export async function checkCrisis(message) {
  try {
    const result = await fetchAI(AI_ENDPOINTS.CRISIS_CHECK, {
      message: message.trim(),
    });

    return {
      ok: true,
      isCrisis: result.isCrisis || false,
      severity: result.severity || "none",
      type: result.type || "unknown",
      message: result.message || "",
      resources: result.resources || [],
    };
  } catch (error) {
    // Crisis check shouldn't fail - return safe default
    console.error("Crisis check failed:", error);
    return {
      ok: false,
      isCrisis: false,
      message: "Unable to check for crisis",
    };
  }
}

/**
 * Get daily plan from AI
 *
 * @param {string} message - User's request for plan
 * @param {object} options - Additional options
 * @param {array} [options.goals] - User's goals
 * @param {number} [options.timeAvailable] - Available hours in day
 * @returns {Promise<object>} - Daily plan response
 */
export async function getDailyPlan(message, options = {}) {
  try {
    const result = await fetchAI(AI_ENDPOINTS.DAILY_PLAN, {
      message: message.trim(),
      goals: options.goals || [],
      timeAvailable: options.timeAvailable || 16,
    });

    return {
      ok: true,
      plan: result.plan || result,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    const parsedError = parseError(error);
    return {
      ok: false,
      error: true,
      message: getUserFriendlyMessage(parsedError),
      suggestions: getRecoverySuggestions(parsedError),
    };
  }
}

/**
 * Get pillar analysis from AI
 *
 * @param {string} message - User's request
 * @param {object} options - Additional options
 * @param {object} [options.scores] - Current pillar scores
 * @param {array} [options.focusAreas] - Areas to focus on
 * @returns {Promise<object>} - Analysis response
 */
export async function getPillarAnalysis(message, options = {}) {
  try {
    const result = await fetchAI(AI_ENDPOINTS.PILLAR_ANALYSIS, {
      message: message.trim(),
      scores: options.scores || {},
      focusAreas: options.focusAreas || [],
    });

    return {
      ok: true,
      analysis: result.analysis || result,
    };
  } catch (error) {
    const parsedError = parseError(error);
    return {
      ok: false,
      error: true,
      message: getUserFriendlyMessage(parsedError),
    };
  }
}

/**
 * Get weekly reflection from AI
 *
 * @param {string} message - User's request
 * @param {object} options - Additional options
 * @param {object} [options.weeklyData] - Data from the week
 * @param {object} [options.pillarScores] - Pillar scores for the week
 * @returns {Promise<object>} - Reflection response
 */
export async function getWeeklyReflection(message, options = {}) {
  try {
    const result = await fetchAI(AI_ENDPOINTS.WEEKLY_REFLECTION, {
      message: message.trim(),
      weeklyData: options.weeklyData || {},
      pillarScores: options.pillarScores || {},
    });

    return {
      ok: true,
      reflection: result.reflection || result,
    };
  } catch (error) {
    const parsedError = parseError(error);
    return {
      ok: false,
      error: true,
      message: getUserFriendlyMessage(parsedError),
    };
  }
}

/**
 * Analyze sentiment of a message
 *
 * @param {string} text - The text to analyze
 * @returns {Promise<object>} - Sentiment analysis result
 */
export async function analyzeSentiment(text) {
  try {
    const result = await fetchAI(AI_ENDPOINTS.SENTIMENT, {
      text: text.trim(),
    });

    return {
      ok: true,
      sentiment: result.sentiment || "neutral",
      score: result.score || 0,
    };
  } catch (error) {
    return {
      ok: false,
      error: true,
      sentiment: "unknown",
    };
  }
}

/**
 * Transcribe audio
 *
 * @param {Blob} audioBlob - Audio file blob
 * @returns {Promise<object>} - Transcription result
 */
export async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const url = buildUrl(AI_ENDPOINTS.TRANSCRIBE);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
      },
      credentials: "include",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Transcription failed");
    }

    return {
      ok: true,
      text: result.text || "",
    };
  } catch (error) {
    return {
      ok: false,
      error: true,
      message: "Failed to transcribe audio",
    };
  }
}

/**
 * Save a daily plan to backend
 * @param {object} planData - Plan data to save
 * @returns {Promise<object>} - Save result
 */
export async function savePlan(planData) {
  try {
    const response = await fetch(buildUrl("/api/action-plans"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      credentials: "include",
      body: JSON.stringify(planData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save plan");
    }

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: true,
      message: "Failed to save plan",
    };
  }
}

/**
 * Save a goal to backend
 * @param {object} goalData - Goal data to save
 * @returns {Promise<object>} - Save result
 */
export async function saveGoal(goalData) {
  try {
    const response = await fetch(buildUrl("/api/goals"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      credentials: "include",
      body: JSON.stringify(goalData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save goal");
    }

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: true,
      message: "Failed to save goal",
    };
  }
}

/**
 * Save a habit to backend
 * @param {object} habitData - Habit data to save
 * @returns {Promise<object>} - Save result
 */
export async function saveHabit(habitData) {
  try {
    const response = await fetch(buildUrl("/api/habits"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      credentials: "include",
      body: JSON.stringify(habitData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save habit");
    }

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: true,
      message: "Failed to save habit",
    };
  }
}

export default {
  sendToOrchestrator,
  sendToPillarAgent,
  checkCrisis,
  getDailyPlan,
  getPillarAnalysis,
  getWeeklyReflection,
  analyzeSentiment,
  transcribeAudio,
  savePlan,
  saveGoal,
  saveHabit,
};
