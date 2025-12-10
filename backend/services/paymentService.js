import env from "../config/env.js";
import User from "../models/User.js";
import { mapTierToLegacy } from "../utils/subscriptionAccess.js";

const stripeSecret = env.stripe.secretKey;
const webhookSecret = env.stripe.webhookSecret;
const hasStripeConfig = Boolean(stripeSecret);

let stripePromise;
const getStripe = () => {
  if (stripePromise) return stripePromise;
  if (!hasStripeConfig) {
    stripePromise = Promise.resolve(null);
    return stripePromise;
  }

  stripePromise = import("stripe")
    .then(
      ({ default: Stripe }) =>
        new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
    )
    .catch((err) => {
      console.warn(
        "Stripe SDK unavailable, falling back to stub mode",
        err?.message
      );
      return null;
    });

  return stripePromise;
};

const defaultUrls = {
  success:
    process.env.CHECKOUT_SUCCESS_URL ||
    "https://northstar.local/checkout/success",
  cancel:
    process.env.CHECKOUT_CANCEL_URL ||
    "https://northstar.local/checkout/cancel",
  portalReturn:
    process.env.BILLING_RETURN_URL || "https://northstar.local/account/billing",
};

export const buildCheckoutSession = async ({
  user,
  priceId,
  mode = "subscription",
  metadata = {},
  successUrl,
  cancelUrl,
}) => {
  if (!user) throw new Error("User required for checkout session");

  const stripe = await getStripe();

  if (!stripe) {
    const stubUrl = `${successUrl || defaultUrls.success}?checkout=stub&user=${
      user.id
    }`;
    return {
      provider: "stub",
      id: `stub_${Date.now()}`,
      url: stubUrl,
      mode,
      metadata,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    success_url: successUrl || defaultUrls.success,
    cancel_url: cancelUrl || defaultUrls.cancel,
    line_items: priceId
      ? [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      : undefined,
    metadata: {
      userId: String(user._id),
      plan: metadata.plan || "premium",
      source: metadata.source || "app",
    },
  });

  return {
    provider: "stripe",
    id: session.id,
    url: session.url,
    mode,
    metadata: session.metadata,
  };
};

export const createBillingPortalSession = async ({ user, returnUrl }) => {
  if (!user) throw new Error("User required for billing portal");

  const stripe = await getStripe();

  if (!stripe) {
    const stubUrl = `${
      returnUrl || defaultUrls.portalReturn
    }?portal=stub&user=${user.id}`;
    return {
      provider: "stub",
      url: stubUrl,
    };
  }

  const customerId = user.billing?.stripeCustomerId;
  if (!customerId) {
    throw new Error("Stripe customer ID missing on user");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || defaultUrls.portalReturn,
  });

  return {
    provider: "stripe",
    url: session.url,
  };
};

const applySubscriptionStatus = async ({
  userId,
  tier = "premium",
  expiresAt = null,
  source = "checkout",
}) => {
  if (!userId) return null;
  let user = null;
  try {
    user = await User.findById(userId);
  } catch (err) {
    console.warn("applySubscriptionStatus lookup failed", err?.message);
    return null;
  }

  if (!user) return null;

  const now = new Date();
  user.subscription = {
    ...(user.subscription || {}),
    tier,
    status: "active",
    startedAt: now,
    expiresAt,
    source,
    trialEndsAt: null,
    trialUsed: user.subscription?.trialUsed ?? true,
  };
  user.subscriptionTier = mapTierToLegacy(tier);
  await user.save();
  return user;
};

export const isStripeAvailable = async () => Boolean(await getStripe());

export const resolveWebhookEvent = async (req) => {
  const stripe = await getStripe();
  if (!stripe || !webhookSecret) {
    return { event: req.body, verified: false, provider: "stub" };
  }

  const signature = req.headers["stripe-signature"];
  const payload = req.rawBody || req.body;
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );
  return { event, verified: true, provider: "stripe" };
};

export const handleWebhookEvent = async (event) => {
  if (!event?.type) return { handled: false };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data?.object || {};
      const userId = session.metadata?.userId;
      await applySubscriptionStatus({
        userId,
        tier: "premium",
        source: "checkout",
      });
      return { handled: true, type: event.type };
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data?.object || {};
      const userId = subscription.metadata?.userId;
      const expiresAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
      const tier = subscription.items?.data?.[0]?.price?.nickname || "premium";
      await applySubscriptionStatus({
        userId,
        tier,
        expiresAt,
        source: "stripe-subscription",
      });
      return { handled: true, type: event.type };
    }
    default:
      return { handled: false, type: event.type };
  }
};

export default {
  buildCheckoutSession,
  createBillingPortalSession,
  resolveWebhookEvent,
  handleWebhookEvent,
  isStripeAvailable,
};
