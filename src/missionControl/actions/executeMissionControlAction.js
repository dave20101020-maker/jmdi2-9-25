export function executeMissionControlAction(actionId, context = {}) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[MissionControl] action invoked:", actionId, context);
}
