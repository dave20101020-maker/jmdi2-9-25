import { QUESTION_BANKS } from "./questionBanks";
import { scoreAssessment } from "./scoring";

export const ASSESSMENT_REGISTRY = {
  sleep_hygiene: {
    id: "sleep_hygiene",
    name: "Sleep Quality Screener",
    description: "Quick check on habits that support restorative sleep.",
    schemaVersion: "v1",
    disclaimer:
      "Informational only, not diagnostic. If sleep concerns persist, consult a licensed clinician.",
    questionSet: QUESTION_BANKS.sleep_hygiene,
    score: (responses: Record<string, number>) =>
      scoreAssessment("sleep_hygiene", responses),
  },
  adhd: {
    id: "adhd",
    name: "ADHD Screener",
    description: "Brief look at attention and regulation patterns.",
    schemaVersion: "v1",
    disclaimer:
      "Informational only, not diagnostic. If you have concerns, seek a professional evaluation.",
    questionSet: QUESTION_BANKS.adhd,
    score: (responses: Record<string, number>) =>
      scoreAssessment("adhd", responses),
  },
} as const;

export type AssessmentId = keyof typeof ASSESSMENT_REGISTRY;

export const getAssessmentDefinition = (assessmentId: AssessmentId) =>
  ASSESSMENT_REGISTRY[assessmentId];
