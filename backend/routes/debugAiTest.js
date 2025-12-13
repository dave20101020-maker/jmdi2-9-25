import express from "express";
import logger from "../utils/logger.js";
import { orchestrateAI } from "../src/ai/orchestrator/unifiedOrchestrator.js";
import { callProviderWithResilience } from "../src/services/aiProviderWrapper.js";

const router = express.Router();

const providerKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;

router.get("/", async (_req, res) => {
  if (!providerKey) {
    return res.status(503).json({
      ok: false,
      message: "Provider key missing. Set OPENAI_API_KEY or AI_PROVIDER_KEY.",
    });
  }

  try {
    const started = Date.now();
    const result = await callProviderWithResilience("debugAiTest", () =>
      orchestrateAI({
        userId: "debug-probe",
        message: "Connectivity test: say pong if you can read this.",
        module: "ai_chat",
        context: { skipCrisisCheck: true },
        options: { temperature: 0.2, maxTokens: 16 },
      })
    );

    const durationMs = Date.now() - started;
    logger.info("Debug AI test success", {
      durationMs,
      result,
    });

    const reply =
      result?.reply || result?.response || result?.text || result?.message;
    return res.json({
      ok: true,
      durationMs,
      reply_preview: typeof reply === "string" ? reply.slice(0, 160) : "",
    });
  } catch (err) {
    logger.error("Debug AI test failed", {
      error: err?.message,
      stack: err?.stack,
      status: err?.response?.status,
      data: err?.response?.data,
    });

    return res.status(502).json({
      ok: false,
      message: "Provider call failed",
    });
  }
});

export default router;
