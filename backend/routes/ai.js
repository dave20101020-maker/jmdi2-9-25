import express from "express";
import OpenAI from "openai";
import {
  coachAgent,
  dailyPlanAgent,
  pillarAnalysisAgent,
  weeklyReflectionAgent,
  weeklyReportAgent,
} from "../controllers/aiController.js";

const router = express.Router();

// Minimal, unauthenticated AI test route to verify OpenAI connectivity
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
});

router.post("/", async (req, res) => {
  console.log("AI route hit");
  console.log("Request body:", req.body);

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    console.log("Calling OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are NorthStar AI." },
        { role: "user", content: prompt },
      ],
    });

    console.log("OpenAI returned");

    const reply = completion?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    return res.json({ reply });
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: err.message || "AI failure" });
  }
});

import {
  authRequired,
  requirePillarAccess,
} from "../middleware/authMiddleware.js";
import { requireSensitiveConsent } from "../middleware/consentGuard.js";
import { validate, aiSchemas } from "../middleware/validate.js";
import asyncHandler from "../utils/asyncHandler.js";

// require auth for AI endpoints
router.use(authRequired);
router.use(requireSensitiveConsent);

// helper: only enforce pillar access if request body/query contains a pillar key
const conditionalPillarGuard = (keys) => (req, res, next) => {
  const candidateKeys = Array.isArray(keys) ? keys : [keys];
  let found = false;
  for (const k of candidateKeys) {
    if (req.body?.[k] || req.query?.[k]) {
      found = true;
      break;
    }
  }
  if (found) return requirePillarAccess(candidateKeys)(req, res, next);
  return next();
};

/**
 * POST /api/ai/coach
 * Endpoint for coaching agent
 * Body: { prompt, userContext?, pillarFocus? }
 */
router.post(
  "/coach",
  validate({ body: aiSchemas.coachRequest }),
  conditionalPillarGuard(["pillar", "pillarFocus"]),
  asyncHandler(coachAgent)
);

/**
 * POST /api/ai/daily-plan
 * Endpoint for daily plan agent
 * Body: { prompt, userGoals?, timeAvailable? }
 */
router.post(
  "/daily-plan",
  validate({ body: aiSchemas.coachRequest }),
  asyncHandler(dailyPlanAgent)
);

/**
 * POST /api/ai/pillar-analysis
 * Endpoint for pillar analysis agent
 * Body: { prompt, currentScores?, focusAreas? }
 */
router.post(
  "/pillar-analysis",
  validate({ body: aiSchemas.coachRequest }),
  conditionalPillarGuard(["pillar", "pillarFocus"]),
  asyncHandler(pillarAnalysisAgent)
);

/**
 * POST /api/ai/weekly-reflection
 * Endpoint for weekly reflection agent
 * Body: { prompt, weeklyData?, pillarScores? }
 */
router.post(
  "/weekly-reflection",
  validate({ body: aiSchemas.coachRequest }),
  conditionalPillarGuard(["pillar", "pillarScores"]),
  asyncHandler(weeklyReflectionAgent)
);
router.get("/weekly-report", asyncHandler(weeklyReportAgent));

export default router;
