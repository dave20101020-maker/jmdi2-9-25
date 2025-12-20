/**
 * Mission Control capability flags.
 * Phase 3.0: AI invocation contract is scaffolded but HARD-OFF.
 */

export const capabilities = {
  AI_INVOCATION_ENABLED: false,
  /**
   * Phase 4.0 — Mission Control action event persistence (append-only).
   * HARD-OFF by default.
   */
  MC_PERSISTENCE_ENABLED: false,
} as const;
