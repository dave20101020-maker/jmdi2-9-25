import { describe, expect, test } from "vitest";
import { startAssessmentSession } from "../../../backend/src/assessments/assessmentSessions.js";

describe("startAssessmentSession", () => {
  test("returns an error payload when required fields are missing", async () => {
    const response = await startAssessmentSession({ pillar: "sleep" });

    expect(response).toEqual({
      ok: false,
      error: true,
      message: "Missing required fields: userId and assessmentKey",
    });
  });

  test("returns a payload with defaults when inputs are valid", async () => {
    const response = await startAssessmentSession({
      userId: "user-123",
      pillar: "  mental_health  ",
      assessmentKey: "GAD7",
    });

    expect(response.ok).toBe(true);
    expect(response.payload).toMatchObject({
      type: "assessment.start",
      pillar: "mental_health",
      assessmentKey: "GAD7",
      userId: "user-123",
    });

    expect(new Date(response.payload.startedAt).toString()).not.toBe(
      "Invalid Date"
    );
  });
});
