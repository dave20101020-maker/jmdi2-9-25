/**
 * Agent Router
 *
 * Centralizes routing to a specific NorthStar agent.
 *
 * CRITICAL GUARDS:
 * - Pillar agents must only be used when the caller explicitly requests pillar_direct.
 * - On NorthStar (general) failures, do NOT fall back to a pillar agent.
 */

import { runSleepAgent } from "../agents/sleepAgent.js";
import { runMentalHealthAgent } from "../agents/mentalHealthAgent.js";
import { runNutritionAgent } from "../agents/nutritionAgent.js";
import { runFitnessAgent } from "../agents/fitnessAgent.js";
import { runPhysicalHealthAgent } from "../agents/physicalHealthAgent.js";
import { runFinancesAgent } from "../agents/financesAgent.js";
import { runSocialAgent } from "../agents/socialAgent.js";
import { runSpiritualityAgent } from "../agents/spiritualityAgent.js";
import { runWithBestModel } from "../modelRouter.js";
import { buildMessageHistory } from "../agents/agentBase.js";

const NORTHSTAR_GENERAL_SYSTEM_PROMPT = `
=== NORTHSTAR AI (GENERAL) ===

IDENTITY:
- You are NorthStar AI: the central, generalist coach and routing layer.
- When asked to introduce yourself, do so briefly and warmly, then ask ONE clarifying question.

ROUTING BOUNDARIES (CRITICAL):
- Do not roleplay as a pillar specialist.
- Do not run pillar screening protocols.
- Your job is to orient the user, set expectations, and ask one question to choose the right pillar coach.

STYLE:
- Short, clear, confident.
- Ask only one question.
`.trim();

export function northstarFallbackResponse({ reason } = {}) {
  const detail = reason ? ` (reason: ${String(reason).slice(0, 160)})` : "";

  return {
    ok: false,
    pillar: "general",
    agent: "northstar",
    text: [
      `NorthStar AI is temporarily unavailable${detail}.`,
      "\nYou can:",
      "- Retry in a moment",
      "- Use Demo Mode (limited experience) if available in your build",
    ].join("\n"),
    meta: {
      fallback: true,
      fallbackType: "northstar_only",
    },
  };
}

async function runNorthStarGeneralAgent({
  context,
  userMessage,
  lastMessages,
}) {
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: NORTHSTAR_GENERAL_SYSTEM_PROMPT,
    lastMessages,
  });

  const modelResult = await runWithBestModel({
    taskType: "mixed",
    systemPrompt,
    userMessage,
    conversationHistory,
  });

  return {
    text: modelResult.text,
    model: modelResult.model,
    meta: { pillar: "general", agent: "northstar" },
  };
}

/**
 * Route directly to a specific pillar agent.
 *
 * @param {string} pillar
 * @param {Object} args
 */
export async function routeToSpecificAgent(pillar, args) {
  switch (pillar) {
    case "general":
      return runNorthStarGeneralAgent(args);
    case "sleep":
      return runSleepAgent(args);
    case "mental_health":
      return runMentalHealthAgent(args);
    case "nutrition":
      return runNutritionAgent(args);
    case "fitness":
      return runFitnessAgent(args);
    case "physical_health":
      return runPhysicalHealthAgent(args);
    case "finances":
      return runFinancesAgent(args);
    case "social":
      return runSocialAgent(args);
    case "spirituality":
      return runSpiritualityAgent(args);
    default:
      throw new Error(`Unknown pillar: ${pillar}`);
  }
}
