/**
 * Phase 7.0 — Ethical Retention (Contracts Only)
 * No enforcement. No decisions. No UI.
 */

export type RetentionMode = "individual" | "cohort";

export interface RetentionCohort {
  id: string;
  name: string;
  mode: "cohort";
  startsAt: number;
  endsAt?: number;
  graceDays?: number;
}

export interface RetentionStreak {
  id: string;
  actionId: string;
  mode: RetentionMode;
  forgiving: true; // locked: no punitive streaks
}
