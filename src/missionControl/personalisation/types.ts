/**
 * Phase 6.0 — Mission Control personalisation
 * Explicit user overrides only (no AI).
 */

export interface MissionControlPersonalisation {
  pinnedModuleIds: string[];
  hiddenModuleIds: string[];
  orderedModuleIds: string[];
}
