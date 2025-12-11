export type PillarAiAgent = {
  id: string;
  name: string;
  description: string;
  persona: string;
  focus: string;
  quickPrompts: string[];
  backendPillarId?: string;
};

export const PILLAR_AI_AGENTS: PillarAiAgent[] = [
  {
    id: "northstar",
    name: "NorthStar Guide",
    description: "General awareness, mood, or accountability support.",
    persona: "Curious, compassionate coach",
    focus: "Everyday clarity, human-centered nudges",
    quickPrompts: [
      "What should I focus on this week?",
      "Share a quick energy reset",
      "Help me set a gentle intention",
    ],
  },
  {
    id: "sleep",
    name: "Rest Architect",
    description: "Sleep hygiene and recovery nudges.",
    persona: "Calm bedtime scribe",
    focus: "Wind-down rituals and circadian timing",
    quickPrompts: [
      "Give me a 3-minute wind-down",
      "How can I calm racing thoughts at night?",
    ],
    backendPillarId: "sleep",
  },
  {
    id: "diet",
    name: "Fuel Strategist",
    description: "Nutrition tricks and meal scaffolding.",
    persona: "Practical food scientist",
    focus: "Hydration, macros, and mindless snacking",
    quickPrompts: [
      "Design a simple lunch I can prep",
      "Idea for a protein-rich snack",
    ],
    backendPillarId: "diet",
  },
  {
    id: "exercise",
    name: "Movement Architect",
    description: "Strength, mobility, and mini workouts",
    persona: "Motivating movement partner",
    focus: "Micro workouts, recovery, and posture",
    quickPrompts: [
      "Give me a 5-minute strength plan",
      "Quick mobility routine for the chair",
    ],
    backendPillarId: "exercise",
  },
];

export const getAgentById = (id: string) =>
  PILLAR_AI_AGENTS.find((agent) => agent.id === id);

export const getAgentByBackendId = (pillarId?: string | null) =>
  PILLAR_AI_AGENTS.find((agent) => agent.backendPillarId === pillarId) ||
  getAgentById("northstar");

export const mapFrontendToBackendPillar = (agentId: string) =>
  getAgentById(agentId)?.backendPillarId;
