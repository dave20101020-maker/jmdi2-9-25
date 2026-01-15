import { ASSESSMENT_REGISTRY } from "@/assessments/registry";

export type AssessmentStartPayload = {
  type?: string;
  assessmentId?: string;
  schemaVersion?: string;
  pillar?: string;
  userId?: string;
  startedAt?: string;
  timestamp?: string;
};

export function parseAssessmentStartPayload(replyText) {
  if (!replyText) return null;

  if (typeof replyText === "object") {
    const payload = replyText;
    if (
      payload &&
      payload.type === "assessment.start" &&
      typeof payload.assessmentId === "string" &&
      payload.assessmentId.trim()
    ) {
      return payload;
    }
    return null;
  }

  if (typeof replyText !== "string") return null;

  try {
    const payload = JSON.parse(replyText);
    if (
      payload &&
      typeof payload === "object" &&
      payload.type === "assessment.start" &&
      typeof payload.assessmentId === "string" &&
      payload.assessmentId.trim()
    ) {
      return payload;
    }
  } catch (_) {
    // ignore non-JSON replies
  }

  return null;
}

export function resolveAssessmentIdFromPayload(
  payload: AssessmentStartPayload | null | undefined
) {
  const id = String(payload?.assessmentId || "").trim();
  if (!id) return null;
  return id in ASSESSMENT_REGISTRY ? id : null;
}
