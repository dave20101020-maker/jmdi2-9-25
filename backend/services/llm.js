/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LLM Service Layer - Centralized AI API Management
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SECURITY: All API keys are read from process.env on the backend.
 * Keys are NEVER exposed to frontend or in error messages.
 * All responses are sanitized before sending to client.
 *
 * This is the ONLY place in the codebase where AI SDKs are imported.
 * Frontend makes requests to /api/ai/* endpoints which delegate here.
 *
 * Supported Providers:
 * - Gemini
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Fallback: Mock responses for development
 */

import OpenAI from "openai";

const SAFE_TEXT_FALLBACK =
  "NorthStar AI is temporarily unavailable. Please try again soon.";

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4-turbo";

const PROVIDER_MODE = String(process.env.AI_PROVIDER || "auto")
  .trim()
  .toLowerCase();

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

console.log("[LLM] provider config", {
  mode: PROVIDER_MODE,
  geminiConfigured: hasGeminiKey,
  openaiConfigured: hasOpenAIKey,
});

// ═════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════════

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

function selectModelForProvider(provider, requestedModel) {
  if (provider === "gemini") {
    return typeof requestedModel === "string" &&
      requestedModel.startsWith("gemini")
      ? requestedModel
      : DEFAULT_GEMINI_MODEL;
  }

  if (provider === "openai") {
    if (typeof requestedModel === "string") {
      if (
        requestedModel.startsWith("gemini") ||
        requestedModel.startsWith("claude")
      ) {
        return DEFAULT_OPENAI_MODEL;
      }
      return requestedModel;
    }
    return DEFAULT_OPENAI_MODEL;
  }

  return requestedModel;
}

function createProviderError(message, options = {}) {
  const error = new Error(message);
  error.status = options.status;
  error.provider = options.provider;
  error.type = options.type;
  error.code = options.code;
  error.cause = options.cause;
  return error;
}

function isInvalidRequestError(error) {
  return error?.type === "invalid_request";
}

function shouldFallback(error) {
  if (!error) return true;
  return !isInvalidRequestError(error);
}

function buildGeminiPayload(messages = []) {
  const systemMessages = messages.filter((msg) => msg.role === "system");
  const systemText = systemMessages.map((msg) => msg.content).join("\n\n");

  const contents = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content || "" }],
    }));

  return {
    systemInstruction: systemText
      ? {
          role: "system",
          parts: [{ text: systemText }],
        }
      : undefined,
    contents,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// OPENAI FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function callOpenAIFromMessages({
  messages,
  model,
  temperature = 0.7,
  maxTokens = 2048,
  jsonSchema,
} = {}) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createProviderError("OpenAI is not configured", {
        provider: "openai",
        code: "AI_PROVIDER_NOT_CONFIGURED",
      });
    }

    const client = getOpenAIClient();
    if (!client) {
      throw createProviderError("OpenAI client initialization failed", {
        provider: "openai",
        code: "AI_PROVIDER_NOT_CONFIGURED",
      });
    }

    const resolvedModel = selectModelForProvider("openai", model);

    const payload = {
      model: resolvedModel,
      temperature,
      max_tokens: maxTokens,
      messages,
    };

    if (jsonSchema) {
      payload.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: jsonSchema,
        },
      };
    }

    const response = await client.chat.completions.create(payload);

    const text = response.choices?.[0]?.message?.content || "";

    return {
      text,
      usage: response.usage,
      model: response.model,
      provider: "openai",
    };
  } catch (error) {
    if (
      error?.provider === "openai" &&
      error?.code === "AI_PROVIDER_NOT_CONFIGURED"
    ) {
      throw error;
    }
    const status =
      error?.status ??
      error?.response?.status ??
      error?.statusCode ??
      error?.code ??
      undefined;
    const type =
      status === 400 || status === 422 ? "invalid_request" : undefined;
    console.error("OpenAI error:", error.message);
    throw createProviderError("OpenAI API call failed", {
      provider: "openai",
      status,
      type,
      cause: error,
    });
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {Buffer|Stream} audioFile - Audio file buffer or stream
 * @param {Object} config - Optional: language, model
 * @returns {Promise<{text: string, language: string}>}
 */
export async function transcribeWithOpenAI(audioFile, config = {}) {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error("OpenAI is not configured. Set OPENAI_API_KEY in .env");
    }

    const { language = "en", model = "whisper-1" } = config;

    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model,
      language,
    });

    return {
      text: response.text,
      language,
      provider: "openai",
    };
  } catch (error) {
    const safeError = new Error("Whisper transcription failed");
    safeError.status = 500;
    safeError.provider = "openai";
    console.error("Whisper error:", error.message);
    throw safeError;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GEMINI FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function callGeminiFromMessages({
  messages,
  model,
  temperature = 0.7,
  maxTokens = 2048,
} = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw createProviderError("Gemini is not configured", {
      provider: "gemini",
      code: "AI_PROVIDER_NOT_CONFIGURED",
    });
  }

  const resolvedModel = selectModelForProvider("gemini", model);
  const { contents, systemInstruction } = buildGeminiPayload(messages);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
        signal: controller.signal,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const type =
        response.status === 400 || response.status === 422
          ? "invalid_request"
          : undefined;
      throw createProviderError(data?.error?.message || "Gemini API error", {
        provider: "gemini",
        status: response.status,
        type,
      });
    }

    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts.map((part) => part.text || "").join("") || "";

    return {
      text,
      usage: data?.usageMetadata
        ? {
            prompt_tokens: data.usageMetadata.promptTokenCount,
            completion_tokens: data.usageMetadata.candidatesTokenCount,
          }
        : undefined,
      model: data?.model || resolvedModel,
      provider: "gemini",
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createProviderError("Gemini request timed out", {
        provider: "gemini",
        status: 504,
      });
    }

    if (error?.provider === "gemini") {
      throw error;
    }

    const status = error?.status;
    const type =
      status === 400 || status === 422 ? "invalid_request" : undefined;
    console.error("Gemini error:", error.message);
    throw createProviderError("Gemini API call failed", {
      provider: "gemini",
      status,
      type,
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CANONICAL ENTRY POINT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Canonical LLM entry point
 * @param {Object} params
 * @param {Array} params.messages
 * @param {string} params.model
 * @param {number} params.maxTokens
 * @param {number} params.temperature
 * @param {Object} params.jsonSchema
 * @returns {Promise<{text: string, usage: Object, provider: string, model: string}>}
 */
export async function callLLM({
  messages = [],
  model,
  maxTokens = 2048,
  temperature = 0.7,
  jsonSchema,
} = {}) {
  if (!Array.isArray(messages)) {
    throw new Error("callLLM requires a messages array");
  }

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);

  if (PROVIDER_MODE === "gemini" && !geminiConfigured) {
    throw createProviderError("Gemini is not configured", {
      provider: "gemini",
      code: "AI_PROVIDER_NOT_CONFIGURED",
    });
  }

  if (PROVIDER_MODE === "openai" && !openaiConfigured) {
    throw createProviderError("OpenAI is not configured", {
      provider: "openai",
      code: "AI_PROVIDER_NOT_CONFIGURED",
    });
  }

  const orderedProviders = (() => {
    if (PROVIDER_MODE === "gemini") return ["gemini"];
    if (PROVIDER_MODE === "openai") return ["openai"];
    if (geminiConfigured) return ["gemini", "openai"];
    if (openaiConfigured) return ["openai"];
    return [];
  })();

  if (orderedProviders.length === 0) {
    throw createProviderError(
      "No LLM providers configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env",
      {
        code: "AI_PROVIDER_NOT_CONFIGURED",
      }
    );
  }

  let lastError;

  for (const provider of orderedProviders) {
    try {
      if (provider === "gemini") {
        return await callGeminiFromMessages({
          messages,
          model,
          temperature,
          maxTokens,
        });
      }

      if (provider === "openai") {
        return await callOpenAIFromMessages({
          messages,
          model,
          temperature,
          maxTokens,
          jsonSchema,
        });
      }
    } catch (error) {
      lastError = error;
      if (PROVIDER_MODE !== "auto" || !shouldFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

// ═════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Call OpenAI Chat Completion API
 * @param {string} systemPrompt - System message for context
 * @param {string} userMessage - User input
 * @param {Object} config - Optional: model, temperature, max_tokens
 * @returns {Promise<{text: string, message: string, usage: Object, model: string}>}
 */
export async function callOpenAI(systemPrompt, userMessage, config = {}) {
  const { model, temperature = 0.7, max_tokens = 2048 } = config;

  const response = await callOpenAIFromMessages({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    model,
    temperature,
    maxTokens: max_tokens,
  });

  return {
    text: response.text,
    message: response.text,
    usage: response.usage,
    model: response.model,
    provider: response.provider,
  };
}

/**
 * Automatically select best available provider
 * @param {string} systemPrompt - System message
 * @param {string} userMessage - User input
 * @param {Object} config - Optional config
 * @returns {Promise<Object>} Response from selected provider
 */
export async function callBestAvailable(
  systemPrompt,
  userMessage,
  config = {}
) {
  const response = await callLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    model: config?.model,
    maxTokens: config?.max_tokens,
    temperature: config?.temperature,
  });

  return {
    ...response,
    message: response.text,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// SPECIALIZED FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<{sentiment: string, score: number}>}
 */
export async function analyzeSentiment(text) {
  const prompt = `Analyze the sentiment of this text. Respond with ONLY a JSON object: {"sentiment": "positive|neutral|negative", "score": 0-100}

Text: "${text}"`;

  try {
    const response = await callBestAvailable(
      "You are a sentiment analysis expert.",
      prompt,
      { max_tokens: 50 }
    );

    const responseText = response?.text ?? response?.message;
    if (typeof responseText !== "string")
      return { sentiment: "neutral", score: 50 };

    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return { sentiment: "neutral", score: 50 };
  } catch (error) {
    console.error("Sentiment analysis error:", error.message);
    return { sentiment: "neutral", score: 50 };
  }
}

/**
 * Generate insights or suggestions
 * @param {string} context - Context/topic for insights
 * @param {number} count - Number of insights to generate
 * @returns {Promise<string[]>} Array of insights
 */
export async function generateInsights(context, count = 3) {
  const prompt = `Generate ${count} concise, actionable insights based on: "${context}"
Return as JSON array: ["insight1", "insight2", ...]`;

  try {
    const response = await callBestAvailable(
      "You are an expert life coach providing actionable insights.",
      prompt,
      { max_tokens: 500 }
    );

    const responseText = response?.text ?? response?.message;
    if (typeof responseText !== "string") return [];

    const match = responseText.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return [];
  } catch (error) {
    console.error("Insight generation error:", error.message);
    return [];
  }
}

/**
 * Check if message indicates a crisis/emergency
 * @param {string} message - User message to check
 * @returns {Promise<{isCrisis: boolean, confidence: number, recommendation: string}>}
 */
export async function detectCrisis(message) {
  const prompt = `Determine if this message indicates someone in crisis/emergency.
Respond with JSON: {"isCrisis": true/false, "confidence": 0-100, "recommendation": "..."}

Message: "${message}"`;

  try {
    const response = await callBestAvailable(
      "You are a mental health crisis detection system. Be cautious and err on the side of safety.",
      prompt,
      { max_tokens: 100 }
    );

    const responseText = response?.text ?? response?.message;
    if (typeof responseText !== "string") {
      return {
        isCrisis: false,
        confidence: 0,
        recommendation: "Unable to analyze",
      };
    }

    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return {
      isCrisis: false,
      confidence: 0,
      recommendation: "Unable to analyze",
    };
  } catch (error) {
    console.error("Crisis detection error:", error.message);
    return {
      isCrisis: false,
      confidence: 0,
      recommendation: "System error",
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CHECK
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check which LLM providers are configured
 * @returns {Object} Configuration status
 */
export function getAvailableProviders() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    geminiModel: DEFAULT_GEMINI_MODEL,
    openaiModel: DEFAULT_OPENAI_MODEL,
    mode: PROVIDER_MODE,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export const _internal = {
  get openaiClient() {
    return openaiClient;
  },
};

export { SAFE_TEXT_FALLBACK };
