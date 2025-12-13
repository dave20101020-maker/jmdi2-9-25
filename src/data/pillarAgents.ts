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
    backendPillarId: "nutrition",
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
    backendPillarId: "fitness",
  },
  {
    id: "mental_health",
    name: "Mindful Navigator",
    description: "Mood, stress, and focus stabilization",
    persona: "Calm cognitive coach",
    focus: "Anxiety soothers, reframes, mindful resets",
    quickPrompts: [
      "Guide me through a 2-minute calm-down",
      "Reframe a negative thought",
    ],
    backendPillarId: "mental_health",
  },
  {
    id: "physical_health",
    name: "Vitality Guide",
    description: "Symptoms, recovery, and body maintenance",
    persona: "Reassuring health ally",
    focus: "Recovery cues, gentle checklists, symptom tracking",
    quickPrompts: [
      "What should I watch for after a tough workout?",
      "Checklist for feeling run-down",
    ],
    backendPillarId: "physical_health",
  },
  {
    id: "finances",
    name: "Money Mentor",
    description: "Cashflow clarity and habit nudges",
    persona: "Practical financial buddy",
    focus: "Spending review, savings nudges, goal-based planning",
    quickPrompts: [
      "Help me trim a recurring expense",
      "How do I set a weekly spending cap?",
    ],
    backendPillarId: "finances",
  },
  {
    id: "social",
    name: "Community Coach",
    description: "Relationships, outreach, and belonging",
    persona: "Warm connector",
    focus: "Light-touch outreach, conversation starters, check-ins",
    quickPrompts: [
      "Give me a quick reach-out script",
      "Idea for a low-energy social plan",
    ],
    backendPillarId: "social",
  },
  {
    id: "spirituality",
    name: "Meaning Maker",
    description: "Reflection, purpose, and mindful rituals",
    persona: "Grounded guide",
    focus: "Breathwork cues, reflection prompts, small rituals",
    quickPrompts: ["One-minute grounding practice", "Reflection to end my day"],
    backendPillarId: "spirituality",
  },
];

export const getAgentById = (id: string) =>
  PILLAR_AI_AGENTS.find((agent) => agent.id === id);

export const getAgentByBackendId = (pillarId?: string | null) =>
  PILLAR_AI_AGENTS.find((agent) => agent.backendPillarId === pillarId) ||
  getAgentById("northstar");

export const mapFrontendToBackendPillar = (agentId: string) =>
  getAgentById(agentId)?.backendPillarId;
