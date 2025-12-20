/**
 * Local-only Mission Control action handlers.
 * Phase 2.2: UI affordances only — no data, no AI, no persistence.
 */

export const localActionHandlers = {
  ASK_AI_COACH: () => {
    console.info("[MC][Action] Open AI coach placeholder");
    alert("AI coach coming next — this is a placeholder.");
  },

  LOG_HABIT: () => {
    console.info("[MC][Action] Open habit log placeholder");
    alert("Habit logging UI coming next.");
  },

  REVIEW_PRIORITIES: () => {
    console.info("[MC][Action] Scroll to priorities section");
    document
      .querySelector("[data-mc-section='pillar-progress']")
      ?.scrollIntoView({ behavior: "smooth" });
  },
};
