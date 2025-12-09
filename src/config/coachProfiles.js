import { PILLARS } from "@/utils";

export const COACH_PROFILES = {
  sleep: {
    ...PILLARS.sleep,
    coach: "Dr. Luna",
    tone: "calm, soothing, science-focused",
    quickQuestions: [
      "Why am I tired?",
      "Improve sleep quality",
      "Create a sleep plan",
    ],
  },
  diet: {
    ...PILLARS.diet,
    coach: "Chef Nourish",
    tone: "encouraging, practical, non-judgmental",
    quickQuestions: [
      "Healthy meal ideas",
      "Nutrition tips",
      "Create a nutrition plan",
    ],
  },
  exercise: {
    ...PILLARS.exercise,
    coach: "Coach Atlas",
    tone: "energetic, motivating, technical",
    quickQuestions: ["Workout plan", "Exercise form", "Create a fitness plan"],
  },
  physical_health: {
    ...PILLARS.physical_health,
    coach: "Dr. Vitality",
    tone: "caring, preventative, medically-informed",
    quickQuestions: [
      "Health checkup tips",
      "Preventive care",
      "Create a wellness plan",
    ],
  },
  mental_health: {
    ...PILLARS.mental_health,
    coach: "Dr. Serenity",
    tone: "empathetic, supportive, patient",
    quickQuestions: [
      "Reduce stress",
      "Improve mood",
      "Create a mental wellness plan",
    ],
  },
  finances: {
    ...PILLARS.finances,
    coach: "Adviser Prosper",
    tone: "rational, strategic, confidence-building",
    quickQuestions: [
      "Budget help",
      "Savings strategies",
      "Create a financial plan",
    ],
  },
  social: {
    ...PILLARS.social,
    coach: "Coach Connect",
    tone: "warm, social-psychology-focused",
    quickQuestions: [
      "Improve relationships",
      "Social confidence",
      "Create a social plan",
    ],
  },
  spirituality: {
    ...PILLARS.spirituality,
    coach: "Guide Zenith",
    tone: "thoughtful, philosophical, open-minded",
    quickQuestions: [
      "Find purpose",
      "Meditation guide",
      "Create a spiritual plan",
    ],
  },
};

export const COACH_PROFILE_LIST = Object.values(COACH_PROFILES);
