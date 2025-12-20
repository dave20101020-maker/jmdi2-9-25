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

/**
 * Emit an append-only action event.
 *
 * Phase 4 rule: failures must never affect runtime behavior.
 */
export async function emitMissionControlActionEvent(
  _event: MissionControlActionEvent
): Promise<void> {
  if (!capabilities.MC_PERSISTENCE_ENABLED) return;

  /**
   * NOTE (Phase 4):
   * This is intentionally a stub. We'll plug in:
   * - localStorage (dev) OR
   * - backend endpoint
   * in a later Phase 4.x step, still behind the same seam.
   */
  return;
}
