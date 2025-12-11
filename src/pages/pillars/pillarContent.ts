import {
  getPillarDefinition,
  type PillarDefinition,
} from "@/data/pillarDefinitions";

type FocusAreaContent = {
  label: string;
  description: string;
  metric: string;
};

export type PillarContent = {
  hero: string;
  intent: string;
  focusAreas: FocusAreaContent[];
  quickWins: PillarDefinition["quickWins"];
  rituals: PillarDefinition["rituals"];
  sampleMetric: PillarDefinition["sampleMetric"];
};

const focusDescriptions: Record<string, string> = {
  "wind-down":
    "Slow down the night with intentional breathing and dim lighting.",
  environment:
    "Shape the room, gear, and signals that whisper " +
    "sleepiness or steady focus.",
  consistency: "Groove the practice by repeating it at the same time each day.",
  hydration: "Sip water consistently to keep energy steady.",
  "protein targets":
    "Meet protein anchors during each meal to support muscle recovery.",
  "meal timing": "Space meals to avoid energy crashes.",
  strength: "Stack small loads to build muscular confidence.",
  mobility: "Unwind stiffness with gentle movement cues.",
  conditioning: "Warm up the heart and lungs with light cardio bursts.",
  vitals: "Track signals like HR and HRV to stay ahead of fatigue.",
  energy: "Notice what lifts or drains your energy within a day.",
  stress: "Notice how your body reacts before stress escalates.",
  focus: "Reset your attention with a simple cue list.",
  mood: "Name the emotion and let it pass with 30 seconds of breath.",
  cashflow: "Reconcile spending quickly to prevent surprises.",
  savings: "Automate a little, even $5, to make progress visible.",
  debt: "Tackle one small balance or interest check this week.",
  relationships: "Send a note, ask a question, and stay curious.",
  community: "Show up for someone else to strengthen belonging.",
  support: "Clarify who can help you when things shift.",
  values: "Name the values that guide your newest choices.",
  reflection: "Journal one line about what went well and why.",
  gratitude: "Spot the people or moments you want to savor today.",
};

const formatMetric = (label: string) => {
  const base = Math.max(60, 85 - label.length * 3);
  return `${base}% readiness`;
};

const buildFocusData = (areas: string[] | undefined) => {
  const normalized =
    areas && areas.length > 0 ? areas : ["consistency", "readiness"];
  return normalized.map((label) => ({
    label,
    description:
      focusDescriptions[label.toLowerCase()] ||
      `Tighten ${label} with a small, consistent habit.`,
    metric: formatMetric(label),
  }));
};

export const getPillarContent = (pillarId?: string): PillarContent => {
  const definition = getPillarDefinition(pillarId);

  if (!definition) {
    return {
      hero: "Explore Pillars",
      intent: "Choose a pillar to see targeted guidance.",
      focusAreas: buildFocusData(),
      quickWins: [
        {
          label: "Add a checkpoint",
          description:
            "Share how you're feeling or what you'd like to improve.",
        },
      ],
      rituals: ["Check in", "Set an intention", "Review progress"],
      sampleMetric: { label: "Engagement", value: "TBD", trend: "---" },
    };
  }

  return {
    hero: definition.tagline,
    intent: definition.summary,
    focusAreas: buildFocusData(definition.focusAreas),
    quickWins: definition.quickWins,
    rituals: definition.rituals,
    sampleMetric: definition.sampleMetric,
  };
};
