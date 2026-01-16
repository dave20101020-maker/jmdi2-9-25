/**
 * Intelligent Model Router
 *
 * Chooses optimal AI model for task:
 * - GPT-4-turbo: Reasoning, classification, planning
 * - Gemini: Long-form responses, narrative, complex context
 * - Override: Agent-specific or user-specified model
 *
 * Usage:
 *   const config = selectOptimalModel(taskType, context);
 *   const response = await config.handler({prompt, systemPrompt, context});
 */

import logger from "../../utils/logger.js";
import { callLLM } from "../../../services/llm.js";

/**
 * Task types that route to GPT (reasoning/classification)
 */
const GPT_REASONING_TASKS = [
  "classify",
  "diagnose",
  "screen",
  "score",
  "analyze",
  "decide",
  "prioritize",
  "assess",
  "evaluate",
];

/**
 * Task types that route to Gemini (narrative/context)
 */
const CLAUDE_NARRATIVE_TASKS = [
  "coach",
  "counsel",
  "explain",
  "plan",
  "create",
  "journal",
  "reflect",
  "story",
  "guide",
];

/**
 * Agent-specific model preferences
 */
const AGENT_MODEL_PREFERENCES = {
  sleep: "gpt", // Sleep science needs precision
  fitness: "claude", // Fitness coaching needs warmth
  "mental-health": "claude", // Mental health needs empathy
  nutrition: "gpt", // Nutrition needs science
  finances: "gpt", // Finances needs reasoning
  "physical-health": "gpt", // Medical needs accuracy
  social: "claude", // Social needs warmth
  spirituality: "claude", // Spirituality needs narrative
};

/**
 * Select optimal model configuration
 * Returns object with model choice, name, reason, and handler
 */
export async function selectOptimalModel(taskType, context = {}) {
  const hasOpenAI = Boolean(
    process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY
  );
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  let selectedModel = "gpt"; // Default
  let reason = "";

  // Check for override
  if (context.forceModel) {
    selectedModel = context.forceModel;
    reason = `User/agent override: ${context.forceModel}`;
    logger.info(`Model override: ${selectedModel}`);
  } else if (context.pillar && AGENT_MODEL_PREFERENCES[context.pillar]) {
    // Check agent preference
    selectedModel = AGENT_MODEL_PREFERENCES[context.pillar];
    reason = `Agent preference (${context.pillar}): ${selectedModel}`;
    logger.info(
      `Using agent preference: ${selectedModel} for ${context.pillar}`
    );
  } else if (GPT_REASONING_TASKS.includes(taskType)) {
    // Task-based routing
    selectedModel = "gpt";
    reason = `Reasoning task (${taskType}): GPT-4 for analysis`;
  } else if (CLAUDE_NARRATIVE_TASKS.includes(taskType)) {
    selectedModel = "claude";
    reason = `Narrative task (${taskType}): Gemini for warmth`;
  } else {
    // Smart heuristic: if context is large/complex, use Claude
    const contextSize = context.contextString?.length || 0;
    if (contextSize > 2000) {
      selectedModel = "claude";
      reason = `Large context (${contextSize} chars): Gemini for handling complexity`;
    } else {
      selectedModel = "gpt";
      reason = `Default task type (${taskType}): GPT-4 for reasoning`;
    }
  }

  logger.info(`Model selected: ${selectedModel} - ${reason}`);

  // Provider availability fallback
  // If Gemini isn't configured, fall back to GPT. GPT handler will emit a
  // clear error if OpenAI isn't configured.
  if (selectedModel === "claude" && !hasGemini) {
    selectedModel = "gpt";
    reason = `${reason} (Gemini not configured; falling back to GPT)`;
    logger.warn(
      "Gemini selected but GEMINI_API_KEY missing; falling back to GPT",
      {
        taskType,
        pillar: context?.pillar,
      }
    );
  }

  if (selectedModel === "gpt" && !hasOpenAI && hasGemini) {
    selectedModel = "claude";
    reason = `${reason} (OpenAI not configured; falling back to Gemini)`;
    logger.warn(
      "GPT selected but OPENAI_API_KEY missing; falling back to Gemini",
      {
        taskType,
        pillar: context?.pillar,
      }
    );
  }

  if (selectedModel === "claude" && !hasGemini && !hasOpenAI) {
    throw new Error(
      "AI provider error: No AI provider is configured (set GEMINI_API_KEY or OPENAI_API_KEY)"
    );
  }

  if (selectedModel === "gpt" && !hasOpenAI && !hasGemini) {
    throw new Error(
      "AI provider error: No AI provider is configured (set GEMINI_API_KEY or OPENAI_API_KEY)"
    );
  }

  return buildModelConfig(selectedModel, reason);
}

/**
 * Build model configuration with handler
 */
function buildModelConfig(selectedModel, reason) {
  if (selectedModel === "claude") {
    return {
      model: "claude",
      modelName: "Gemini",
      reasonForChoice: reason,
      handler: callClaudeModel,
      maxTokens: 2000,
      temperature: 0.7,
    };
  } else {
    // Default to GPT
    return {
      model: "gpt",
      modelName: "GPT-4-Turbo",
      reasonForChoice: reason,
      handler: callGPTModel,
      maxTokens: 1500,
      temperature: 0.6,
    };
  }
}

/**
 * Call GPT-4-Turbo (reasoning, classification, precision)
 */
async function callGPTModel({ prompt, systemPrompt, context = {} }) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
    if (!apiKey && !process.env.GEMINI_API_KEY) {
      throw new Error("AI provider error: OPENAI_API_KEY is not configured");
    }

    // Inject context into system prompt if provided
    let finalSystemPrompt = systemPrompt;
    if (context.contextString) {
      finalSystemPrompt = `${systemPrompt}\n\n${context.contextString}`;
    }

    const response = await callLLM({
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.6,
      maxTokens: 1500,
    });

    return {
      text: response.text,
      model: response.model,
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: null,
    };
  } catch (error) {
    logger.error(`GPT model error: ${error.message}`);
    throw error;
  }
}

/**
 * Call Claude-3-Sonnet (narrative, empathy, long-form)
 */
async function callClaudeModel({ prompt, systemPrompt, context = {} }) {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error("AI provider error: GEMINI_API_KEY is not configured");
    }

    // Inject context into system prompt if provided
    let finalSystemPrompt = systemPrompt;
    if (context.contextString) {
      finalSystemPrompt = `${systemPrompt}\n\n${context.contextString}`;
    }

    const response = await callLLM({
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      text: response.text,
      model: response.model,
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: null,
    };
  } catch (error) {
    logger.error(`Claude model error: ${error.message}`);
    throw error;
  }
}

/**
 * Get model info for display
 */
export function getModelInfo(modelConfig) {
  return {
    name: modelConfig.modelName,
    logo:
      modelConfig.model === "claude"
        ? "🤖" // Claude icon
        : "⚡", // GPT icon
    reason: modelConfig.reasonForChoice,
    model: modelConfig.model,
  };
}

export default selectOptimalModel;
