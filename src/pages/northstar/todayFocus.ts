export type TodayFocus = {
  title: string;
  subtitle: string;
  whyItMatters: string;
  tags: string[];
  ctaLabel: string;
  ctaTo: string;
};

export const TODAY_FOCUS: TodayFocus = {
  title: "Wind-down at 10:30 PM",
  subtitle: "Your most important task today",
  whyItMatters:
    "A calm wind-down helps sleep quality, steadies mood, and protects tomorrow’s focus.",
  tags: ["Sleep", "Mental Health", "NeuroShield"],
  ctaLabel: "Do now",
  ctaTo: "/pillars/sleep",
};

export const TODAY_QUICK_ACTIONS = [
  {
    id: "ai",
    title: "Ask NorthStar",
    description: "Get a 3-step plan for today.",
  },
  {
    id: "micro",
    title: "Pick a 5‑minute win",
    description: "Choose one quick action you can finish now.",
  },
  {
    id: "review",
    title: "Review focus",
    description: "Re-check what matters most today.",
  },
] as const;
