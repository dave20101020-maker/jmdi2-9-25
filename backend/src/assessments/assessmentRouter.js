import express from "express";
import { authRequired } from "../../middleware/authMiddleware.js";
import { put, appendEvent } from "../vault/VaultService.js";
import { VAULT_RECORD_TYPES } from "../vault/VaultTypes.js";
import sleepAssessmentDefinition from "./definitions/sleep.js";
import adhdAssessmentDefinition from "./definitions/adhd.js";

const router = express.Router();
router.use(authRequired);

const ASSESSMENT_DEFINITIONS = {
  [sleepAssessmentDefinition.id]: sleepAssessmentDefinition,
  [adhdAssessmentDefinition.id]: adhdAssessmentDefinition,
};

const KEY_TO_ID = {
  ISI: sleepAssessmentDefinition.id,
  SLEEP: sleepAssessmentDefinition.id,
  sleep_hygiene: sleepAssessmentDefinition.id,
  ADHD_CHECK: adhdAssessmentDefinition.id,
  ADHD: adhdAssessmentDefinition.id,
  adhd: adhdAssessmentDefinition.id,
};

const resolveAssessmentId = (value) => {
  if (!value) return null;
  const key = String(value).trim();
  return KEY_TO_ID[key] || null;
};

router.post("/start", (req, res) => {
  const assessmentId = resolveAssessmentId(
    req.body?.assessmentId || req.body?.assessmentKey
  );

  if (!assessmentId || !ASSESSMENT_DEFINITIONS[assessmentId]) {
    return res.status(400).json({
      ok: false,
      error: "Unknown assessment",
    });
  }

  const definition = ASSESSMENT_DEFINITIONS[assessmentId];
  return res.status(200).json({
    ok: true,
    payload: {
      type: "assessment.start",
      assessmentId: definition.id,
      schemaVersion: definition.schemaVersion,
      timestamp: new Date().toISOString(),
    },
  });
});

router.post("/complete", async (req, res) => {
  const assessmentId = resolveAssessmentId(req.body?.assessmentId);
  const schemaVersion = req.body?.schemaVersion || "v1";
  const timestamp = req.body?.timestamp || new Date().toISOString();
  const result = req.body?.result || {};
  const responses = req.body?.responses || {};

  if (!assessmentId || !ASSESSMENT_DEFINITIONS[assessmentId]) {
    return res.status(400).json({
      ok: false,
      error: "Unknown assessment",
    });
  }

  try {
    const userId = req.user?._id || req.user?.id;
    const vaultResponse = await put(
      VAULT_RECORD_TYPES.ASSESSMENT_RESULT,
      { result, responses },
      {
        userId,
        assessmentId,
        schemaVersion,
        timestamp,
      }
    );

    await appendEvent(
      "vault.write",
      { event: "assessment.completed", assessmentId, schemaVersion },
      { userId, type: VAULT_RECORD_TYPES.ASSESSMENT_RESULT }
    );

    return res.status(200).json({
      ok: true,
      stored: vaultResponse?.stored || false,
    });
  } catch (error) {
    const status =
      error?.message === "vault_unavailable" ||
      error?.message === "mongo_unavailable"
        ? 503
        : 500;
    return res.status(status).json({
      ok: false,
      error: "Failed to record assessment",
    });
  }
});

export default router;
