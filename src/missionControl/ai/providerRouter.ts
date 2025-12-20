/**
 * Phase 3.0 — Provider Router (INERT)
 *
 * This file defines the seam where providers (OpenAI, Anthropic, etc.)
 * will be plugged in later. It is NOT invoked while the feature flag is OFF.
 */

import type { NorthStarAIRequest, NorthStarAIResponse } from "./types";

export async function routeToProvider(
  _req: NorthStarAIRequest
): Promise<NorthStarAIResponse> {
  /**
   * Intentionally unreachable in Phase 3.0.
   * Real implementation will live here later.
   */
  return {
    status: "mocked",
    message: "AI routing is not enabled.",
  };
}
