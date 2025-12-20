/**
 * Phase 3.0 — invokeNorthStarAI (READ-ONLY)
 *
 * Single, canonical entry point for all future AI invocations.
 * HARD-DISABLED by feature flag.
 */

import { capabilities } from "../flags/capabilities";
import type {
  NorthStarAIActionId,
  NorthStarAIRequest,
  NorthStarAIResponse,
} from "./types";
import { routeToProvider } from "./providerRouter";

export async function invokeNorthStarAI(
  actionId: NorthStarAIActionId,
  context: Record<string, unknown>
): Promise<NorthStarAIResponse> {
  if (!capabilities.AI_INVOCATION_ENABLED) {
    return {
      status: "disabled",
      message:
        "AI assistance is currently unavailable. This action is handled locally.",
    };
  }

  const request: NorthStarAIRequest = {
    actionId,
    context,
    meta: {
      source: "mission-control",
      timestamp: Date.now(),
    },
  };

  // NOTE: This path is unreachable in Phase 3.0
  return routeToProvider(request);
}
