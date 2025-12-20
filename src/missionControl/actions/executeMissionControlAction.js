import { missionControlActions } from "./missionControlActions";
import { localActionHandlers } from "./localActionHandlers";

export function executeMissionControlAction(actionId, context = {}) {
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

  handler(context);
}
