/**
 * Phase 6.1 — Local personalisation persistence (DEV)
 *
 * Explicit user overrides only.
 * Silent failure by design.
 */

import type { MissionControlPersonalisation } from "./types";

const STORAGE_KEY = "northstar.mc.personalisation";

export function readLocalPersonalisation(): MissionControlPersonalisation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeLocalPersonalisation(
  value: MissionControlPersonalisation
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Silent by design
  }
}
