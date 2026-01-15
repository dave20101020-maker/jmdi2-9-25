import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { appendEvent } from "../src/vault/VaultService.js";

const router = express.Router();
router.use(authRequired);

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

export default router;
