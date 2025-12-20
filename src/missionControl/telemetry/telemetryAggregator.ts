/**
 * Phase 3.5 — Telemetry Aggregator
 *
 * In-memory only.
 * Must never influence runtime behavior.
 */

import type { MissionControlActionTelemetry } from "./types";
import type { MissionControlActionEvent } from "../persistence/types";

const telemetryMap = new Map<string, MissionControlActionTelemetry>();
const inFlightInvocations = new Map<string, number>();

export function recordActionEvent(event: MissionControlActionEvent): void {
  const entry = telemetryMap.get(event.actionId) ?? {
    actionId: event.actionId,
    invokedCount: 0,
    completedCount: 0,
    errorCount: 0,
  };

  if (event.type === "invoked") {
    entry.invokedCount += 1;
    entry.lastInvokedTs = event.ts;
    inFlightInvocations.set(event.actionId, event.ts);
  }

  if (event.type === "completed") {
    entry.completedCount += 1;
    entry.lastCompletedTs = event.ts;

    if (event.outcome === "error") {
      entry.errorCount += 1;
    }

    const startTs = inFlightInvocations.get(event.actionId);
    if (startTs) {
      const duration = event.ts - startTs;
      entry.avgDurationMs =
        entry.avgDurationMs == null
          ? duration
          : Math.round((entry.avgDurationMs + duration) / 2);
      inFlightInvocations.delete(event.actionId);
    }
  }

  telemetryMap.set(event.actionId, entry);
}

// DEV-ONLY read helper (not imported by runtime logic)
export function readTelemetrySnapshot(): MissionControlActionTelemetry[] {
  return Array.from(telemetryMap.values());
}
