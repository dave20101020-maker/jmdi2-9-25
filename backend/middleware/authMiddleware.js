import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logAuditEvent } from "./auditLogger.js";
import { resolveEntitlements } from "../utils/entitlements.js";
import { checkSubscription } from "./subscriptionGuard.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const ACCESS_COOKIE_NAME = process.env.JWT_ACCESS_COOKIE_NAME || "ns_at";

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const header = req.headers["authorization"];
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
};

export const authRequired = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      await logAuditEvent({
        action: "route-access",
        req,
        status: "denied",
        description: "Missing authentication token",
      });
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      await logAuditEvent({
        action: "route-access",
        req,
        status: "denied",
        description: "Invalid or expired token",
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid or expired token" });
    }

    const user = await User.findById(payload.sub || payload.id).select(
      "-passwordHash -refreshTokens"
    );
    if (!user) {
      await logAuditEvent({
        action: "route-access",
        req,
        status: "denied",
        description: "User referenced in token was not found",
        userId: payload.sub || payload.id || null,
      });
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const entitlements = resolveEntitlements(user);
    user.entitlements = entitlements;
    const subscription = await checkSubscription(user);
    if (subscription) {
      req.subscription = subscription;
      user.subscription = subscription;
      if (subscription.allowedPillars?.length) {
        user.allowedPillars = subscription.allowedPillars;
      }
    }
    req.user = user;
    req.entitlements = entitlements;
    await logAuditEvent({
      action: "route-access",
      req,
      userId: user._id,
      status: "success",
      description: "Authenticated request granted",
    });
    next();
  } catch (err) {
    console.error("authRequired error", err);
    await logAuditEvent({
      action: "route-access",
      req,
      status: "failure",
      description: err?.message || "authRequired middleware error",
    });
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Middleware factory to require that the current user has access to a pillar.
 * pillarParamKey: the key in req.params or req.body where the pillar id can be found.
 */
export const requirePillarAccess = (pillarParamKey = "pillarId") => {
  // pillarParamKey may be a string or array of candidate keys
  const keys = Array.isArray(pillarParamKey)
    ? pillarParamKey
    : [pillarParamKey];
  return async (req, res, next) => {
    try {
      // ensure authRequired has run or run it here
      if (!req.user) {
        await authRequired(req, res, () => {});
        if (!req.user) return; // authRequired already sent a response
      }

      // try params, body, or query for any of the candidate keys
      let pillarId = null;
      for (const key of keys) {
        if (!pillarId)
          pillarId = req.params?.[key] || req.body?.[key] || req.query?.[key];
      }

      if (!pillarId) {
        return res.status(400).json({
          success: false,
          error: "Missing pillar identifier in request",
        });
      }

      const allowed = Array.isArray(req.user.allowedPillars)
        ? req.user.allowedPillars
        : [];
      if (!allowed.includes(pillarId)) {
        return res.status(403).json({
          success: false,
          error: `Access to pillar '${pillarId}' is not permitted for your subscription tier (${
            req.user.subscriptionTier || "unknown"
          })`,
        });
      }

      next();
    } catch (err) {
      console.error("requirePillarAccess error", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  };
};

export const requireFeatureAccess = (featureKey) => {
  if (!featureKey || typeof featureKey !== "string") {
    throw new Error("requireFeatureAccess requires a feature key");
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        await authRequired(req, res, () => {});
        if (!req.user) return;
      }

      const entitlements = resolveEntitlements(req.user);
      req.user.entitlements = entitlements;
      req.entitlements = entitlements;

      if (!entitlements.features.includes(featureKey)) {
        await logAuditEvent({
          action: "feature-access",
          req,
          userId: req.user?._id || null,
          status: "denied",
          description: `Missing feature: ${featureKey}`,
          metadata: {
            featureKey,
            plan: entitlements.plan,
          },
        });
        return res.status(403).json({
          success: false,
          error: `Feature '${featureKey}' is not available on your plan (${entitlements.plan})`,
        });
      }

      next();
    } catch (err) {
      console.error("requireFeatureAccess error", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  };
};

/**
 * Logout handler - clears the authentication cookie
 */
export default { authRequired, requirePillarAccess, requireFeatureAccess };
