import express from "express";
import { authRequired } from "../../middleware/authMiddleware.js";
import { appendEvent, put, query } from "../vault/VaultService.js";
import { VAULT_RECORD_TYPES } from "../vault/VaultTypes.js";
import PillarScore from "../../models/PillarScore.js";
import { prisma } from "../db/prismaClient.js";
import { pgFirstRead } from "../utils/readSwitch.js";

const router = express.Router();
router.use(authRequired);

const LIFECYCLE_STATES = new Set([
  "shown",
  "acted",
  "deferred",
  "dismissed",
  "invoked",
  "completed",
]);

const isValidLifecycle = (value) => LIFECYCLE_STATES.has(value);

const MISSION_CONTROL_PILLARS = [
  { key: "sleep", pillar: "sleep" },
  { key: "diet", pillar: "diet" },
  { key: "exercise", pillar: "exercise" },
  { key: "physical", pillar: "physical_health" },
  { key: "mental", pillar: "mental_health" },
  { key: "finances", pillar: "finances" },
  { key: "social", pillar: "social" },
  { key: "spiritual", pillar: "spirituality" },
];

const buildMissionControlState = (scores = []) => {
  const scoreMap = new Map(
    scores
      .filter((entry) => entry && typeof entry.pillar === "string")
      .map((entry) => [entry.pillar, entry.score])
  );
  const pillars = MISSION_CONTROL_PILLARS.reduce((acc, { key, pillar }) => {
    const score = scoreMap.get(pillar);
    acc[key] = { score: Number.isFinite(score) ? score : null };
    return acc;
  }, {});
  const numericScores = Object.values(pillars)
    .map((pillar) => pillar.score)
    .filter((score) => Number.isFinite(score));
  const hasAnyData = numericScores.length > 0;
  const lifeScore = hasAnyData
    ? Math.round(
        numericScores.reduce((sum, score) => sum + score, 0) /
          numericScores.length
      )
    : null;

  return {
    hasAnyData,
    lifeScore,
    pillars,
    momentum: { checkIns: 0, streaks: 0 },
    distressSignals: false,
    lastActionAt: null,
    todayCompleted: false,
  };
};

router.post("/action/event", async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const actionId = req.body?.actionId;
  const lifecycle = req.body?.lifecycle;
  const timestamp = req.body?.timestamp || Date.now();
  const meta = req.body?.meta || {};
  const priorityContext = req.body?.priorityContext || {};

  if (!actionId || !isValidLifecycle(lifecycle)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid action event payload",
    });
  }

  try {
    await appendEvent(
      "mission_control.action",
      {
        actionId,
        lifecycle,
        timestamp,
        meta,
        priorityContext,
      },
      { userId, type: VAULT_RECORD_TYPES.MISSION_CONTROL_ACTION_EVENT }
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    const status =
      error?.message === "vault_unavailable" ||
      error?.message === "mongo_unavailable"
        ? 503
        : 500;
    return res.status(status).json({
      ok: false,
      error: "Failed to record action event",
    });
  }
});

router.put("/action/state", async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const actionId = req.body?.actionId;
  const lifecycle = req.body?.lifecycle;
  const lastUpdatedAt = req.body?.lastUpdatedAt || Date.now();
  const userAgency = req.body?.userAgency || {};
  const priorityContext = req.body?.priorityContext || {};

  if (!actionId || !isValidLifecycle(lifecycle)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid action state payload",
    });
  }

  try {
    const vaultResponse = await put(
      VAULT_RECORD_TYPES.MISSION_CONTROL_ACTION_STATE,
      {
        actionId,
        lifecycle,
        lastUpdatedAt,
        userAgency,
        priorityContext,
      },
      {
        userId,
        timestamp: lastUpdatedAt,
      }
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
      error: "Failed to persist action state",
    });
  }
});

router.get("/action/state", async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  try {
    const result = await query(
      VAULT_RECORD_TYPES.MISSION_CONTROL_ACTION_STATE,
      {},
      { userId }
    );

    const latest = result?.items?.[0] || null;

    return res.status(200).json({
      ok: true,
      state: latest?.payload || null,
      timestamp: latest?.timestamp || null,
    });
  } catch (error) {
    const status =
      error?.message === "vault_unavailable" ||
      error?.message === "mongo_unavailable"
        ? 503
        : 500;
    return res.status(status).json({
      ok: false,
      error: "Failed to fetch action state",
    });
  }
});

router.get("/state", async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, error: "Auth required" });
  }

  try {
    const scores = await pgFirstRead({
      label: "missionControl:state",
      meta: { userId: String(userId) },
      pgRead: async () => {
        const rows = await prisma.pillarScore.findMany({
          where: { userId: String(userId) },
        });
        return rows.map((row) => ({
          pillar: row.pillarIdentifier,
          score: row.score,
        }));
      },
      mongoRead: async () =>
        PillarScore.find({ userId: String(userId) })
          .select("pillar score")
          .lean(),
    });

    return res.status(200).json({
      ok: true,
      source: "db",
      state: buildMissionControlState(scores),
    });
  } catch (error) {
    return res.status(200).json({
      ok: true,
      source: "placeholder",
      state: buildMissionControlState([]),
    });
  }
});

export default router;
