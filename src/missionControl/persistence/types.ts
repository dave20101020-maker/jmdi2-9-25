/**
 * Phase 4.0 — Persistence (READ-ONLY, append-only events)
 *
 * These types define the canonical event contract for Mission Control actions.
 * Emission is HARD-OFF by default via capabilities.MC_PERSISTENCE_ENABLED.
 */

export type MissionControlActionEventType = "invoked" | "completed";

export interface MissionControlActionEvent {
  type: MissionControlActionEventType;
  actionId: string;
  /**
   * Timestamp for event ordering (append-only).
   */
  ts: number;
  /**
   * Optional lightweight metadata (must not affect UI/module selection yet).
   */
  meta?: Record<string, unknown>;
  /**
   * Present for "completed" events.
   */
  outcome?: "success" | "error";
}
