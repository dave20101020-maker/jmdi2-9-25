/**
 * Model Router
 *
 * Reusable AI model router that intelligently routes requests between
 * Gemini and OpenAI based on task type.
 *
 * This router implements automatic fallback handling and provides a clean
 * interface for all AI agents in the NorthStar coaching system.
 */

import { callLLM, getAvailableProviders } from "../../services/llm.js";

// Model configurations
export const MODELS = {
  // OpenAI Models
  GPT4_TURBO: "gpt-4-turbo",
  GPT4: "gpt-4",
  GPT35_TURBO: "gpt-3.5-turbo",

  // Anthropic Models
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  CLAUDE_35_SONNET: "claude-3-5-sonnet-20241022",
};

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

function buildMessages(systemPrompt, userMessage, conversationHistory = []) {
  return [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];
}

/**
 * Main routing function - intelligently selects the best model for the task
 *
 * @param {Object} options - Request options
 * @param {string} options.taskType - Type of task: 'deep_reasoning', 'emotional_coaching', or 'mixed'
 * @param {string} options.systemPrompt - System prompt for the AI
 * @param {string} options.userMessage - User's message/question
 * @param {Array} [options.conversationHistory] - Optional conversation history
 * @returns {Promise<Object>} { model: 'openai' | 'anthropic', text: string, raw: any }
 */
export async function runWithBestModel(options) {
  const {
    taskType,
    systemPrompt,
    userMessage,
    conversationHistory = [],
  } = options;

  const providers = getAvailableProviders();

  // Validate required parameters
  if (!taskType || !systemPrompt || !userMessage) {
    throw new Error(
      "Missing required parameters: taskType, systemPrompt, and userMessage are required"
    );
  }

  if (!providers.gemini && !providers.openai) {
    throw new Error("AI routing failed: no providers are configured");
  }

  if (
    taskType !== "deep_reasoning" &&
    taskType !== "emotional_coaching" &&
    taskType !== "mixed"
  ) {
    throw new Error(
      `Invalid taskType: ${taskType}. Must be 'deep_reasoning', 'emotional_coaching', or 'mixed'`
    );
  }

  const messages = buildMessages(
    systemPrompt,
    userMessage,
    conversationHistory
  );

  const response = await callLLM({
    messages,
    model: DEFAULT_GEMINI_MODEL,
    temperature: 0.7,
    maxTokens: 1500,
  });

  return {
    model: response.provider,
    text: response.text,
    raw: response,
  };
}

/**
 * Legacy function: Route a completion request to a specific model
 * (Kept for backward compatibility with existing code)
 *
 * @param {Object} params - Request parameters
 * @param {string} params.model - Model identifier
 * @param {Array} params.messages - Conversation messages
 * @param {number} params.temperature - Temperature (0-2)
 * @param {number} params.maxTokens - Maximum tokens to generate
 * @param {Object} params.options - Additional provider-specific options
 * @returns {Promise<Object>} AI response
 */
export async function routeCompletion({
  model = MODELS.GPT4_TURBO,
  messages = [],
  temperature = 0.7,
  maxTokens = 1000,
  options = {},
}) {
  const response = await callLLM({
    messages,
    model,
    temperature,
    maxTokens,
    jsonSchema: options?.jsonSchema,
  });

  return {
    provider: response.provider,
    model: response.model,
    content: response.text,
    usage: response.usage,
    finishReason: null,
    raw: response,
  };
}

/**
 * Stream a completion request (for real-time responses)
 */
export async function* routeStreamingCompletion({
  model = MODELS.GPT4_TURBO,
  messages = [],
  temperature = 0.7,
  maxTokens = 1000,
  options = {},
}) {
  const response = await callLLM({
    messages,
    model,
    temperature,
    maxTokens,
    jsonSchema: options?.jsonSchema,
  });

  yield {
    provider: response.provider,
    model: response.model,
    content: response.text,
    done: true,
  };
}

/**
 * Get recommended model based on task type
 */
export function getRecommendedModel(taskType) {
  const recommendations = {
    // Complex reasoning tasks
    reasoning: MODELS.CLAUDE_35_SONNET,
    analysis: MODELS.GPT4_TURBO,

    // Fast, lightweight tasks
    quick: MODELS.CLAUDE_3_HAIKU,
    simple: MODELS.GPT35_TURBO,

    // Balanced tasks
    coaching: MODELS.CLAUDE_3_SONNET,
    conversation: MODELS.GPT4_TURBO,

    // Creative tasks
    creative: MODELS.CLAUDE_3_OPUS,
    writing: MODELS.GPT4,
  };

  return recommendations[taskType] || MODELS.GPT4_TURBO;
}

/**
 * Check if API keys are configured
 */
export function checkAPIKeys() {
  return {
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };
}
