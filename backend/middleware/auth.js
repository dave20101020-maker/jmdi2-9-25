import jwt from "jsonwebtoken";
import User from "../models/User.js";
import env from "../config/env.js";

const buildAuthError = (message = "Authentication required") => ({
  success: false,
  error: message,
});

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret, {
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
  });
};

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || req.cookies?.access_token;
    if (!token) return res.status(401).json(buildAuthError());

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return res.status(401).json(buildAuthError("User not found"));

    req.user = user;
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json(buildAuthError("Invalid or expired token"));
  }
};

export const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      await requireAuth(req, res, () => {});
      if (!req.user) return;
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, error: "Insufficient role" });
    }
    return next();
  };
};

export const requirePlan = (...tiers) => {
  return async (req, res, next) => {
    if (!req.user) {
      await requireAuth(req, res, () => {});
      if (!req.user) return;
    }
    const tier = req.user.subscriptionTier || "free";
    if (tiers.length && !tiers.includes(tier)) {
      return res
        .status(403)
        .json({ success: false, error: "Plan upgrade required" });
    }
    return next();
  };
};

export default { requireAuth, requireRole, requirePlan };
