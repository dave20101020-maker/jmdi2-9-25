/**
 * Phase 4.1 — LocalStorage Persistence Adapter (DEV ONLY)
 *
 * Append-only storage for Mission Control action events.
 * Must never throw or block execution.
 */

import type { MissionControlActionEvent } from "./types";

const STORAGE_KEY = "northstar.mc.actionEvents";

export function appendActionEvent(event: MissionControlActionEvent): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: MissionControlActionEvent[] = raw ? JSON.parse(raw) : [];

    events.push(event);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Phase 4 rule: persistence failures are silent
  }
}
