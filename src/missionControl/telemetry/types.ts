/**
 * Phase 3.5 — Telemetry Types
 * Derived, read-only metrics. No decisions.
 */

export interface MissionControlActionTelemetry {
  actionId: string;
  invokedCount: number;
  completedCount: number;
  errorCount: number;
  lastInvokedTs?: number;
  lastCompletedTs?: number;
  avgDurationMs?: number;
}
