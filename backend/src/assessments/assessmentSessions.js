// Minimal assessment session starter.
//
// This module is imported by `backend/routes/aiUnifiedRoutes.js` and must exist
// for the backend to boot. It returns a plain JSON payload that the unified
// chat route serializes as the `reply`.

export async function startAssessmentSession({
  userId,
  pillar,
  assessmentKey,
} = {}) {
  if (!userId || !assessmentKey) {
    return {
      ok: false,
      error: true,
      message: "Missing required fields: userId and assessmentKey",
    };
  }

  const resolvedPillar =
    typeof pillar === "string" && pillar.trim() ? pillar.trim() : "general";

  return {
    ok: true,
    payload: {
      type: "assessment.start",
      pillar: resolvedPillar,
      assessmentKey,
      userId,
      startedAt: new Date().toISOString(),
    },
  };
}
