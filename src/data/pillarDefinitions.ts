export type PillarDefinition = {
  id: string;
  label: string;
  summary: string;
  tagline: string;
  focusAreas: string[];
  quickWins: { label: string; description: string }[];
  rituals: string[];
  aiPrompt: string;
  sampleMetric: { label: string; value: string; trend: string };
  path: string;
};

export const PILLAR_DEFINITIONS: PillarDefinition[] = [
  {
    id: "sleep",
    label: "Sleep",
    summary: "Optimize recovery, circadian rhythm, and sleep hygiene.",
    tagline: "Sleep is your recovery engine.",
    focusAreas: ["wind-down", "environment", "consistency"],
    quickWins: [
      { label: "Lights-out plan", description: "Set a 30-minute wind-down ritual with blue-light cut off." },
      { label: "Bedroom audit", description: "Dial in temperature, darkness, and quiet for tonight." },
    ],
    rituals: ["10:30p lights out", "No caffeine after 2p", "Phone out of bedroom"],
    aiPrompt: "Design a 7-day sleep reset that improves deep sleep without naps.",
    sampleMetric: { label: "Avg. sleep score", value: "82", trend: "+3 this week" },
    path: "/sleep",
  },
  {
    id: "diet",
    label: "Diet",
    summary: "Balance macros, hydration, and mindful nutrition habits.",
    tagline: "Fuel that matches your day.",
    focusAreas: ["hydration", "protein targets", "meal timing"],
    quickWins: [
      { label: "Protein anchor", description: "Plan 30g protein anchors for your next two meals." },
      { label: "Hydration streak", description: "Front-load 1L water before noon." },
    ],
    rituals: ["Prep produce once", "Protein at breakfast", "Mindful dinner"],
    aiPrompt: "Create a 3-meal plan for today within 1,900 kcal and 140g protein.",
    sampleMetric: { label: "Consistency", value: "74%", trend: "+8 over 14d" },
    path: "/diet",
  },
  {
    id: "exercise",
    label: "Exercise",
    summary: "Build strength, mobility, and energy with adaptive training.",
    tagline: "Strong body, steady energy.",
    focusAreas: ["strength", "mobility", "conditioning"],
    quickWins: [
      { label: "Micro-workout", description: "Add a 12-minute strength mini-session today." },
      { label: "Movement breaks", description: "Schedule 3x 5-minute mobility resets." },
    ],
    rituals: ["Lift Mon/Wed/Fri", "Walk after lunch", "Stretch before bed"],
    aiPrompt: "Draft a low-impact workout that fits in 25 minutes with no equipment.",
    sampleMetric: { label: "Training frequency", value: "4x/week", trend: "stable" },
    path: "/exercise",
  },
  {
    id: "physical-health",
    label: "Physical Health",
    summary: "Track vitals, recovery signals, and preventative care routines.",
    tagline: "Vitals, pain signals, and proactive care.",
    focusAreas: ["vitals", "mobility", "energy"],
    quickWins: [
      { label: "Vitals check", description: "Log resting HR and energy for the next 3 mornings." },
      { label: "Pain map", description: "Note any pain spots and triggers to share with your coach." },
    ],
    rituals: ["Morning vitals", "Micro-mobility", "Weekly preventative check"],
    aiPrompt: "Outline a gentler recovery week with mobility and breathwork emphasis.",
    sampleMetric: { label: "Recovery readiness", value: "76", trend: "-2 vs last week" },
    path: "/physical-health",
  },
  {
    id: "mental-health",
    label: "Mental Health",
    summary: "Strengthen resilience through mood, stress, and focus practices.",
    tagline: "Calm focus on demand.",
    focusAreas: ["stress", "focus", "mood"],
    quickWins: [
      { label: "3-minute reset", description: "Run a breathing drill before the next meeting." },
      { label: "Stress map", description: "Name today's top stressor and one controllable action." },
    ],
    rituals: ["AM check-in", "Breathwork cue", "Wind-down journal"],
    aiPrompt: "Suggest a 5-minute cognitive reset I can use between tasks.",
    sampleMetric: { label: "Mood stability", value: "Moderate", trend: "+1 in 7d" },
    path: "/mental-health",
  },
  {
    id: "finances",
    label: "Finances",
    summary: "Plan cashflow, savings, and goal-based financial habits.",
    tagline: "Cash clarity equals calm.",
    focusAreas: ["cashflow", "savings", "debt"],
    quickWins: [
      { label: "Spending sweep", description: "Tag yesterday's transactions in 5 minutes." },
      { label: "Automate savings", description: "Schedule a small transfer to goals account." },
    ],
    rituals: ["Sunday money review", "Auto-save", "Inbox zero for bills"],
    aiPrompt: "Build a weekly money ritual that keeps spending under control.",
    sampleMetric: { label: "Savings momentum", value: "$240/wk", trend: "+$35 vs avg" },
    path: "/finances",
  },
  {
    id: "social",
    label: "Social",
    summary: "Nurture relationships, community engagement, and support.",
    tagline: "Connection creates resilience.",
    focusAreas: ["relationships", "community", "support"],
    quickWins: [
      { label: "Connection rep", description: "Send one check-in message to a friend." },
      { label: "Host a micro-gathering", description: "Plan a 20-minute walk with someone this week." },
    ],
    rituals: ["Two reach-outs weekly", "No ghosting", "Weekend social block"],
    aiPrompt: "Give me two frictionless ways to reconnect with someone I value.",
    sampleMetric: { label: "Weekly reach-outs", value: "3", trend: "up from 1" },
    path: "/social",
  },
  {
    id: "spirituality",
    label: "Spirituality",
    summary: "Cultivate mindfulness, purpose, and reflective practices.",
    tagline: "Inner clarity fuels outer action.",
    focusAreas: ["values", "reflection", "gratitude"],
    quickWins: [
      { label: "Micro-meditation", description: "Do a 4-7-8 breath cycle twice today." },
      { label: "Gratitude note", description: "Write one thing you appreciate before bed." },
    ],
    rituals: ["Morning intention", "Evening reflection", "Weekly unplug"],
    aiPrompt: "Suggest a nightly reflection that keeps me aligned with my values.",
    sampleMetric: { label: "Consistency", value: "5/7 days", trend: "steady" },
    path: "/spirituality",
  },
];

export const getPillarDefinition = (id?: string) =>
  PILLAR_DEFINITIONS.find((pillar) => pillar.id === id);
