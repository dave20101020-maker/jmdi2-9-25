import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  createCheckoutSession,
  createBillingPortal,
  webhookHandler,
  paymentsStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/status", paymentsStatus);
router.post("/checkout-session", authRequired, createCheckoutSession);
router.post("/portal", authRequired, createBillingPortal);
router.post(
  "/webhook",
  express.json({
    type: "application/json",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
  webhookHandler
);

export default router;
