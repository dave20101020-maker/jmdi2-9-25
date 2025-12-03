/**
 * AI Client for Frontend
 * 
 * Centralized HTTP client for communicating with the orchestrator backend.
 * Handles:
 * - JWT token management
 * - Message routing to appropriate pillar agents
 * - Crisis detection and responses
 * - Saving AI-generated items (plans, habits, goals, etc.)
 * - Error handling and fallback responses
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with auth headers
 */
const createClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  });

  // Add JWT token to requests if available
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle response errors globally
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      
      // Handle 401 - redirect to login
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('jwt');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

const client = createClient();

/**
 * Send a message to the orchestrator for AI processing
 * 
 * @param {Object} params
 * @param {string} params.message - User's message
 * @param {string} [params.pillar] - Explicit pillar (optional, will be auto-detected)
 * @param {Array} [params.lastMessages] - Recent conversation history (optional)
 * @returns {Promise<Object>} - AI response or crisis info
 * 
 * @example
 * const response = await aiClient.sendMessage({
 *   message: "I've been feeling anxious lately",
 *   pillar: "mental-health"
 * });
 *
 * if (response.isCrisis) {
 *   displayCrisisResources(response.resources);
 * } else {
 *   displayAgentResponse(response.agent, response.text);
 * }
 */
export async function sendMessage({ message, pillar = null, lastMessages = [] }) {
  try {
    if (!message || !message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const response = await client.post('/api/orchestrator/chat', {
      message: message.trim(),
      pillar,
      lastMessages
    });

    // Check if response indicates a crisis
    if (response.data.isCrisis) {
      return {
        ok: true,
        isCrisis: true,
        severity: response.data.severity,
        type: response.data.type,
        message: response.data.message,
        resources: response.data.resources,
        timestamp: response.data.timestamp
      };
    }

    // Check if AI service is unavailable
    if (response.data.error || !response.data.ok) {
      return {
        ok: false,
        error: true,
        message: response.data.message || 'AI service temporarily unavailable',
        fallback: true,
        suggestion: getFallbackSuggestion(pillar)
      };
    }

    // Normal successful response
    return {
      ok: true,
      text: response.data.text,
      agent: response.data.agent,
      pillar: response.data.pillar,
      model: response.data.model,
      meta: response.data.meta || {}
    };
  } catch (error) {
    console.error('Message send error:', error);

    // Network or server error - return fallback
    return {
      ok: false,
      error: true,
      message: error.response?.data?.message || 'Unable to reach AI service',
      fallback: true,
      suggestion: getFallbackSuggestion(pillar),
      statusCode: error.response?.status
    };
  }
}

/**
 * Save a life plan
 * 
 * @param {Object} params
 * @param {string} params.title - Plan title
 * @param {string} params.content - Plan content
 * @param {string} params.pillar - Associated pillar
 * @param {Array} [params.pillars] - Multiple pillars
 * @param {string} [params.timeframe] - Time frame (e.g., '1 year')
 * @returns {Promise<Object>} - Saved plan
 */
export async function savePlan({ title, content, pillar, pillars = [], timeframe = '1 year' }) {
  try {
    const response = await client.post('/api/orchestrator/items/plan', {
      title,
      content,
      pillar,
      pillars: pillars.length > 0 ? pillars : [pillar],
      timeframe
    });

    return {
      ok: true,
      item: response.data.item,
      itemId: response.data.itemId
    };
  } catch (error) {
    console.error('Save plan error:', error);
    return {
      ok: false,
      error: error.message,
      message: 'Failed to save plan'
    };
  }
}

/**
 * Save a goal
 * 
 * @param {Object} params
 * @param {string} params.title - Goal title
 * @param {string} params.description - Goal description
 * @param {string} params.pillar - Associated pillar
 * @param {Array} [params.criteria] - Success criteria
 * @param {Date} [params.deadline] - Target deadline
 * @param {string} [params.priority] - 'high', 'medium', 'low'
 * @returns {Promise<Object>} - Saved goal
 */
export async function saveGoal({ title, description, pillar, criteria = [], deadline = null, priority = 'medium' }) {
  try {
    const response = await client.post('/api/orchestrator/items/goal', {
      title,
      description,
      pillar,
      criteria,
      deadline,
      priority
    });

    return {
      ok: true,
      item: response.data.item,
      itemId: response.data.itemId
    };
  } catch (error) {
    console.error('Save goal error:', error);
    return {
      ok: false,
      error: error.message,
      message: 'Failed to save goal'
    };
  }
}

/**
 * Save a habit
 * 
 * @param {Object} params
 * @param {string} params.title - Habit title
 * @param {string} params.description - Habit description
 * @param {string} params.pillar - Associated pillar
 * @param {string} params.frequency - 'daily', 'weekly', 'monthly'
 * @param {number} [params.targetCount] - Target repetitions
 * @param {string} [params.timeOfDay] - Preferred time
 * @returns {Promise<Object>} - Saved habit
 */
export async function saveHabit({ title, description = '', pillar, frequency = 'daily', targetCount = 1, timeOfDay = null }) {
  try {
    const response = await client.post('/api/orchestrator/items/habit', {
      title,
      description,
      pillar,
      frequency,
      targetCount,
      timeOfDay
    });

    return {
      ok: true,
      item: response.data.item,
      itemId: response.data.itemId
    };
  } catch (error) {
    console.error('Save habit error:', error);
    return {
      ok: false,
      error: error.message,
      message: 'Failed to save habit'
    };
  }
}

/**
 * Save a journal entry or log
 * 
 * @param {Object} params
 * @param {string} params.title - Entry title
 * @param {string} params.content - Entry content
 * @param {string} params.pillar - Associated pillar
 * @param {string} [params.type] - Entry type (journal, reflection, note, etc.)
 * @param {Object} [params.metrics] - Optional metrics
 * @returns {Promise<Object>} - Saved entry
 */
export async function saveEntry({ title, content, pillar, type = 'journal', metrics = null }) {
  try {
    const response = await client.post('/api/orchestrator/items/entry', {
      title,
      content,
      pillar,
      type,
      metrics
    });

    return {
      ok: true,
      item: response.data.item,
      itemId: response.data.itemId
    };
  } catch (error) {
    console.error('Save entry error:', error);
    return {
      ok: false,
      error: error.message,
      message: 'Failed to save entry'
    };
  }
}

/**
 * Reset user memory for a pillar
 * 
 * @param {string} pillar - Pillar to reset (null = all)
 * @returns {Promise<Object>} - Reset result
 */
export async function resetMemory(pillar = null) {
  try {
    const response = await client.post('/api/orchestrator/memory/reset', {
      pillar
    });

    return {
      ok: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Reset memory error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Get user's memory/context for a pillar
 * 
 * @param {string} pillar - Pillar to retrieve memory for
 * @returns {Promise<Object>} - Memory data
 */
export async function getMemory(pillar) {
  try {
    const response = await client.get(`/api/orchestrator/memory/${pillar}`);

    return {
      ok: true,
      memory: response.data
    };
  } catch (error) {
    console.error('Get memory error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Get fallback suggestion when AI is unavailable
 * Used to provide helpful guidance when service is down
 * 
 * @param {string} pillar - Optional pillar context
 * @returns {string} - Fallback suggestion
 */
function getFallbackSuggestion(pillar = null) {
  const suggestions = {
    'mental-health': 'Consider journaling your thoughts or reaching out to a trusted friend or mental health professional.',
    'fitness': 'Try a quick 10-minute workout video or take a walk to boost your energy.',
    'sleep': 'Focus on good sleep hygiene: no screens 30 minutes before bed, cool dark room, consistent schedule.',
    'nutrition': 'Drink water, eat a balanced meal with protein and vegetables, and practice mindful eating.',
    'finances': 'Review your budget, track your expenses this week, and identify one area to optimize.',
    'physical-health': 'Consider a check-up with your doctor or healthcare provider for personalized advice.',
    'social': 'Reach out to a friend or family member you care about to strengthen your connections.',
    'spirituality': 'Take time for reflection, meditation, or engage in a practice that brings you meaning.'
  };

  return suggestions[pillar] || suggestions['mental-health'];
}

/**
 * Handle crisis response from API
 * Used to properly display crisis resources to user
 * 
 * @param {Object} crisisResponse - Response from sendMessage with isCrisis flag
 * @returns {Object} - Formatted crisis data
 */
export function handleCrisisResponse(crisisResponse) {
  if (!crisisResponse.isCrisis) {
    return null;
  }

  return {
    message: crisisResponse.message,
    severity: crisisResponse.severity,
    resources: (crisisResponse.resources || []).map(resource => ({
      name: resource.name,
      number: resource.number,
      url: resource.url,
      description: resource.description
    }))
  };
}

/**
 * Format AI response for display
 * 
 * @param {Object} response - Response from sendMessage
 * @returns {Object} - Formatted response
 */
export function formatResponse(response) {
  if (response.isCrisis) {
    return {
      type: 'crisis',
      message: response.message,
      resources: response.resources,
      severity: response.severity
    };
  }

  if (response.error) {
    return {
      type: 'error',
      message: response.message,
      fallback: response.suggestion,
      retry: true
    };
  }

  return {
    type: 'success',
    message: response.text,
    agent: response.agent,
    pillar: response.pillar
  };
}

export default {
  sendMessage,
  savePlan,
  saveGoal,
  saveHabit,
  saveEntry,
  resetMemory,
  getMemory,
  handleCrisisResponse,
  formatResponse
};
