import express from "express";
import OpenAI from "openai";
import logger from "../utils/logger.js";

const router = express.Router();

const providerKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
const client = providerKey
  ? new OpenAI({ apiKey: providerKey, timeout: 15_000 })
  : null;

router.get("/", async (_req, res) => {
  if (!client) {
    return res.status(503).json({
      ok: false,
      message: "Provider key missing. Set OPENAI_API_KEY or AI_PROVIDER_KEY.",
    });
  }

  try {
    const started = Date.now();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a quick connectivity probe." },
        { role: "user", content: "Say 'pong' if you can read this." },
      ],
      max_tokens: 5,
    });

    const durationMs = Date.now() - started;
    logger.info("Debug AI test success", {
      durationMs,
      model: completion?.model,
      usage: completion?.usage,
      raw: completion,
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();
    return res.json({ ok: true, durationMs, reply });
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
      error: err?.message,
    });
  }
});

export default router;
