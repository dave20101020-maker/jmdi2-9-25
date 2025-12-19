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

    const { pillarId, actions } = req.body || {};
    if (!pillarId || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: "pillarId and actions array are required",
      });
    }

    const plan = new ActionPlan({ userId: user._id, pillarId, actions });
    await plan.save();

    // Phase 6.7: Dual-write ActionPlan to Postgres (best-effort)
    try {
      const doc =
        typeof plan?.toObject === "function"
          ? plan.toObject({ depopulate: true })
          : plan;

      const mongoId = String(plan?._id);
      const pgId = stableUuidFromString(`action_plan:mongo:${mongoId}`);

      await prisma.actionPlan.upsert({
        where: { id: pgId },
        create: {
          id: pgId,
          userId: String(plan.userId),
          doc,
        },
        update: {
          doc,
        },
      });
    } catch (err) {
      console.warn("[PHASE 6.7][DUAL WRITE] action_plan pg_upsert_failed", {
        actionPlanId: String(plan?._id),
        userId: String(plan?.userId),
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
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

    return res.json({ success: true, plan });
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

    const result = await ActionPlan.deleteOne({ _id: planId, userId });
    if (!result?.deletedCount) {
      return res
        .status(404)
        .json({ success: false, error: "Action plan not found" });
    }

    // Phase 6.7: Best-effort delete from Postgres
    try {
      const pgId = stableUuidFromString(`action_plan:mongo:${String(planId)}`);

      await prisma.actionPlan.delete({
        where: { id: pgId },
      });
    } catch (err) {
      console.warn("[PHASE 6.7][DELETE] action_plan pg_delete_failed", {
        actionPlanId: String(planId),
        userId: String(userId),
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
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
