/**
 * Phase 3.0 — AI Invocation Contract (READ-ONLY)
 * These types define the final-form contract.
 * Values are mocked until the feature flag is enabled.
 */

export type NorthStarAIActionId = string;

export interface NorthStarAIRequest {
  actionId: NorthStarAIActionId;
  /**
   * Minimal contextual payload provided by Mission Control.
   * Shape is intentionally flexible but explicit.
   */
  context: Record<string, unknown>;
  /**
   * Reserved for future routing / safety metadata.
   */
  meta?: {
    source?: "mission-control";
    timestamp?: number;
  };
}

export interface NorthStarAIResponse {
  status: "disabled" | "mocked" | "ok";
  /**
   * Human-readable, tentative system message.
   */
  message: string;
  /**
   * Optional structured payload for future use.
   */
  payload?: Record<string, unknown>;
}
