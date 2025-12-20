/**
 * Phase 4.0 — Mission Control Persistence Adapter (INERT by default)
 *
 * Single seam for recording action lifecycle events (invoked/completed).
 * - Append-only
 * - HARD-OFF by default
 * - Must not influence module selection or UI in Phase 4
 */

import { capabilities } from "../flags/capabilities";
import type { MissionControlActionEvent } from "./types";
import { appendActionEvent } from "./localStorageAdapter";

/**
 * Emit an append-only action event.
 *
 * Phase 4 rule: failures must never affect runtime behavior.
 */
export async function emitMissionControlActionEvent(
  _event: MissionControlActionEvent
): Promise<void> {
  if (!capabilities.MC_PERSISTENCE_ENABLED) return;

  // Phase 4.1: local dev persistence (append-only)
  appendActionEvent(_event);
}
