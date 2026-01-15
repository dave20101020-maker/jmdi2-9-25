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
  const normalizedKey = String(assessmentKey).trim();
  const assessmentId =
    normalizedKey === "ISI" || normalizedKey === "SLEEP"
      ? "sleep_hygiene"
      : normalizedKey === "ADHD_CHECK" || normalizedKey === "ADHD"
      ? "adhd"
      : normalizedKey.toLowerCase();

  return {
    ok: true,
    payload: {
      type: "assessment.start",
      pillar: resolvedPillar,
      assessmentId,
      schemaVersion: "v1",
      userId,
      startedAt: new Date().toISOString(),
    },
  };
}
