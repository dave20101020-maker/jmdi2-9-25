/**
 * Local-only Mission Control action handlers.
 * Phase 2.2: UI affordances only — no data, no AI, no persistence.
 */

import { openMissionControlOverlay } from "./actionOverlayHost";

function pulseHighlight(target) {
  if (!target) return;

  const prevTransition = target.style.transition;
  const prevOutline = target.style.outline;
  const prevOutlineOffset = target.style.outlineOffset;

  target.style.transition = "outline-color 180ms ease-in-out";
  target.style.outline = "2px solid rgba(255,255,255,0.0)";
  target.style.outlineOffset = "6px";

  // Kick the animation.
  requestAnimationFrame(() => {
    target.style.outline = "2px solid rgba(255,255,255,0.55)";
    setTimeout(() => {
      target.style.outline = "2px solid rgba(255,255,255,0.0)";
      setTimeout(() => {
        target.style.transition = prevTransition;
        target.style.outline = prevOutline;
        target.style.outlineOffset = prevOutlineOffset;
      }, 250);
    }, 900);
  });
}

function showHelperTextNear(target, message) {
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const el = document.createElement("div");
  el.textContent = message;
  el.style.position = "fixed";
  el.style.left = `${Math.max(12, rect.left)}px`;
  el.style.top = `${Math.max(12, rect.top - 36)}px`;
  el.style.zIndex = "60";
  el.style.padding = "8px 10px";
  el.style.borderRadius = "10px";
  el.style.background = "rgba(15,23,42,0.85)";
  el.style.border = "1px solid rgba(255,255,255,0.15)";
  el.style.color = "rgba(255,255,255,0.9)";
  el.style.fontSize = "12px";
  el.style.backdropFilter = "blur(10px)";

  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 1800);
}

export const localActionHandlers = {
  ASK_AI_COACH: () => {
    console.info("[MC][Action] Open AI coach placeholder");
    openMissionControlOverlay("ASK_AI_COACH");
  },

  LOG_HABIT: () => {
    console.info("[MC][Action] Open habit log placeholder");
    openMissionControlOverlay("LOG_HABIT");
  },

  REVIEW_PRIORITIES: () => {
    console.info("[MC][Action] Scroll to priorities section");

    const target =
      document.querySelector("[data-mc-section='pillar-progress']") ||
      document.querySelector("#mc-pillars");

    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    pulseHighlight(target);
    showHelperTextNear(target, "This is where focus shifts.");
  },
};
