import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { resolveEntitlements } from "./entitlements.js";
import { getPrivateKey, getPublicKey } from "./jwtKeys.js";

const SESSION_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "ns_session";
const SESSION_MAX_AGE_MS =
  Number(process.env.AUTH_SESSION_MAX_AGE_MS) || 60 * 60 * 1000;
const isCodespaces = Boolean(
  process.env.CODESPACES ||
    process.env.CODESPACE_NAME ||
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
);
const forwardedDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const COOKIE_DOMAIN =
  process.env.AUTH_COOKIE_DOMAIN ||
  (isCodespaces && forwardedDomain ? `.${forwardedDomain}` : undefined);
const COOKIE_SECURE =
  process.env.AUTH_COOKIE_SECURE === "true" ||
  process.env.NODE_ENV === "production" ||
  isCodespaces;
const COOKIE_SAMESITE =
  process.env.AUTH_COOKIE_SAMESITE || (COOKIE_DOMAIN ? "lax" : "strict");
const JWT_EXPIRES_IN = process.env.AUTH_JWT_EXPIRES_IN || "1h";
const JWT_ISSUER = process.env.AUTH_JWT_ISSUER || "northstar";
const JWT_AUDIENCE = process.env.AUTH_JWT_AUDIENCE || "northstar.app";
const JWT_KID = process.env.AUTH_JWT_KID || "ns-primary";
const CLOCK_TOLERANCE = Number(process.env.AUTH_JWT_CLOCK_TOLERANCE || 5);

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  const { passwordHash, refreshTokens, __v, ...rest } = plain;
  return {
    ...rest,
    entitlements: resolveEntitlements(plain),
  };
};

const buildPayload = (user) => ({
  sub: user._id.toString(),
  email: user.email,
  role: user.role,
  tier: user.subscriptionTier,
  iss: JWT_ISSUER,
  aud: JWT_AUDIENCE,
});

const signSessionToken = (user) =>
  jwt.sign(buildPayload(user), getPrivateKey(), {
    algorithm: "RS256",
    expiresIn: JWT_EXPIRES_IN,
    keyid: JWT_KID,
  });

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAMESITE,
  maxAge: SESSION_MAX_AGE_MS,
  domain: COOKIE_DOMAIN,
  path: "/",
});

export const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE_NAME, token, buildCookieOptions());
};

export const clearSessionCookie = (res) => {
  res.clearCookie(SESSION_COOKIE_NAME, buildCookieOptions());
};

export const issueSession = async (
  user,
  req,
  res,
  { updateLoginTimestamp = false } = {}
) => {
  if (updateLoginTimestamp) {
    user.lastLoginAt = new Date();
  }
  if (typeof user.isModified === "function" && user.isModified()) {
    await user.save();
  }
  const token = signSessionToken(user);
  setSessionCookie(res, token);
  return sanitizeUser(user);
};

export const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) return cookieToken;
  return null;
};

export const verifySessionToken = (token) =>
  jwt.verify(token, getPublicKey(), {
    algorithms: ["RS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    clockTolerance: CLOCK_TOLERANCE,
  });

export const resolveSessionUser = async (req) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifySessionToken(token);
  const readyState = mongoose.connection.readyState;
  if (readyState !== 1) {
    const error = new Error("Database unavailable");
    error.code = "DB_UNAVAILABLE";
    error.statusCode = 503;
    throw error;
  }
  const user = await User.findById(payload.sub).select(
    "-passwordHash -refreshTokens"
  );
  if (!user) return null;
  return { user, payload };
};

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const SESSION_TTL_MS = SESSION_MAX_AGE_MS;
export const sanitizeUserDocument = sanitizeUser;

export default {
  issueSession,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromRequest,
  verifySessionToken,
  resolveSessionUser,
  sanitizeUserDocument,
  SESSION_COOKIE,
  SESSION_TTL_MS,
};
