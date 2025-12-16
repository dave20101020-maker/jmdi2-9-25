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
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic (Claude 3 series)
 * - Fallback: Mock responses for development
 */

const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");

// ═════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════════

let openaiClient = null;
let anthropicClient = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn("⚠️ OpenAI client initialization failed:", error.message);
}

try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
} catch (error) {
  console.warn("⚠️ Anthropic client initialization failed:", error.message);
}

// ═════════════════════════════════════════════════════════════════════════════
// OPENAI FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Call OpenAI Chat Completion API
 * @param {string} systemPrompt - System message for context
 * @param {string} userMessage - User input
 * @param {Object} config - Optional: model, temperature, max_tokens
 * @returns {Promise<{text: string, message: string, usage: Object, model: string}>}
 */
async function callOpenAI(systemPrompt, userMessage, config = {}) {
  try {
    if (!openaiClient) {
      throw new Error("OpenAI is not configured. Set OPENAI_API_KEY in .env");
    }

    const {
      model = process.env.OPENAI_MODEL || "gpt-4-turbo",
      temperature = 0.7,
      max_tokens = 2048,
    } = config;

    const response = await openaiClient.chat.completions.create({
      model,
      temperature,
      max_tokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0].message.content;

    return {
      text,
      message: text,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
      },
      model: response.model,
      provider: "openai",
    };
  } catch (error) {
    // ⚠️ SECURITY: Never expose API key in error messages
    const safeError = new Error("OpenAI API call failed");
    safeError.status = 500;
    safeError.provider = "openai";
    console.error("OpenAI error:", error.message);
    throw safeError;
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {Buffer|Stream} audioFile - Audio file buffer or stream
 * @param {Object} config - Optional: language, model
 * @returns {Promise<{text: string, language: string}>}
 */
async function transcribeWithOpenAI(audioFile, config = {}) {
  try {
    if (!openaiClient) {
      throw new Error("OpenAI is not configured. Set OPENAI_API_KEY in .env");
    }

    const { language = "en", model = "whisper-1" } = config;

    // Convert buffer to File-like object if needed
    const formFile = {
      name: "audio.webm",
      data: audioFile,
    };

    const response = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model,
      language,
    });

    return {
      text: response.text,
      language: language,
      provider: "openai",
    };
  } catch (error) {
    // ⚠️ SECURITY: Never expose API key in error messages
    const safeError = new Error("Whisper transcription failed");
    safeError.status = 500;
    safeError.provider = "openai";
    console.error("Whisper error:", error.message);
    throw safeError;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ANTHROPIC FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Call Anthropic Claude API
 * @param {string} systemPrompt - System message for context
 * @param {string} userMessage - User input
 * @param {Object} config - Optional: model, temperature, max_tokens
 * @returns {Promise<{text: string, message: string, usage: Object, model: string}>}
 */
async function callClaude(systemPrompt, userMessage, config = {}) {
  try {
    if (!anthropicClient) {
      throw new Error(
        "Anthropic is not configured. Set ANTHROPIC_API_KEY in .env"
      );
    }

    const {
      model = process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
      temperature = 0.7,
      max_tokens = 2048,
    } = config;

    const response = await anthropicClient.messages.create({
      model,
      max_tokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content[0].text;

    return {
      text,
      message: text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      model: response.model,
      provider: "anthropic",
    };
  } catch (error) {
    // ⚠️ SECURITY: Never expose API key in error messages
    const safeError = new Error("Anthropic API call failed");
    safeError.status = 500;
    safeError.provider = "anthropic";
    console.error("Anthropic error:", error.message);
    throw safeError;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// INTELLIGENT ROUTING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Automatically select best available provider
 * @param {string} systemPrompt - System message
 * @param {string} userMessage - User input
 * @param {Object} config - Optional config
 * @returns {Promise<Object>} Response from selected provider
 */
async function callBestAvailable(systemPrompt, userMessage, config = {}) {
  const { preferProvider = null, fallbackToGPT = true } = config;

  const providers = {
    anthropic: anthropicClient,
    openai: openaiClient,
  };

  const claudeAvailable = Boolean(providers.anthropic);
  const openaiAvailable = Boolean(providers.openai);

  // ─────────────────────────────────────────────────────────────
  // HARD RULE:
  // If a preferred provider is explicitly requested and available,
  // we MUST use it. llm.js must never override modelRouter intent.
  // ─────────────────────────────────────────────────────────────

  // Try preferred provider first
  if (preferProvider === "anthropic" && claudeAvailable) {
    return callClaude(systemPrompt, userMessage, config);
  }
  if (preferProvider === "openai" && openaiAvailable) {
    return callOpenAI(systemPrompt, userMessage, config);
  }

  // Default: try OpenAI first, fallback to Claude
  if (openaiAvailable && fallbackToGPT) {
    try {
      return await callOpenAI(systemPrompt, userMessage, config);
    } catch (error) {
      if (claudeAvailable) {
        console.warn("OpenAI failed, falling back to Claude");
        return await callClaude(systemPrompt, userMessage, config);
      }
      throw error;
    }
  }

  // Try Claude if OpenAI not available
  if (claudeAvailable) {
    try {
      return await callClaude(systemPrompt, userMessage, config);
    } catch (error) {
      if (openaiAvailable && fallbackToGPT) {
        console.warn("Claude failed, falling back to OpenAI");
        return await callOpenAI(systemPrompt, userMessage, config);
      }
      throw error;
    }
  }

  // No providers configured
  throw new Error(
    "No LLM providers configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env"
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SPECIALIZED FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<{sentiment: string, score: number}>}
 */
async function analyzeSentiment(text) {
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

    // Parse JSON response
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
async function generateInsights(context, count = 3) {
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

    // Parse JSON array
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
async function detectCrisis(message) {
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
function getAvailableProviders() {
  return {
    openai: !!openaiClient,
    anthropic: !!anthropicClient,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4-turbo",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Core functions
  callOpenAI,
  callClaude,
  callBestAvailable,
  transcribeWithOpenAI,

  // Specialized functions
  analyzeSentiment,
  generateInsights,
  detectCrisis,

  // Utilities
  getAvailableProviders,

  // Internal clients (for testing only)
  _internal: {
    openaiClient,
    anthropicClient,
  },
};
