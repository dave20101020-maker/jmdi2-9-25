import { MISSION_CONTROL_MODULES as M } from "./modules/missionControlRegistry";

export function getMissionControlModules() {
  // Static for now — intelligence comes later
  return [
    M.CRISIS_MODE,
    M.SMART_NOTIFICATIONS,
    M.GOAL_ROADMAP,
    M.NEXT_BEST_STEP,
    M.QUICK_ACTIONS,
    M.DAILY_READINESS,
    M.PILLAR_PROGRESS,
    M.STREAK_TRACKER,
  ];
}
