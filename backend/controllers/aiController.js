// ============================================================
// PHASE 6.8 LOCKED — AI Messages / Conversation Memory
// - Postgres (ai_message) is primary read source
// - Mongo AiMessage is fallback only
// - Dual-write on append
// - Deterministic ordering preserved
// - API behavior frozen
// ============================================================

import OpenAI from "openai";
import User from "../models/User.js";
import OnboardingProfile from "../models/OnboardingProfile.js";
import PillarCheckIn from "../models/PillarCheckIn.js";
import AiMessage from "../models/AiMessage.js";
import { applyAiDisclaimer } from "../src/ai/disclaimer.js";
import prisma from "../src/db/prismaClient.js";
import {
  isMongoFallbackEnabled,
  pgFirstRead,
} from "../src/utils/readSwitch.js";
import { emitAuditEvent } from "../src/utils/auditLog.js";

const sendAiResponse = (res, payload, status = 200) =>
  res.status(status).json(applyAiDisclaimer(payload));

// Lazy initialization of OpenAI client
let openai = null;
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Per-pillar short configs (system role + preferred tone)
const pillarConfigs = {
  sleep: {
    system:
      "You are an expert sleep coach. Provide actionable, sleep-hygiene focused advice.",
    tone: "gentle",
  },
  diet: {
    system:
      "You are a nutrition coach. Provide practical, evidence-based nutrition tips.",
    tone: "practical",
  },
  exercise: {
    system:
      "You are a fitness coach. Give safe, motivating exercise recommendations.",
    tone: "energetic",
  },
  physical_health: {
    system:
      "You are a physical health advisor. Focus on preventive care and recovery.",
    tone: "calm",
  },
  mental_health: {
    system:
      "You are a mental health coach. Offer grounding, resilience-building guidance.",
    tone: "compassionate",
  },
  finances: {
    system:
      "You are a personal finance coach. Provide clear budgeting and saving actions.",
    tone: "direct",
  },
  social: {
    system:
      "You are a social wellbeing coach. Recommend ways to strengthen relationships.",
    tone: "warm",
  },
  spirituality: {
    system:
      "You are a purpose & meaning coach. Help the user connect actions to values.",
    tone: "reflective",
  },
};

/**
 * Orchestrator: choose 1-2 pillars to focus on based on PillarScore and allowedPillars
 */
const getNorthStarRecommendation = async (user) => {
  // user: user document (with _id and allowedPillars) or userId string
  let userId = typeof user === "string" ? user : String(user._id);
  const authUser = typeof user === "object" ? user : null;

  // Calculate priority scores using helper
  const priorities = await calculatePriorityScores(userId, authUser);

  if (!priorities || priorities.length === 0) {
    const allowed =
      authUser && Array.isArray(authUser.allowedPillars)
        ? authUser.allowedPillars
        : [];
    return {
      primaryPillars: allowed.slice(0, 2),
      reason: "No data available; defaulting to plan defaults.",
    };
  }

  // pick top pillar
  const top = priorities[0];
  const reason = `Priority score ${Math.round(
    top.score
  )} — based on recent trend, recent average score and onboarding COM-B inputs.`;
  return { primaryPillars: [top.pillarId], reason };
};

/**
 * Calculate priority scores per allowed pillar for a user.
 * Factors:
 * - COM-B (capability/opportunity/motivation) from onboarding (0-10 each)
 * - Recent pillar check-ins avg (last 7 days) scaled to 0-100
 * - Weak pillar boost: if avg < 40 -> +20
 * - Only include allowed pillars when user object provided
 * Returns [{ pillarId, score }...] sorted desc
 */
export const calculatePriorityScores = async (userId, userDoc = null) => {
  try {
    const uid = String(userId);
    const onboarding = await pgFirstRead({
      label: "ai:calculatePriorityScores:onboarding",
      meta: { userId: uid },
      pgRead: async () => {
        const row = await prisma.onboardingProfile.findUnique({
          where: { userId: uid },
          select: { doc: true },
        });
        return row?.doc || null;
      },
      mongoRead: async () =>
        OnboardingProfile.findOne({ userId: uid })
          .lean()
          .catch(() => null),
    });

    // Determine allowed pillars
    const allowed =
      userDoc && Array.isArray(userDoc.allowedPillars)
        ? userDoc.allowedPillars
        : [
            "sleep",
            "diet",
            "exercise",
            "physical_health",
            "mental_health",
            "finances",
            "social",
            "spirituality",
          ];

    const results = [];
    for (const pillar of allowed) {
      // COM-B components
      const cb =
        onboarding && onboarding.com_b && onboarding.com_b[pillar]
          ? onboarding.com_b[pillar]
          : { capability: 5, opportunity: 5, motivation: 5 };
      const comSum =
        (cb.capability || 0) + (cb.opportunity || 0) + (cb.motivation || 0); // 0-30

      // Recent check-ins (last 7 days)
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const entries = await pgFirstRead({
        label: "ai:calculatePriorityScores:checkins",
        meta: { userId: uid, pillarIdentifier: pillar },
        pgRead: async () => {
          const rows = await prisma.pillarCheckIn.findMany({
            where: {
              userId: uid,
              pillarIdentifier: pillar,
              createdAt: { gte: since },
            },
            select: { value: true },
          });
          return rows.map((r) => ({ value: r.value }));
        },
        mongoRead: async () =>
          PillarCheckIn.find({
            userId: uid,
            pillarId: pillar,
            createdAt: { $gte: since },
          }).lean(),
      });
      const values = entries.map((e) =>
        typeof e.value === "number" ? e.value : 0
      ); // 0-10
      const avgVal =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null; // 0-10 or null
      const avgScore = avgVal !== null ? avgVal * 10 : 50; // scale to 0-100, default 50

      // Base priority: higher when COM-B sum is lower and avgScore is lower
      // normalized components: (30 - comSum)/30 and (100 - avgScore)/100
      const comFactor = (30 - comSum) / 30; // 0-1
      const scoreFactor = (100 - avgScore) / 100; // 0-1

      let priority = (comFactor * 0.6 + scoreFactor * 0.4) * 100; // 0-100

      // Weak pillar boost
      if (avgScore < 40) priority += 20;

      // clamp 0-100
      priority = Math.max(0, Math.min(100, priority));

      results.push({ pillarId: pillar, score: priority, avgScore, comSum });
    }

    // sort descending
    results.sort((a, b) => b.score - a.score);
    return results;
  } catch (err) {
    console.error("calculatePriorityScores error", err);
    return [];
  }
};

/**
 * Coach Agent - Provides personalized coaching and motivation
 * Accepts: { prompt, userContext?, pillarFocus? }
 * Returns: { coaching, encouragement, actionItems, nextSteps }
 */
export const coachAgent = async (req, res) => {
  try {
    const { prompt, userContext = {}, pillarFocus } = req.body;

    if (!prompt)
      return sendAiResponse(res, { error: "Prompt is required" }, 400);

    // If no pillarFocus provided, ask orchestrator to pick 1-2 pillars
    let chosen = { primaryPillars: [], reason: "user-specified" };
    if (!pillarFocus) {
      // require authenticated user
      const user =
        req.user ||
        (req.body.userId ? await User.findById(req.body.userId) : null);
      chosen = await getNorthStarRecommendation(user || req.body.userId);
    } else {
      chosen.primaryPillars = Array.isArray(pillarFocus)
        ? pillarFocus.slice(0, 2)
        : [pillarFocus];
    }

    const focus = chosen.primaryPillars[0] || "general";
    const config = pillarConfigs[focus] || {
      system: "You are an empathetic wellness coach.",
      tone: "supportive",
    };

    const messages = [
      { role: "system", content: config.system },
      { role: "system", content: `Tone: ${config.tone}` },
      {
        role: "user",
        content: `Context: ${JSON.stringify(
          userContext
        )}. User: ${prompt}. Focus: ${focus}. Reason for focus: ${
          chosen.reason || ""
        }. Return JSON with coaching, encouragement, actionItems (array), nextSteps.`,
      },
    ];

    const response = await getOpenAIClient().beta.messages.create({
      model: "gpt-4-turbo",
      max_tokens: 1024,
      messages,
      betas: ["openai-beta.json-mode-latest"],
    });

    const content = response.content[0];
    if (content.type !== "text")
      throw new Error("Unexpected response type from OpenAI");

    let coachingData;
    try {
      coachingData = JSON.parse(content.text);
    } catch {
      coachingData = {
        coaching: content.text,
        encouragement: "You are making progress!",
        actionItems: [],
        nextSteps: "Continue your wellness journey.",
      };
    }

    sendAiResponse(res, {
      success: true,
      agent: "coach",
      timestamp: new Date().toISOString(),
      data: { focus, chosen, coaching: coachingData },
    });
  } catch (error) {
    console.error("Coach agent error:", error);
    sendAiResponse(
      res,
      {
        error: "Failed to process coaching request",
        message: error.message,
      },
      500
    );
  }
};

/**
 * Daily Plan Agent - Creates structured daily plans
 * Accepts: { prompt, userGoals?, timeAvailable? }
 * Returns: { morningRoutine, mainTasks, eveningRoutine, estimatedTime, energyManagement }
 */
export const dailyPlanAgent = async (req, res) => {
  try {
    const { prompt, userGoals = [], timeAvailable = 16 } = req.body;

    if (!prompt)
      return sendAiResponse(res, { error: "Prompt is required" }, 400);

    const response = await getOpenAIClient().beta.messages.create({
      model: "gpt-4-turbo",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an expert productivity and wellness planner. Create a structured daily plan based on: "${prompt}". User has ${timeAvailable} hours of available time. Goals: ${JSON.stringify(
            userGoals
          )}. Return a JSON object with: morningRoutine (array of tasks with times), mainTasks (prioritized array with durations), eveningRoutine (array of tasks), estimatedTime (total hours needed), and energyManagement (tips for maintaining energy).`,
        },
      ],
      betas: ["openai-beta.json-mode-latest"],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from OpenAI");
    }

    let planData;
    try {
      planData = JSON.parse(content.text);
    } catch {
      planData = {
        morningRoutine: [
          "6:00 AM - Wake up",
          "6:30 AM - Exercise",
          "7:30 AM - Breakfast",
        ],
        mainTasks: [{ task: prompt, duration: timeAvailable / 2 }],
        eveningRoutine: ["Evening wind-down", "Prepare for tomorrow"],
        estimatedTime: timeAvailable,
        energyManagement: "Take regular breaks and stay hydrated",
      };
    }

    sendAiResponse(res, {
      success: true,
      agent: "dailyPlan",
      timestamp: new Date().toISOString(),
      data: planData,
    });
  } catch (error) {
    console.error("Daily plan agent error:", error);
    sendAiResponse(
      res,
      {
        error: "Failed to create daily plan",
        message: error.message,
      },
      500
    );
  }
};

/**
 * Pillar Analysis Agent - Analyzes wellness across the 8 pillars
 * Accepts: { prompt, currentScores?, focusAreas? }
 * Returns: { pillarAnalysis: {pillarName: analysis}, recommendations: [], strengths: [], improvements: [] }
 */
export const pillarAnalysisAgent = async (req, res) => {
  try {
    const { prompt, currentScores = {}, focusAreas = [], pillar } = req.body;

    if (!prompt)
      return sendAiResponse(res, { error: "Prompt is required" }, 400);

    if (!pillar)
      return sendAiResponse(
        res,
        { error: "pillar is required for pillar-analysis" },
        400
      );

    // require a specific pillar for pillar-analysis
    const target = pillar;
    const config = pillarConfigs[target] || {
      system: "You are a holistic wellness analyst.",
      tone: "neutral",
    };

    const messages = [
      { role: "system", content: config.system },
      { role: "system", content: `Tone: ${config.tone}` },
      {
        role: "user",
        content: `Pillar: ${target}. Current score: ${
          currentScores[target] || 0
        }. Context: ${prompt}. Focus areas: ${JSON.stringify(
          focusAreas
        )}. Return JSON with pillarAnalysis (single pillar), recommendations (array), strengths (array), improvements (array).`,
      },
    ];

    const response = await getOpenAIClient().beta.messages.create({
      model: "gpt-4-turbo",
      max_tokens: 1200,
      messages,
      betas: ["openai-beta.json-mode-latest"],
    });
    const content = response.content[0];
    if (content.type !== "text")
      throw new Error("Unexpected response type from OpenAI");

    let analysisData;
    try {
      analysisData = JSON.parse(content.text);
    } catch {
      analysisData = {
        pillarAnalysis: { [target]: content.text },
        recommendations: [],
        strengths: [],
        improvements: [],
      };
    }

    sendAiResponse(res, {
      success: true,
      agent: "pillarAnalysis",
      timestamp: new Date().toISOString(),
      data: analysisData,
    });
  } catch (error) {
    console.error("Pillar analysis agent error:", error);
    sendAiResponse(
      res,
      {
        error: "Failed to analyze pillars",
        message: error.message,
      },
      500
    );
  }
};

/**
 * Weekly Reflection Agent - Generates weekly reflections and insights
 * Accepts: { prompt, weeklyData?, pillarScores? }
 * Returns: { weeklyInsights, keyAccomplishments, lessonLearned, nextWeekGoals, motivationalMessage }
 */
export const weeklyReflectionAgent = async (req, res) => {
  try {
    const { prompt, weeklyData = {}, pillarScores = {} } = req.body;

    if (!prompt)
      return sendAiResponse(res, { error: "Prompt is required" }, 400);

    const response = await getOpenAIClient().beta.messages.create({
      model: "gpt-4-turbo",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a reflective wellness coach. Generate a comprehensive weekly reflection based on the user's week: "${prompt}". Weekly data: ${JSON.stringify(
            weeklyData
          )}. Pillar scores: ${JSON.stringify(
            pillarScores
          )}. Return a JSON object with: 1) weeklyInsights (summary of the week), 2) keyAccomplishments (array of wins), 3) lessonsLearned (array of insights), 4) nextWeekGoals (array of goals for next week), 5) motivationalMessage (encouraging message).`,
        },
      ],
      betas: ["openai-beta.json-mode-latest"],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from OpenAI");
    }

    let reflectionData;
    try {
      reflectionData = JSON.parse(content.text);
    } catch {
      reflectionData = {
        weeklyInsights: "You had a productive week with good progress.",
        keyAccomplishments: [
          "Completed daily tasks",
          "Maintained healthy habits",
        ],
        lessonsLearned: [
          "Consistency is key",
          "Small steps lead to big changes",
        ],
        nextWeekGoals: [
          "Build on this week's momentum",
          "Focus on areas needing improvement",
        ],
        motivationalMessage: "You are doing great! Keep up the excellent work.",
      };
    }

    sendAiResponse(res, {
      success: true,
      agent: "weeklyReflection",
      timestamp: new Date().toISOString(),
      data: reflectionData,
    });
  } catch (error) {
    console.error("Weekly reflection agent error:", error);
    sendAiResponse(
      res,
      {
        error: "Failed to generate weekly reflection",
        message: error.message,
      },
      500
    );
  }
};

// Build a weekly report for a user: averages, improvements, declines, suggested actions
export const buildWeeklyReport = async (userId) => {
  try {
    const uid = String(userId);
    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - 7);
    const prevSince = new Date();
    prevSince.setDate(now.getDate() - 14);

    // fetch last 7 days and previous 7 days
    const recent = await pgFirstRead({
      label: "ai:buildWeeklyReport:recent",
      meta: { userId: uid },
      pgRead: async () => {
        const rows = await prisma.pillarCheckIn.findMany({
          where: { userId: uid, createdAt: { gte: since } },
          select: { pillarIdentifier: true, value: true },
        });
        return rows.map((r) => ({
          pillarId: r.pillarIdentifier,
          value: r.value,
        }));
      },
      mongoRead: async () =>
        PillarCheckIn.find({ userId: uid, createdAt: { $gte: since } }).lean(),
    });

    const prev = await pgFirstRead({
      label: "ai:buildWeeklyReport:prev",
      meta: { userId: uid },
      pgRead: async () => {
        const rows = await prisma.pillarCheckIn.findMany({
          where: { userId: uid, createdAt: { gte: prevSince, lt: since } },
          select: { pillarIdentifier: true, value: true },
        });
        return rows.map((r) => ({
          pillarId: r.pillarIdentifier,
          value: r.value,
        }));
      },
      mongoRead: async () =>
        PillarCheckIn.find({
          userId: uid,
          createdAt: { $gte: prevSince, $lt: since },
        }).lean(),
    });

    const pillars = [
      "sleep",
      "diet",
      "exercise",
      "physical_health",
      "mental_health",
      "finances",
      "social",
      "spirituality",
    ];
    const summary = {};
    const improvements = [];
    const declines = [];

    for (const p of pillars) {
      const recentVals = recent
        .filter((r) => r.pillarId === p)
        .map((r) => r.value);
      const prevVals = prev.filter((r) => r.pillarId === p).map((r) => r.value);
      const recentAvg = recentVals.length
        ? recentVals.reduce((a, b) => a + b, 0) / recentVals.length
        : null;
      const prevAvg = prevVals.length
        ? prevVals.reduce((a, b) => a + b, 0) / prevVals.length
        : null;
      const recentScore =
        recentAvg !== null ? Math.round(recentAvg * 10) : null;
      const prevScore = prevAvg !== null ? Math.round(prevAvg * 10) : null;
      summary[p] = { recentAvg: recentAvg, recentScore, prevAvg, prevScore };
      if (recentAvg !== null && prevAvg !== null) {
        const diff = (recentAvg - prevAvg) * 10;
        if (diff >= 5)
          improvements.push({ pillar: p, change: Math.round(diff) });
        if (diff <= -5) declines.push({ pillar: p, change: Math.round(diff) });
      }
    }

    // Determine biggest improvement and weakest pillar (lowest recent score)
    const biggestImprovement =
      improvements.sort((a, b) => b.change - a.change)[0] || null;
    const weakest = pillars
      .map((p) => ({ pillar: p, score: summary[p].recentScore || 0 }))
      .sort((a, b) => a.score - b.score)[0];

    // Call AI to generate actions if possible
    let actions = [];
    let aiSummary = "";
    try {
      if (openai && process.env.OPENAI_API_KEY) {
        const prompt = `Weekly report data for user:\nPillar averages (0-100): ${JSON.stringify(
          Object.fromEntries(
            pillars.map((p) => [p, summary[p].recentScore || 0])
          )
        )}\nBiggest improvement: ${
          biggestImprovement
            ? biggestImprovement.pillar + " (" + biggestImprovement.change + ")"
            : "none"
        }\nWeakest pillar: ${weakest.pillar} (${
          weakest.score
        })\nProvide a short email-style summary and 3 recommended actions as a JSON object { title, summary, improvements, declines, actions }`;
        const response = await getOpenAIClient().beta.messages.create({
          model: "gpt-4-turbo",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
          betas: ["openai-beta.json-mode-latest"],
        });
        const content = response.content[0];
        if (content?.type === "text") {
          try {
            const parsed = JSON.parse(content.text);
            aiSummary = parsed.summary || "";
            actions = parsed.actions || [];
          } catch {
            aiSummary = content.text || "";
          }
        }
      }
    } catch (err) {
      console.debug("AI weekly report generation failed", err);
    }

    // Fallback summary if AI not available
    if (!aiSummary) {
      aiSummary = `Here's your 7-day summary. Biggest improvement: ${
        biggestImprovement ? biggestImprovement.pillar : "N/A"
      }. Weakest pillar: ${weakest.pillar}.`;
      actions = [
        "Log a quick daily check-in for your weakest pillar",
        "Try one small, specific action related to the biggest improvement to keep momentum",
        "Set a micro-goal for the week and track progress daily",
      ];
    }

    return {
      title: `Weekly Wellness Report`,
      summary: aiSummary,
      improvements,
      declines,
      actions,
      raw: { summary },
    };
  } catch (err) {
    console.error("buildWeeklyReport error", err);
    return null;
  }
};

export const weeklyReportAgent = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return sendAiResponse(
        res,
        { success: false, error: "Not authenticated" },
        401
      );
    const report = await buildWeeklyReport(user._id);
    if (!report)
      return sendAiResponse(
        res,
        { success: false, error: "Failed to build report" },
        500
      );
    return sendAiResponse(res, { success: true, data: report });
  } catch (err) {
    console.error("weeklyReportAgent error", err);
    return sendAiResponse(res, { success: false, error: "Server error" }, 500);
  }
};

// POST /api/ai/messages
// Phase 6.8: persist chat transcript message (append-only)
// ============================================================
// PHASE 7.1 — AI Message Writes (PG authoritative)
// - Primary write: Postgres
// - Mongo write: best-effort shadow (optional)
// ============================================================
export const createAiMessage = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return sendAiResponse(
        res,
        { success: false, error: "Not authenticated" },
        401
      );

    const userId = String(user._id);
    const body = req.body || {};

    const sessionId =
      body.sessionId !== undefined && body.sessionId !== null
        ? String(body.sessionId)
        : null;
    const role = String(body.role || "").trim();
    const content = body.content;
    const meta = body.meta;
    const allowMongoShadow = isMongoFallbackEnabled();

    emitAuditEvent({
      event: "ai.messages.create",
      userId,
      sessionId,
      source: "api",
    });

    if (!role) {
      return sendAiResponse(
        res,
        { success: false, error: "role is required" },
        400
      );
    }

    if (!Object.prototype.hasOwnProperty.call(body, "content")) {
      return sendAiResponse(
        res,
        { success: false, error: "content is required" },
        400
      );
    }

    // Primary write: Postgres (authoritative)
    let pgRow;
    try {
      pgRow = await prisma.aiMessage.create({
        data: {
          userId: String(userId),
          sessionId: sessionId ? String(sessionId) : null,
          role: String(role),
          content,
          meta: meta ?? null,
        },
      });

      emitAuditEvent({
        event: "ai_message_write",
        userId,
        sessionId,
        storage: "postgres",
        ok: true,
      });
    } catch (err) {
      emitAuditEvent({
        event: "ai_message_write",
        userId,
        sessionId,
        storage: "postgres",
        ok: false,
        error: err?.message,
      });
      console.error("[PHASE 7.1][WRITE] ai_message postgres_failed", {
        userId: String(userId),
        sessionId: sessionId ? String(sessionId) : null,
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
      throw err;
    }

    // Optional shadow write: Mongo (best-effort)
    if (allowMongoShadow) {
      try {
        const shadowMeta =
          meta && typeof meta === "object" && !Array.isArray(meta)
            ? { ...meta, pgId: pgRow.id }
            : { original: meta ?? null, pgId: pgRow.id };

        await AiMessage.create({
          userId,
          sessionId,
          role,
          content,
          meta: shadowMeta,
          createdAt: pgRow.createdAt,
        });
      } catch (err) {
        console.warn("[PHASE 7.1][WRITE] ai_message mongo_shadow_failed", {
          userId: String(userId),
          sessionId: sessionId ? String(sessionId) : null,
          name: err?.name,
          code: err?.code,
          message: err?.message || String(err),
        });
      }
    }

    return sendAiResponse(res, { success: true, message: pgRow });
  } catch (err) {
    console.error("createAiMessage error", err);
    return sendAiResponse(res, { success: false, error: "Server error" }, 500);
  }
};

// GET /api/ai/messages?sessionId=...&limit=...
// Phase 6.8: PG-first read with Mongo fallback (append-only)
export const getAiMessages = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return sendAiResponse(
        res,
        { success: false, error: "Not authenticated" },
        401
      );

    const userId = String(user._id);
    const sessionIdRaw = req.query?.sessionId;
    const sessionId =
      sessionIdRaw !== undefined && sessionIdRaw !== null && sessionIdRaw !== ""
        ? String(sessionIdRaw)
        : null;

    const limitRaw = req.query?.limit;
    const limit = Math.min(
      500,
      Math.max(1, Number.parseInt(String(limitRaw ?? "100"), 10) || 100)
    );
    const allowFallback = isMongoFallbackEnabled();

    // Phase 6.8: PG-first read with Mongo fallback
    try {
      const rows = await prisma.aiMessage.findMany({
        where: {
          userId: String(userId),
          ...(sessionId ? { sessionId: String(sessionId) } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      emitAuditEvent({
        event: "ai_message_read",
        userId,
        sessionId,
        storage: "postgres",
        ok: true,
      });

      if (rows.length > 0) {
        return sendAiResponse(
          res,
          {
            success: true,
            messages: rows.reverse().map((r) => ({
              role: r.role,
              content: r.content,
              meta: r.meta ?? undefined,
              createdAt: r.createdAt,
            })),
          },
          200
        );
      }
    } catch (err) {
      emitAuditEvent({
        event: "ai_message_read",
        userId,
        sessionId,
        storage: "postgres",
        ok: false,
        error: err?.message,
      });
      console.warn("[PHASE 6.8][READ] ai_message pg_read_failed", {
        userId,
        sessionId,
        message: err?.message || String(err),
      });
      if (!allowFallback) {
        return sendAiResponse(res, { success: true, messages: [] }, 200);
      }
    }

    if (!allowFallback) {
      return sendAiResponse(res, { success: true, messages: [] }, 200);
    }
    try {
      const messages = await AiMessage.find({
        userId,
        ...(sessionId ? { sessionId } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      emitAuditEvent({
        event: "ai_message_read",
        userId,
        sessionId,
        storage: "mongo_fallback",
        ok: true,
      });

      return sendAiResponse(res, {
        success: true,
        messages: messages.reverse(),
      });
    } catch (err) {
      emitAuditEvent({
        event: "ai_message_read",
        userId,
        sessionId,
        storage: "mongo_fallback",
        ok: false,
        error: err?.message,
      });
      throw err;
    }
  } catch (err) {
    console.error("getAiMessages error", err);
    return sendAiResponse(res, { success: false, error: "Server error" }, 500);
  }
};
