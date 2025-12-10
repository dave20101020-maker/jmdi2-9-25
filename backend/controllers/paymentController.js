import { logAuditEvent } from "../middleware/auditLogger.js";
import {
  buildCheckoutSession,
  createBillingPortalSession,
  resolveWebhookEvent,
  handleWebhookEvent,
  isStripeAvailable,
} from "../services/paymentService.js";

export const createCheckoutSession = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  const {
    priceId = null,
    mode = "subscription",
    plan = "premium",
    successUrl,
    cancelUrl,
  } = req.body || {};
  const session = await buildCheckoutSession({
    user,
    priceId,
    mode,
    successUrl,
    cancelUrl,
    metadata: { plan, source: "api" },
  });

  await logAuditEvent({
    action: "payment-checkout-created",
    req,
    userId: user._id,
    status: "success",
    metadata: { provider: session.provider, mode, priceId, plan },
  });

  return res.status(201).json({
    success: true,
    checkoutUrl: session.url,
    sessionId: session.id,
    provider: session.provider,
    mode: session.mode,
  });
};

export const createBillingPortal = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  const { returnUrl } = req.body || {};
  const session = await createBillingPortalSession({ user, returnUrl });

  await logAuditEvent({
    action: "payment-portal-created",
    req,
    userId: user._id,
    status: "success",
    metadata: { provider: session.provider },
  });

  return res
    .status(201)
    .json({ success: true, url: session.url, provider: session.provider });
};

export const webhookHandler = async (req, res) => {
  const { event, verified, provider } = await resolveWebhookEvent(req);
  const result = await handleWebhookEvent(event);

  await logAuditEvent({
    action: "payment-webhook",
    req,
    status: "success",
    metadata: { type: event?.type, verified, provider },
  });

  return res.json({
    received: true,
    type: event?.type,
    handled: result.handled,
    provider,
  });
};

export const paymentsStatus = async (_req, res) => {
  const stripeReady = await isStripeAvailable();
  return res.json({
    success: true,
    provider: stripeReady ? "stripe" : "stub",
    message: stripeReady
      ? "Stripe payments active"
      : "Stripe keys missing; running in stubbed checkout mode",
  });
};

export default {
  createCheckoutSession,
  createBillingPortal,
  webhookHandler,
  paymentsStatus,
};
