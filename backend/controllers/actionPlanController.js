// ============================================================
// PHASE 6.7 LOCKED — Action Plans
// - Postgres (action_plan) is primary read source
// - Mongo ActionPlan is fallback only
// - Dual-write on create/update/delete
// - Deterministic ID mapping (Mongo _id -> PG id)
// - API behavior frozen
// ============================================================

import ActionPlan from "../models/ActionPlan.js";
import { prisma } from "../src/db/prismaClient.js";
import { isMongoFallbackEnabled } from "../src/utils/readSwitch.js";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const stableUuidFromString = (input) => {
  const hash = crypto.createHash("sha256").update(String(input)).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createActionPlan = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    // ============================================================
    // PHASE 6.7 LOCKED — Action Plan Reads
    // - PG-first reads with Mongo fallback
    // ============================================================
    // ============================================================
    // PHASE 7.2 — Action Plan Writes (PG authoritative)
    // - Primary write: Postgres
    // - Mongo write: best-effort shadow (optional)
    // ============================================================

    const { pillarId, actions } = req.body || {};
    if (!pillarId || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: "pillarId and actions array are required",
      });
    }

    const allowMongoShadow = isMongoFallbackEnabled();
    const userId = user._id;

    // Keep legacy ID shape stable for clients by minting a Mongo ObjectId,
    // then using deterministic mapping for the Postgres UUID id.
    const mongoId = new mongoose.Types.ObjectId();
    const pgId = stableUuidFromString(`action_plan:mongo:${String(mongoId)}`);

    const doc = {
      _id: String(mongoId),
      userId: String(userId),
      pillarId,
      actions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Primary write: Postgres (authoritative)
    let pgRow;
    try {
      pgRow = await prisma.actionPlan.create({
        data: {
          id: pgId,
          userId: String(userId),
          doc,
        },
      });
    } catch (err) {
      console.error("[PHASE 7.2][WRITE] action_plan postgres_failed", {
        userId: String(userId),
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
      return res.status(500).json({
        success: false,
        error: "Failed to create action plan",
      });
    }

    // Optional shadow write: Mongo (best-effort)
    if (allowMongoShadow) {
      try {
        await ActionPlan.create({
          _id: mongoId,
          userId,
          pillarId,
          actions,
          createdAt: pgRow.createdAt,
          updatedAt: pgRow.updatedAt,
        });
      } catch (err) {
        console.warn("[PHASE 7.2][WRITE] action_plan mongo_shadow_failed", {
          actionPlanId: String(mongoId),
          userId: String(userId),
          name: err?.name,
          code: err?.code,
          message: err?.message || String(err),
        });
      }
    }

    // create notification for user about saved plan
    try {
      await Notification.create({
        userId: user._id,
        type: "plan",
        title: "New action plan saved",
        message: `Saved ${actions.length} action(s) for ${pillarId}`,
      });
    } catch (e) {
      console.debug("failed to create plan notification", e);
    }

    return res.json({ success: true, plan: pgRow.doc ?? doc });
  } catch (err) {
    console.error("createActionPlan error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getLatestPlanForPillar = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const pillarId = req.params.pillarId;
    if (!pillarId)
      return res
        .status(400)
        .json({ success: false, error: "pillarId required" });

    const userId = String(user._id);
    const allowFallback = isMongoFallbackEnabled();

    // Phase 6.7+: PG-first read; JSON field filter done in-process for simplicity.
    try {
      const rows = await prisma.actionPlan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 2000,
      });

      const hit = rows.find((r) => r?.doc?.pillarId === pillarId);
      if (hit) {
        return res.json({ success: true, plan: hit.doc });
      }

      if (!allowFallback) {
        return res.json({ success: true, plan: null });
      }
    } catch (err) {
      console.warn("[PHASE 6.7][READ] action_plan_latest pg_read_failed", {
        userId,
        pillarId,
        message: err?.message || String(err),
      });

      if (!allowFallback) {
        return res.status(500).json({ success: false, error: "Server error" });
      }
    }

    const plan = await ActionPlan.findOne({ userId: user._id, pillarId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, plan });
  } catch (err) {
    console.error("getLatestPlanForPillar error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getActionPlans = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const userId = String(user._id);
    const allowFallback = isMongoFallbackEnabled();

    // Phase 6.7: PG-first read with Mongo fallback
    try {
      const rows = await prisma.actionPlan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (rows.length > 0) {
        return res.json(rows.map((r) => r.doc));
      }
    } catch (err) {
      console.warn("[PHASE 6.7][READ] action_plan pg_read_failed", {
        userId,
        message: err?.message || String(err),
      });
      if (!allowFallback) {
        return res.status(500).json({ error: "Failed to fetch action plans" });
      }
    }

    if (!allowFallback) return res.json([]);
    const plans = await ActionPlan.find({ userId }).sort({ createdAt: -1 });
    return res.json(plans);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch action plans" });
  }
};

export const deleteActionPlan = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const planId = req.params.planId;
    if (!planId) {
      return res.status(400).json({ success: false, error: "planId required" });
    }

    const userId = user._id;
    const allowMongoShadow = isMongoFallbackEnabled();

    // Phase 7.2: Primary delete from Postgres (authoritative)
    try {
      const pgId = stableUuidFromString(`action_plan:mongo:${String(planId)}`);
      await prisma.actionPlan.delete({ where: { id: pgId } });
    } catch (err) {
      if (err?.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, error: "Action plan not found" });
      }

      console.warn("[PHASE 7.2][DELETE] action_plan pg_delete_failed", {
        actionPlanId: String(planId),
        userId: String(userId),
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
      return res.status(500).json({ success: false, error: "Server error" });
    }

    // Optional shadow delete from Mongo (best-effort)
    if (allowMongoShadow) {
      try {
        await ActionPlan.deleteOne({ _id: planId, userId });
      } catch (err) {
        console.warn("[PHASE 7.2][DELETE] action_plan mongo_shadow_failed", {
          actionPlanId: String(planId),
          userId: String(userId),
          name: err?.name,
          code: err?.code,
          message: err?.message || String(err),
        });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteActionPlan error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export default {
  createActionPlan,
  getLatestPlanForPillar,
  getActionPlans,
  deleteActionPlan,
};
