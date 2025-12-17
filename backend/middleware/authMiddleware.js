import { logAuditEvent } from "./auditLogger.js";
import { resolveEntitlements } from "../utils/entitlements.js";
import { checkSubscription } from "./subscriptionGuard.js";
import auth0JwtMiddleware from "./auth0JwtMiddleware.js";
import {
  resolveSessionUser,
  getTokenFromRequest,
} from "../utils/sessionTokens.js";

let didLogAuthOptionalError = false;

// Optional auth: populates req.user when a valid session exists.
// Never throws and never blocks unauthenticated requests.
export const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    if (
      process.env.ENABLE_AUTH0 === "true" &&
      authHeader &&
      authHeader.startsWith("Bearer ")
    ) {
      // If a Bearer token is provided, let the Auth0 verifier handle it.
      // It responds 401 on invalid tokens; otherwise it populates req.user.
      return auth0JwtMiddleware(req, res, next);
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      return next();
    }

    let session;
    try {
      session = await resolveSessionUser(req);
    } catch (_error) {
      // Invalid/expired token or DB unavailable: treat as unauthenticated.
      return next();
    }

    if (!session?.user) {
      return next();
    }

    const user = session.user;
    req.user = user;
    req.entitlements = resolveEntitlements(user);
    req.sessionPayload = session.payload;
    return next();
  } catch (error) {
    if (!didLogAuthOptionalError) {
      didLogAuthOptionalError = true;
      console.warn("authOptional error (swallowed)", error);
    }
    return next();
  }
};

export const authRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    if (
      process.env.ENABLE_AUTH0 === "true" &&
      authHeader &&
      authHeader.startsWith("Bearer ")
    ) {
      return auth0JwtMiddleware(req, res, next);
    }

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

    let session;
    try {
      session = await resolveSessionUser(req);
    } catch (error) {
      const status =
        error?.statusCode || (error?.code === "DB_UNAVAILABLE" ? 503 : 401);
      await logAuditEvent({
        action: "route-access",
        req,
        status: "denied",
        description: error.message || "Invalid session token",
      });
      return res.status(status).json({
        success: false,
        error:
          status === 503
            ? "Service temporarily unavailable"
            : "Invalid or expired token",
      });
    }

    if (!session?.user) {
      await logAuditEvent({
        action: "route-access",
        req,
        status: "denied",
        description: "Session token did not resolve to a user",
      });
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const user = session.user;
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
    req.sessionPayload = session.payload;

    await logAuditEvent({
      action: "route-access",
      req,
      userId: user._id,
      status: "success",
      description: "Authenticated request granted",
    });

    return next();
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

export const requireRole = (...allowedRoles) => {
  if (!allowedRoles.length) {
    throw new Error("requireRole middleware requires at least one role");
  }

  return async (req, res, next) => {
    if (!req.user) {
      await authRequired(req, res, () => {});
      if (!req.user) return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logAuditEvent({
        action: "rbac-denied",
        req,
        userId: req.user?._id,
        status: "denied",
        description: `Role ${req.user.role} missing required permissions`,
        metadata: { requiredRoles: allowedRoles },
      });
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    return next();
  };
};

export const requirePillarAccess = (pillarParamKey = "pillarId") => {
  const keys = Array.isArray(pillarParamKey)
    ? pillarParamKey
    : [pillarParamKey];
  return async (req, res, next) => {
    try {
      if (!req.user) {
        await authRequired(req, res, () => {});
        if (!req.user) return;
      }

      let pillarId = null;
      for (const key of keys) {
        if (!pillarId) {
          pillarId =
            req.params?.[key] || req.body?.[key] || req.query?.[key] || null;
        }
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

      return next();
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

      return next();
    } catch (err) {
      console.error("requireFeatureAccess error", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  };
};

export default {
  authRequired,
  requireRole,
  requirePillarAccess,
  requireFeatureAccess,
};
