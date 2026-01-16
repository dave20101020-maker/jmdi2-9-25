import express from "express";
import mongoose from "mongoose";
import { authRequired } from "../middleware/authMiddleware.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import asyncHandler from "../utils/asyncHandler.js";
import { appendEvent } from "../src/vault/VaultService.js";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();
router.use(authRequired);
const isMongoReady = () =>
  AuditLog?.db?.readyState === 1 || mongoose.connection.readyState === 1;

router.post(
  "/event",
  asyncHandler(async (req, res) => {
    const eventType = req.body?.eventType;
    const payload = req.body?.payload || {};
    const metadata = req.body?.metadata || {};

    if (!eventType || typeof eventType !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "eventType is required" });
    }

    try {
      await appendEvent(eventType, payload, {
        ...metadata,
        userId: req.user?._id || req.user?.id,
      });
      const mergedMetadata = {
        eventType,
        ...(payload && typeof payload === "object" ? payload : {}),
        ...(metadata && typeof metadata === "object" ? metadata : {}),
      };
      await logAuditEvent({
        action: eventType,
        req,
        status: "success",
        description: "Audit event recorded",
        metadata: mergedMetadata,
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.warn("[auditEvents] Failed to append audit event", {
        eventType,
        error: error?.message,
      });
      return res.status(500).json({ ok: false, error: "audit_event_failed" });
    }
  })
);

router.get(
  "/routing",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query?.limit) || 8, 50);
    if (!process.env.MONGO_URI || !isMongoReady()) {
      return res.status(200).json({ ok: true, events: [] });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(200).json({ ok: true, events: [] });
    }

    const logs = await AuditLog.find({ action: "AI_ROUTED", userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const events = logs.map((log) => ({
      id: log?._id?.toString?.() || null,
      type: log?.action || "AI_ROUTED",
      from: log?.metadata?.from || "northstar",
      to: log?.metadata?.to || null,
      pillar: log?.metadata?.pillar || null,
      timestamp:
        log?.metadata?.timestamp ||
        (log?.createdAt ? new Date(log.createdAt).toISOString() : null),
      requestId: log?.metadata?.requestId || null,
    }));

    return res.status(200).json({ ok: true, events });
  })
);

export default router;
