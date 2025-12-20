/**
 * DEV helper — read persisted Mission Control action events.
 * Never used by runtime logic.
 */

import type { MissionControlActionEvent } from "./types";

const STORAGE_KEY = "northstar.mc.actionEvents";

export function readLocalActionEvents(): MissionControlActionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
