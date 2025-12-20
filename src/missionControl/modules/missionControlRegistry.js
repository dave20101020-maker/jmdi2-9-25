export const MISSION_CONTROL_MODULES = {
  CRISIS_MODE: {
    id: "CRISIS_MODE",
    type: "CRISIS_MODE",
    order: 100,
    defaultVisible: true,
  },
  SMART_NOTIFICATIONS: {
    id: "SMART_NOTIFICATIONS",
    type: "SMART_NOTIFICATIONS",
    order: 110,
    defaultVisible: true,
  },
  GOAL_ROADMAP: {
    id: "GOAL_ROADMAP",
    type: "GOAL_ROADMAP",
    order: 120,
    defaultVisible: true,
  },
  NEXT_BEST_STEP: {
    id: "NEXT_BEST_STEP",
    type: "NEXT_BEST_STEP",
    order: 130,
    defaultVisible: true,
  },
  QUICK_ACTIONS: {
    id: "QUICK_ACTIONS",
    type: "QUICK_ACTIONS",
    order: 140,
    defaultVisible: true,
  },
  DAILY_READINESS: {
    id: "DAILY_READINESS",
    type: "DAILY_READINESS",
    order: 150,
    defaultVisible: true,
  },
  PILLAR_PROGRESS: {
    id: "PILLAR_PROGRESS",
    type: "PILLAR_PROGRESS",
    order: 160,
    defaultVisible: true,
  },
  STREAK_TRACKER: {
    id: "STREAK_TRACKER",
    type: "STREAK_TRACKER",
    order: 170,
    defaultVisible: true,
  },

  // Canonical IDs for currently implemented Mission Control modules
  PRIORITY_ACTION: {
    id: "PRIORITY_ACTION",
    type: "PRIORITY_ACTION",
    order: 1,
    defaultVisible: true,
  },
  EMPTY_STATE_GUIDANCE: {
    id: "EMPTY_STATE_GUIDANCE",
    type: "EMPTY_STATE_GUIDANCE",
    order: 99,
    defaultVisible: true,
  },
  NARRATIVE_INSIGHT: {
    id: "NARRATIVE_INSIGHT",
    type: "NARRATIVE_INSIGHT",
    order: 2,
    defaultVisible: true,
  },
  OVERALL_SCORE: {
    id: "OVERALL_SCORE",
    type: "OVERALL_SCORE",
    order: 3,
    defaultVisible: true,
  },
  PILLAR_OVERVIEW: {
    id: "PILLAR_OVERVIEW",
    type: "PILLAR_OVERVIEW",
    order: 4,
    defaultVisible: true,
  },
  MOMENTUM: {
    id: "MOMENTUM",
    type: "MOMENTUM",
    order: 5,
    defaultVisible: true,
  },
  SUPPORT: {
    id: "SUPPORT",
    type: "SUPPORT",
    order: 6,
    defaultVisible: true,
  },
  AI_ENTRY: {
    id: "AI_ENTRY",
    type: "AI_ENTRY",
    order: 7,
    defaultVisible: true,
  },
};

// Alias for Phase 1.5 terminology (additive, no runtime impact)
export const missionControlRegistry = MISSION_CONTROL_MODULES;
