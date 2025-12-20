import { MISSION_CONTROL_MODULES as M } from "./modules/missionControlRegistry";

export function getMissionControlModules() {
  // Static for now — intelligence comes later
  return [
    M.CRISIS_MODE.id,
    M.SMART_NOTIFICATIONS.id,
    M.GOAL_ROADMAP.id,
    M.NEXT_BEST_STEP.id,
    M.QUICK_ACTIONS.id,
    M.DAILY_READINESS.id,
    M.PILLAR_PROGRESS.id,
    M.STREAK_TRACKER.id,
  ];
}
