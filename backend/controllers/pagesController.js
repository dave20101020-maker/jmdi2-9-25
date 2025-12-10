const pillars = [
  {
    id: "sleep",
    title: "Sleep",
    path: "/sleep",
    description: "Optimize recovery, circadian rhythm, and sleep hygiene.",
  },
  {
    id: "diet",
    title: "Diet",
    path: "/diet",
    description: "Balance macros, hydration, and mindful nutrition habits.",
  },
  {
    id: "exercise",
    title: "Exercise",
    path: "/exercise",
    description: "Build strength, mobility, and energy with adaptive training.",
  },
  {
    id: "physical-health",
    title: "Physical Health",
    path: "/physical-health",
    description:
      "Track vitals, recovery signals, and preventative care routines.",
  },
  {
    id: "mental-health",
    title: "Mental Health",
    path: "/mental-health",
    description:
      "Strengthen resilience through mood, stress, and focus practices.",
  },
  {
    id: "finances",
    title: "Finances",
    path: "/finances",
    description: "Plan cashflow, savings, and goal-based financial habits.",
  },
  {
    id: "social",
    title: "Social",
    path: "/social",
    description: "Nurture relationships, community engagement, and support.",
  },
  {
    id: "spirituality",
    title: "Spirituality",
    path: "/spirituality",
    description: "Cultivate mindfulness, purpose, and reflective practices.",
  },
];

export const getPageManifest = (req, res) => {
  res.json({
    pillars,
    meta: {
      pillarsCount: pillars.length,
      generatedAt: new Date().toISOString(),
      source: "northstar-v2",
    },
  });
};
