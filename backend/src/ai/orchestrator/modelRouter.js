/**
 * Intelligent Model Router
 *
 * Chooses optimal AI model for task:
 * - GPT-4-turbo: Reasoning, classification, planning
 * - Claude-3: Long-form responses, narrative, complex context
 * - Override: Agent-specific or user-specified model
 *
 * Usage:
 *   const config = selectOptimalModel(taskType, context);
 *   const response = await config.handler({prompt, systemPrompt, context});
 */

import logger from "../../utils/logger.js";

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
 * Task types that route to Claude (narrative/context)
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
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

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
    reason = `Narrative task (${taskType}): Claude-3 for warmth`;
  } else {
    // Smart heuristic: if context is large/complex, use Claude
    const contextSize = context.contextString?.length || 0;
    if (contextSize > 2000) {
      selectedModel = "claude";
      reason = `Large context (${contextSize} chars): Claude-3 for handling complexity`;
    } else {
      selectedModel = "gpt";
      reason = `Default task type (${taskType}): GPT-4 for reasoning`;
    }
  }

  logger.info(`Model selected: ${selectedModel} - ${reason}`);

  // Provider availability fallback
  // If Anthropic isn't configured, fall back to GPT. GPT handler will emit a
  // clear error if OpenAI isn't configured.
  if (selectedModel === "claude" && !hasAnthropic) {
    selectedModel = "gpt";
    reason = `${reason} (Anthropic not configured; falling back to GPT)`;
    logger.warn(
      "Claude selected but ANTHROPIC_API_KEY missing; falling back to GPT",
      {
        taskType,
        pillar: context?.pillar,
      }
    );
  }

  if (selectedModel === "gpt" && !hasOpenAI && hasAnthropic) {
    selectedModel = "claude";
    reason = `${reason} (OpenAI not configured; falling back to Claude)`;
    logger.warn(
      "GPT selected but OPENAI_API_KEY missing; falling back to Claude",
      {
        taskType,
        pillar: context?.pillar,
      }
    );
  }

  if (selectedModel === "claude" && !hasAnthropic && !hasOpenAI) {
    throw new Error(
      "AI provider error: No AI provider is configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY)"
    );
  }

  if (selectedModel === "gpt" && !hasOpenAI && !hasAnthropic) {
    throw new Error(
      "AI provider error: No AI provider is configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY)"
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
      modelName: "Claude-3-Sonnet",
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
    if (!apiKey) {
      throw new Error("AI provider error: OPENAI_API_KEY is not configured");
    }

    const openai = (await import("openai")).default;
    const client = new openai({
      apiKey,
    });

    // Inject context into system prompt if provided
    let finalSystemPrompt = systemPrompt;
    if (context.contextString) {
      finalSystemPrompt = `${systemPrompt}\n\n${context.contextString}`;
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
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
      temperature: 0.6,
      max_tokens: 1500,
      top_p: 0.95,
    });

    return {
      text: response.choices[0].message.content,
      model: "gpt-4-turbo",
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: response.choices[0].finish_reason,
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
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("AI provider error: ANTHROPIC_API_KEY is not configured");
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Inject context into system prompt if provided
    let finalSystemPrompt = systemPrompt;
    if (context.contextString) {
      finalSystemPrompt = `${systemPrompt}\n\n${context.contextString}`;
    }

    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      temperature: 0.7,
      system: finalSystemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return {
      text: response.content[0].type === "text" ? response.content[0].text : "",
      model: "claude-3-sonnet",
      tokensUsed:
        response.usage?.input_tokens + response.usage?.output_tokens || 0,
      finishReason: response.stop_reason,
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
