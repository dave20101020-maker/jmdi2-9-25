/**
 * Phase 6.0 — Personalisation adapter
 *
 * Read-only stub. Persistence comes later.
 */

import type { MissionControlPersonalisation } from "./types";
import { capabilities } from "../flags/capabilities";
import { readLocalPersonalisation } from "./localPersonalisationAdapter";

export function getMissionControlPersonalisation(): MissionControlPersonalisation | null {
  if (!capabilities.MC_PERSONALISATION_PERSISTENCE_ENABLED) {
    return null;
  }

  return readLocalPersonalisation();
}
