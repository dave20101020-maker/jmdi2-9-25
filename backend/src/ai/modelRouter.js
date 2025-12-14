/**
 * Model Router
 *
 * Reusable AI model router that intelligently routes requests between
 * OpenAI (ChatGPT) and Anthropic (Claude) based on task type.
 *
 * This router implements automatic fallback handling and provides a clean
 * interface for all AI agents in the NorthStar coaching system.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Lazy-initialize AI clients to avoid errors when API keys are not set
let openai = null;
let anthropic = null;

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY || null;
}

function getOpenAIClient() {
  if (!openai) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openai = new OpenAI({
      apiKey,
    });
  }
  return openai;
}

function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// Model configurations
export const MODELS = {
  // OpenAI Models
  GPT4_TURBO: "gpt-4o-mini",
  GPT4: "gpt-4",
  GPT35_TURBO: "gpt-3.5-turbo",

  // Anthropic Models
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  CLAUDE_35_SONNET: "claude-3-5-sonnet-20241022",
};

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

  // Validate required parameters
  if (!taskType || !systemPrompt || !userMessage) {
    throw new Error(
      "Missing required parameters: taskType, systemPrompt, and userMessage are required"
    );
  }

  // Determine preferred and fallback providers based on task type
  let preferredProvider, fallbackProvider;

  if (taskType === "deep_reasoning") {
    // Claude excels at complex reasoning and analysis
    preferredProvider = "claude";
    fallbackProvider = "openai";
  } else if (taskType === "emotional_coaching") {
    // OpenAI ChatGPT is preferred for emotional and conversational tasks
    preferredProvider = "openai";
    fallbackProvider = "claude";
  } else if (taskType === "mixed") {
    // Default to Claude for mixed tasks, with OpenAI as fallback
    preferredProvider = "claude";
    fallbackProvider = "openai";
  } else {
    throw new Error(
      `Invalid taskType: ${taskType}. Must be 'deep_reasoning', 'emotional_coaching', or 'mixed'`
    );
  }

  // Try preferred provider first
  try {
    if (preferredProvider === "openai") {
      return await callOpenAI(systemPrompt, userMessage, conversationHistory);
    } else {
      return await callClaude(systemPrompt, userMessage, conversationHistory);
    }
  } catch (error) {
    // Log the error and attempt fallback
    console.error(`[ModelRouter] ${preferredProvider} failed:`, error.message);
    console.log(`[ModelRouter] Attempting fallback to ${fallbackProvider}...`);

    try {
      if (fallbackProvider === "openai") {
        return await callOpenAI(systemPrompt, userMessage, conversationHistory);
      } else {
        return await callClaude(systemPrompt, userMessage, conversationHistory);
      }
    } catch (fallbackError) {
      // Both providers failed - throw comprehensive error
      console.error(
        `[ModelRouter] ${fallbackProvider} also failed:`,
        fallbackError.message
      );
      throw new Error(
        `AI routing failed: Both ${preferredProvider} and ${fallbackProvider} returned errors. ` +
          `Primary: ${error.message}. Fallback: ${fallbackError.message}`
      );
    }
  }
}

/**
 * Internal helper: Call OpenAI ChatGPT
 *
 * @param {string} systemPrompt - System instructions for the AI
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous conversation turns
 * @returns {Promise<Object>} { model: 'openai', text: string, raw: any }
 */
async function callOpenAI(systemPrompt, userMessage, conversationHistory = []) {
  // Check API key availability
  if (!getOpenAIKey()) {
    throw new Error(
      "OPENAI_API_KEY is not configured in environment variables"
    );
  }

  // Build message array in OpenAI format
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  // Call OpenAI API
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: MODELS.GPT4_TURBO, // Using GPT-4 Turbo for best quality
    messages,
    temperature: 0.7,
    max_tokens: 1500,
  });

  // Extract and return the response
  const text = response.choices[0].message.content;

  return {
    model: "openai",
    text,
    raw: response,
  };
}

/**
 * Internal helper: Call Anthropic Claude
 *
 * @param {string} systemPrompt - System instructions for the AI
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous conversation turns
 * @returns {Promise<Object>} { model: 'anthropic', text: string, raw: any }
 */
async function callClaude(systemPrompt, userMessage, conversationHistory = []) {
  // Check API key availability
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured in environment variables"
    );
  }

  // Convert conversation history to Anthropic format
  // Anthropic expects alternating user/assistant messages (no system in messages array)
  const anthropicMessages = [
    ...conversationHistory.filter((msg) => msg.role !== "system"),
    { role: "user", content: userMessage },
  ];

  // Call Anthropic API
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.CLAUDE_35_SONNET, // Using Claude 3.5 Sonnet for best quality
    max_tokens: 1500,
    temperature: 0.7,
    system: systemPrompt, // System prompt is a separate parameter in Anthropic
    messages: anthropicMessages,
  });

  // Extract and return the response
  const text = response.content[0].text;

  return {
    model: "anthropic",
    text,
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
  const modelProviders = {
    [MODELS.GPT4_TURBO]: "openai",
    [MODELS.GPT4]: "openai",
    [MODELS.GPT35_TURBO]: "openai",
    [MODELS.CLAUDE_3_OPUS]: "anthropic",
    [MODELS.CLAUDE_3_SONNET]: "anthropic",
    [MODELS.CLAUDE_3_HAIKU]: "anthropic",
    [MODELS.CLAUDE_35_SONNET]: "anthropic",
  };

  const provider = modelProviders[model];

  if (!provider) {
    throw new Error(`Unknown model: ${model}`);
  }

  // If Anthropic isn't configured, fall back to OpenAI for Claude models.
  // This keeps AI features working in environments with only OpenAI credentials.
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    if (getOpenAIKey()) {
      console.warn(
        `[ModelRouter] Anthropic not configured for model '${model}'. Falling back to OpenAI.`
      );
      return await callOpenAILegacy({
        model: MODELS.GPT4_TURBO,
        messages,
        temperature,
        maxTokens,
        options,
      });
    }
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  try {
    if (provider === "openai") {
      return await callOpenAILegacy({
        model,
        messages,
        temperature,
        maxTokens,
        options,
      });
    } else {
      return await callClaudeLegacy({
        model,
        messages,
        temperature,
        maxTokens,
        options,
      });
    }
  } catch (error) {
    console.error(`Error calling ${provider}:`, error.message);
    throw new Error(`AI provider error: ${error.message}`);
  }
}

/**
 * Legacy OpenAI caller (backward compatibility)
 */
async function callOpenAILegacy({
  model,
  messages,
  temperature,
  maxTokens,
  options,
}) {
  if (!getOpenAIKey()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...options,
  });

  return {
    provider: "openai",
    model,
    content: response.choices[0].message.content,
    usage: response.usage,
    finishReason: response.choices[0].finish_reason,
    raw: response,
  };
}

/**
 * Legacy Claude caller (backward compatibility)
 */
async function callClaudeLegacy({
  model,
  messages,
  temperature,
  maxTokens,
  options,
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemMessage?.content || undefined,
    messages: conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    ...options,
  });

  return {
    provider: "anthropic",
    model,
    content: response.content[0].text,
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    finishReason: response.stop_reason,
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
  const modelProviders = {
    [MODELS.GPT4_TURBO]: "openai",
    [MODELS.GPT4]: "openai",
    [MODELS.GPT35_TURBO]: "openai",
    [MODELS.CLAUDE_3_OPUS]: "anthropic",
    [MODELS.CLAUDE_3_SONNET]: "anthropic",
    [MODELS.CLAUDE_3_HAIKU]: "anthropic",
    [MODELS.CLAUDE_35_SONNET]: "anthropic",
  };

  const provider = modelProviders[model];

  if (!provider) {
    throw new Error(`Unknown model: ${model}`);
  }

  // If Anthropic isn't configured, fall back to OpenAI streaming for Claude models.
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    if (!getOpenAIKey()) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    console.warn(
      `[ModelRouter] Anthropic not configured for model '${model}'. Falling back to OpenAI streaming.`
    );
    yield* streamOpenAI({
      model: MODELS.GPT4_TURBO,
      messages,
      temperature,
      maxTokens,
      options,
    });
    return;
  }

  if (provider === "openai") {
    yield* streamOpenAI({ model, messages, temperature, maxTokens, options });
  } else {
    yield* streamAnthropic({
      model,
      messages,
      temperature,
      maxTokens,
      options,
    });
  }
}

/**
 * Stream OpenAI responses
 */
async function* streamOpenAI({
  model,
  messages,
  temperature,
  maxTokens,
  options,
}) {
  const client = getOpenAIClient();
  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
    ...options,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield {
        provider: "openai",
        model,
        content,
        done: chunk.choices[0]?.finish_reason !== null,
      };
    }
  }
}

/**
 * Stream Anthropic responses
 */
async function* streamAnthropic({
  model,
  messages,
  temperature,
  maxTokens,
  options,
}) {
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const client = getAnthropicClient();
  const stream = await client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemMessage?.content || undefined,
    messages: conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    ...options,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield {
        provider: "anthropic",
        model,
        content: chunk.delta.text,
        done: false,
      };
    } else if (chunk.type === "message_stop") {
      yield {
        provider: "anthropic",
        model,
        content: "",
        done: true,
      };
    }
  }
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
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };
}

// Export clients for advanced usage
export { openai, anthropic };
