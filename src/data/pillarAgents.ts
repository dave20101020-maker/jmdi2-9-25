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
    name: "NorthStar AI",
    description: "Central router that coordinates the right pillar coach.",
    persona: "Orchestrator and accountability compass",
    focus: "Route to the best specialist and keep plans coherent",
    quickPrompts: [
      "What should I focus on this week?",
      "Share a quick energy reset",
      "Help me set a gentle intention",
    ],
  },
  {
    id: "sleep",
    name: "Dr. Luna",
    description: "Sleep specialist for recovery and circadian alignment.",
    persona: "Calm, clinical sleep coach",
    focus: "Wind-down, schedule, and sleep quality",
    quickPrompts: [
      "Give me a 3-minute wind-down",
      "How can I calm racing thoughts at night?",
    ],
    backendPillarId: "sleep",
  },
  {
    id: "diet",
    name: "Chef Nourish",
    description: "Nutrition coach for sustainable, delicious eating systems.",
    persona: "Chef-meets-coach",
    focus: "Meals, cravings, and practical nutrition habits",
    quickPrompts: [
      "Design a simple lunch I can prep",
      "Idea for a protein-rich snack",
    ],
    backendPillarId: "nutrition",
  },
  {
    id: "exercise",
    name: "Coach Atlas",
    description: "Strength & performance programming and progression.",
    persona: "Direct, high-energy coach",
    focus: "Programming, progression, strength, mobility",
    quickPrompts: [
      "Give me a 5-minute strength plan",
      "Quick mobility routine for the chair",
    ],
    backendPillarId: "fitness",
  },
  {
    id: "mental_health",
    name: "Dr. Serenity",
    description: "Mental health screenings and evidence-based coping.",
    persona: "Clinically sharp, warm guide",
    focus: "Screenings, coping protocols, and NeuroShield",
    quickPrompts: [
      "Guide me through a 2-minute calm-down",
      "Reframe a negative thought",
    ],
    backendPillarId: "mental_health",
  },
  {
    id: "physical_health",
    name: "Dr. Vitality",
    description: "Physical wellness screenings and health habit plans.",
    persona: "Empathetic, evidence-based educator",
    focus: "Preliminary screenings, recovery, symptom logs",
    quickPrompts: [
      "What should I watch for after a tough workout?",
      "Checklist for feeling run-down",
    ],
    backendPillarId: "physical_health",
  },
  {
    id: "finances",
    name: "Adviser Prosper",
    description: "Budgets, debt payoff systems, and savings automation.",
    persona: "Calm, confident money coach (not CPA/financial advisor)",
    focus: "Budgeting, automation, debt plans, momentum",
    quickPrompts: [
      "Help me trim a recurring expense",
      "How do I set a weekly spending cap?",
    ],
    backendPillarId: "finances",
  },
  {
    id: "social",
    name: "Coach Connect",
    description: "Communication, connection, and healthy boundaries.",
    persona: "Warm, curious connector",
    focus: "Outreach, boundaries, vulnerability progression",
    quickPrompts: [
      "Give me a quick reach-out script",
      "Idea for a low-energy social plan",
    ],
    backendPillarId: "social",
  },
  {
    id: "spirituality",
    name: "Guide Zenith",
    description: "Meaning, values alignment, and contemplative practices.",
    persona: "Spacious, present guide",
    focus: "Values, awe practices, reflection, rituals",
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
