/**
 * Phase 4.0 — Persistence (READ-ONLY, append-only events)
 *
 * These types define the canonical event contract for Mission Control actions.
 * Emission is HARD-OFF by default via capabilities.MC_PERSISTENCE_ENABLED.
 */

export type MissionControlActionLifecycle =
  | "shown"
  | "acted"
  | "deferred"
  | "dismissed"
  | MissionControlActionEventType;

export interface MissionControlActionEvent {
  type: MissionControlActionLifecycle;
  actionId: string;
  /**
   * Timestamp for event ordering (append-only).
   */
  ts: number;
  /**
   * Optional lightweight metadata (must not affect UI/module selection yet).
   */
  meta?: Record<string, unknown>;
  priorityContext?: Record<string, unknown>;
}

export interface MissionControlActionState {
  actionId: string;
  lifecycle: MissionControlActionLifecycle;
  lastUpdatedAt: number;
  userAgency?: {
    deferred?: boolean;
    dismissed?: boolean;
    pinned?: boolean;
  };
  priorityContext?: Record<string, unknown>;
}
