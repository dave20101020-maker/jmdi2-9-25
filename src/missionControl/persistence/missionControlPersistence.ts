/**
 * Phase 4.0 — Mission Control Persistence Adapter (INERT by default)
 *
 * Single seam for recording action lifecycle events (invoked/completed).
 * - Append-only
 * - HARD-OFF by default
 * - Must not influence module selection or UI in Phase 4
 */

import { capabilities } from "../flags/capabilities";
import type {
  MissionControlActionEvent,
  MissionControlActionState,
} from "./types";
import { appendActionEvent } from "./localStorageAdapter";
import { recordActionEvent } from "../telemetry/telemetryAggregator";

const ENDPOINTS = {
  actionEvent: "/api/mission-control/action/event",
  actionState: "/api/mission-control/action/state",
};

const safeFetch = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });
    return response;
  } catch (error) {
    console.warn("[MC] Persistence request failed:", error);
    return null;
  }
};

/**
 * Emit an append-only action event.
 *
 * Phase 4 rule: failures must never affect runtime behavior.
 */
export async function emitMissionControlActionEvent(
  _event: MissionControlActionEvent
): Promise<void> {
  if (!capabilities.MC_PERSISTENCE_ENABLED) return;

  const payload = {
    actionId: _event.actionId,
    lifecycle: _event.type,
    timestamp: _event.ts,
    meta: _event.meta || {},
    priorityContext: _event.priorityContext || {},
  };

  const response = await safeFetch(ENDPOINTS.actionEvent, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response?.ok) {
    console.warn("[MC] Failed to persist action event", response?.status);
  }

  // Phase 4.1: local dev persistence (append-only)
  appendActionEvent(_event);

  // Phase 3.5: derived telemetry (HARD-OFF)
  if (capabilities.MC_TELEMETRY_ENABLED) {
    recordActionEvent(_event);
  }
}

export async function persistMissionControlActionState(
  state: MissionControlActionState
): Promise<void> {
  if (!capabilities.MC_PERSISTENCE_ENABLED) return;

  const payload = {
    actionId: state.actionId,
    lifecycle: state.lifecycle,
    lastUpdatedAt: state.lastUpdatedAt,
    userAgency: state.userAgency || {},
    priorityContext: state.priorityContext || {},
  };

  const response = await safeFetch(ENDPOINTS.actionState, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response?.ok) {
    console.warn("[MC] Failed to persist action state", response?.status);
  }
}

export async function fetchMissionControlActionState(): Promise<MissionControlActionState | null> {
  if (!capabilities.MC_PERSISTENCE_ENABLED) return null;

  const response = await safeFetch(ENDPOINTS.actionState, {
    method: "GET",
  });

  if (!response?.ok) {
    console.warn("[MC] Failed to fetch action state", response?.status);
    return null;
  }

  try {
    const data = await response.json();
    return data?.state || null;
  } catch (error) {
    console.warn("[MC] Failed to parse action state response", error);
    return null;
  }
}
