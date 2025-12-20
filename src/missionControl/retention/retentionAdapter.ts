/**
 * Phase 7.0 — Retention adapter (INERT)
 *
 * Exists to define seams only.
 */

import type { RetentionCohort, RetentionStreak } from "./types";

export function getActiveRetentionCohorts(): RetentionCohort[] {
  return [];
}

export function getActiveRetentionStreaks(): RetentionStreak[] {
  return [];
}
