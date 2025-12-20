import { missionControlActions } from "./missionControlActions";
import { localActionHandlers } from "./localActionHandlers";
import { emitMissionControlActionEvent } from "../persistence/missionControlPersistence";

export async function executeMissionControlAction(actionId, context = {}) {
  // Phase 4.0: append-only "invoked" event (HARD-OFF via capability flag)
  try {
    await emitMissionControlActionEvent({
      type: "invoked",
      actionId,
      ts: Date.now(),
      meta: { source: "mission-control" },
    });
  } catch {
    // Never block action execution due to persistence
  }

  const action = missionControlActions[actionId];

  if (!action) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[MC] Unknown action:", actionId);
    }
    return;
  }

  const handler = localActionHandlers[actionId];

  if (!handler) {
    if (process.env.NODE_ENV === "development") {
      console.info("[MC] No-op action:", actionId, context);
    }
    return;
  }

  try {
    const result = await Promise.resolve(handler(context));

    // Phase 4.0: append-only "completed" event (success)
    try {
      await emitMissionControlActionEvent({
        type: "completed",
        actionId,
        ts: Date.now(),
        outcome: "success",
        meta: { source: "mission-control" },
      });
    } catch {
      // Never block action execution due to persistence
    }

    // UI-only signal for lightweight micro-responses (no persistence, no AI)
    try {
      if (typeof window !== "undefined" && "CustomEvent" in window) {
        window.dispatchEvent(
          new CustomEvent("mission-control:action", {
            detail: { actionId, phase: "completed", outcome: "success" },
          })
        );
      }
    } catch {
      // Never block action execution due to UI affordances
    }

    return result;
  } catch (err) {
    // Phase 4.0: append-only "completed" event (error)
    try {
      await emitMissionControlActionEvent({
        type: "completed",
        actionId,
        ts: Date.now(),
        outcome: "error",
        meta: { source: "mission-control" },
      });
    } catch {
      // Never block action execution due to persistence
    }

    try {
      if (typeof window !== "undefined" && "CustomEvent" in window) {
        window.dispatchEvent(
          new CustomEvent("mission-control:action", {
            detail: { actionId, phase: "completed", outcome: "error" },
          })
        );
      }
    } catch {
      // Never block action execution due to UI affordances
    }

    throw err;
  }
}
