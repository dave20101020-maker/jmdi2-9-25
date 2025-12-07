import argon2 from "argon2";
import crypto from "crypto";
import fetch from "node-fetch";
import User from "../models/User.js";
import OAuthState from "../models/OAuthState.js";
import {
  issueSession,
  clearSessionCookie,
  sanitizeUserDocument,
  resolveSessionUser,
} from "../utils/sessionTokens.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { resolveEntitlements } from "../utils/entitlements.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = Number(process.env.AUTH_MIN_PASSWORD || 8);
const DEFAULT_REDIRECT_PATH = "/dashboard";
const CLIENT_BASE_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  "http://localhost:5173";
const API_BASE_URL = process.env.API_BASE_URL || process.env.SERVER_URL || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  `${API_BASE_URL}/api/auth/oauth/google/callback`;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_REDIRECT_URI =
  process.env.FACEBOOK_OAUTH_REDIRECT_URI ||
  `${API_BASE_URL}/api/auth/oauth/facebook/callback`;
const OAUTH_STATE_TTL_MS = Number(
  process.env.OAUTH_STATE_TTL_MS || 5 * 60 * 1000
);
const AUTH_SCOPES = {
  google: ["openid", "email", "profile"],
  facebook: ["public_profile", "email"],
};
const ALL_PILLARS = [
  "sleep",
  "diet",
  "exercise",
  "physical_health",
  "mental_health",
  "finances",
  "social",
  "spirituality",
];

const determineAllowedPillars = (tier = "free") => {
  if (tier === "basic") return ALL_PILLARS.slice(0, 4);
  if (tier === "premium" || tier === "nhs_referred") return [...ALL_PILLARS];
  return ["sleep", "mental_health"];
};

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const safeRedirect = (candidate) => {
  if (!candidate) {
    return new URL(DEFAULT_REDIRECT_PATH, CLIENT_BASE_URL).toString();
  }
  try {
    const url = candidate.startsWith("http")
      ? new URL(candidate)
      : new URL(candidate, CLIENT_BASE_URL);
    const allowedOrigin = new URL(CLIENT_BASE_URL).origin;
    if (url.origin !== allowedOrigin) {
      return new URL(DEFAULT_REDIRECT_PATH, CLIENT_BASE_URL).toString();
    }
    return url.toString();
  } catch (error) {
    console.warn("[authController] Invalid redirect candidate", {
      candidate,
      error: error.message,
    });
    return new URL(DEFAULT_REDIRECT_PATH, CLIENT_BASE_URL).toString();
  }
};

const buildAuditMetadata = (extra = {}) => ({
  ...extra,
  timestamp: new Date().toISOString(),
});

const generateUniqueUsername = async (seed) => {
  const normalized = (seed || "northstar")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  let attempt = 0;
  while (attempt < 50) {
    const suffix = attempt === 0 ? "" : `${Math.floor(Math.random() * 10000)}`;
    const candidate = `${normalized}${suffix}`.slice(0, 24) || `pilot${Date.now()}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
    attempt += 1;
  }
  return `${normalized}${crypto.randomBytes(2).toString("hex")}`;
};

const ensureGoogleConfigured = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    const error = new Error("Google OAuth is not configured");
    error.statusCode = 503;
    throw error;
  }
};

const ensureFacebookConfigured = () => {
  if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET || !FACEBOOK_REDIRECT_URI) {
    const error = new Error("Facebook OAuth is not configured");
    error.statusCode = 503;
    throw error;
  }
};

const rememberOAuthState = async ({ state, provider, redirectUri, ip }) => {
  await OAuthState.create({
    state,
    provider,
    redirectUri,
    metadata: { ip },
    expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });
};

const consumeOAuthState = async ({ state, provider }) => {
  if (!state) return null;
  return OAuthState.findOneAndDelete({ state, provider });
};

const upsertOAuthUser = async ({ provider, email, name, avatar, providerId }) => {
  const normalizedEmail = normalizeEmail(email);
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const usernameSeed = name || normalizedEmail.split("@")[0];
    const username = await generateUniqueUsername(usernameSeed);
    const passwordHash = await argon2.hash(
      crypto.randomBytes(32).toString("hex")
    );
    user = new User({
      username,
      name: name || usernameSeed,
      email: normalizedEmail,
      passwordHash,
      subscriptionTier: "free",
      allowedPillars: determineAllowedPillars("free"),
      role: "user",
    });
  }

  if (provider === "google") {
    user.googleId = providerId;
    user.emailVerified = true;
  }
  if (provider === "facebook") {
    user.facebookId = providerId;
  }

  if (!user.settings?.preferences?.avatar && avatar) {
    user.settings = user.settings || {};
    user.settings.profile = user.settings.profile || {};
    user.settings.profile.avatar = avatar;
  }

  user.linkedProviders = Array.from(
    new Set([...(user.linkedProviders || []), provider])
  );
  user.entitlements = resolveEntitlements(user);
  await user.save();
  return user;
};

const respondWithSession = async (user, req, res, message, auditMetadata = {}) => {
  const sessionUser = await issueSession(user, req, res, {
    updateLoginTimestamp: true,
  });
  await logAuditEvent({
    action: "session-issue",
    req,
    userId: user._id,
    status: "success",
    description: message,
    metadata: buildAuditMetadata(auditMetadata),
  });
  return res.status(200).json({ success: true, data: sessionUser });
};

export const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!EMAIL_REGEX.test(email || "")) {
      return res
        .status(400)
        .json({ success: false, error: "Valid email is required" });
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: "Account already exists" });
    }

    const usernameSeed = name || normalizedEmail.split("@")[0];
    const username = await generateUniqueUsername(usernameSeed);
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      parallelism: 1,
      timeCost: 2,
    });

    const user = new User({
      username,
      name: name?.trim() || usernameSeed,
      email: normalizedEmail,
      passwordHash,
      subscriptionTier: "free",
      allowedPillars: determineAllowedPillars("free"),
      role: "user",
    });

    await user.save();
    const sessionUser = await issueSession(user, req, res, {
      updateLoginTimestamp: true,
    });
    await logAuditEvent({
      action: "register",
      req,
      userId: user._id,
      status: "success",
      description: "Account created via email/password",
      metadata: buildAuditMetadata({ method: "password" }),
    });

    return res.status(201).json({ success: true, data: sessionUser });
  } catch (error) {
    console.error("registerUser error", error);
    await logAuditEvent({
      action: "register",
      req,
      status: "failure",
      description: error.message,
    });
    return res.status(500).json({ success: false, error: "Unable to register" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: "emailOrUsername and password required",
      });
    }

    const normalized = normalizeEmail(emailOrUsername);
    const user = await User.findOne({
      $or: [{ email: normalized }, { username: emailOrUsername.trim() }],
    });

    if (!user) {
      await logAuditEvent({
        action: "login-attempt",
        req,
        status: "failure",
        description: "Account not found",
        metadata: buildAuditMetadata({ identifier: normalized }),
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      await logAuditEvent({
        action: "login-attempt",
        req,
        userId: user._id,
        status: "failure",
        description: "Incorrect password",
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    return respondWithSession(user, req, res, "Login successful", {
      method: "password",
    });
  } catch (error) {
    console.error("loginUser error", error);
    await logAuditEvent({
      action: "login-attempt",
      req,
      status: "failure",
      description: error.message,
    });
    return res.status(500).json({ success: false, error: "Unable to login" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    clearSessionCookie(res);
    await logAuditEvent({
      action: "logout",
      req,
      userId: req.user?._id,
      status: "success",
      description: "User logged out",
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("logoutUser error", error);
    return res.status(500).json({ success: false, error: "Unable to logout" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const session = await resolveSessionUser(req);
    if (!session) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }
    return res
      .status(200)
      .json({ success: true, data: sanitizeUserDocument(session.user) });
  } catch (error) {
    console.error("getCurrentUser error", error);
    return res
      .status(500)
      .json({ success: false, error: "Unable to fetch session" });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const session = await resolveSessionUser(req);
    if (!session) {
      await logAuditEvent({
        action: "session-refresh",
        req,
        status: "denied",
        description: "No active session",
      });
      return res
        .status(401)
        .json({ success: false, error: "Session expired" });
    }

    const user = await User.findById(session.user._id);
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    return respondWithSession(user, req, res, "Session refreshed", {
      method: "refresh",
    });
  } catch (error) {
    console.error("refreshSession error", error);
    return res
      .status(500)
      .json({ success: false, error: "Unable to refresh session" });
  }
};

const buildOAuthResponse = (res, redirectUri, params) => {
  const url = new URL(redirectUri);
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value !== "undefined" && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return res.redirect(url.toString());
};

export const startGoogleOAuth = async (req, res) => {
  try {
    ensureGoogleConfigured();
    const redirectUri = safeRedirect(req.query.redirect);
    const state = crypto.randomUUID();
    await rememberOAuthState({
      state,
      provider: "google",
      redirectUri,
      ip: req.ip,
    });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", AUTH_SCOPES.google.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return res.redirect(authUrl.toString());
  } catch (error) {
    console.error("startGoogleOAuth error", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Unable to start Google OAuth",
    });
  }
};

export const handleGoogleOAuthCallback = async (req, res) => {
  const redirectUri = safeRedirect(req.query.redirect);
  try {
    ensureGoogleConfigured();
    const { code, state } = req.query;
    if (!code || !state) {
      throw new Error("Missing authorization code or state");
    }

    const savedState = await consumeOAuthState({ state, provider: "google" });
    const finalRedirect = savedState?.redirectUri || redirectUri;
    if (!savedState) {
      return buildOAuthResponse(res, finalRedirect, {
        error: "invalid_oauth_state",
      });
    }

    const body = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokens.error || "Failed to exchange code");
    }

    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const profile = await profileResponse.json();
    if (!profile?.email) {
      throw new Error("Google profile did not include email");
    }

    const user = await upsertOAuthUser({
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
    });

    await issueSession(user, req, res, { updateLoginTimestamp: true });
    await logAuditEvent({
      action: "oauth-login",
      req,
      userId: user._id,
      status: "success",
      description: "Google OAuth success",
    });

    return buildOAuthResponse(res, finalRedirect, { status: "success" });
  } catch (error) {
    console.error("handleGoogleOAuthCallback error", error);
    return buildOAuthResponse(res, redirectUri, {
      error: "google_oauth_failed",
      reason: error.message,
    });
  }
};

export const startFacebookOAuth = async (req, res) => {
  try {
    ensureFacebookConfigured();
    const redirectUri = safeRedirect(req.query.redirect);
    const state = crypto.randomUUID();
    await rememberOAuthState({
      state,
      provider: "facebook",
      redirectUri,
      ip: req.ip,
    });

    const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    authUrl.searchParams.set("client_id", FACEBOOK_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", AUTH_SCOPES.facebook.join(","));

    return res.redirect(authUrl.toString());
  } catch (error) {
    console.error("startFacebookOAuth error", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Unable to start Facebook OAuth",
    });
  }
};

export const handleFacebookOAuthCallback = async (req, res) => {
  const redirectUri = safeRedirect(req.query.redirect);
  try {
    ensureFacebookConfigured();
    const { code, state } = req.query;
    if (!code || !state) {
      throw new Error("Missing authorization code or state");
    }

    const savedState = await consumeOAuthState({ state, provider: "facebook" });
    const finalRedirect = savedState?.redirectUri || redirectUri;
    if (!savedState) {
      return buildOAuthResponse(res, finalRedirect, {
        error: "invalid_oauth_state",
      });
    }

    const tokenUrl = new URL(
      "https://graph.facebook.com/v19.0/oauth/access_token"
    );
    tokenUrl.searchParams.set("client_id", FACEBOOK_CLIENT_ID);
    tokenUrl.searchParams.set("client_secret", FACEBOOK_CLIENT_SECRET);
    tokenUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokens.error?.message || "Failed to exchange code");
    }

    const profileUrl = new URL("https://graph.facebook.com/v19.0/me");
    profileUrl.searchParams.set("fields", "id,name,email,picture");
    const profileResponse = await fetch(profileUrl.toString(), {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profile?.email) {
      throw new Error("Facebook profile did not include email");
    }

    const user = await upsertOAuthUser({
      provider: "facebook",
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture?.data?.url,
    });

    await issueSession(user, req, res, { updateLoginTimestamp: true });
    await logAuditEvent({
      action: "oauth-login",
      req,
      userId: user._id,
      status: "success",
      description: "Facebook OAuth success",
    });

    return buildOAuthResponse(res, finalRedirect, { status: "success" });
  } catch (error) {
    console.error("handleFacebookOAuthCallback error", error);
    return buildOAuthResponse(res, redirectUri, {
      error: "facebook_oauth_failed",
      reason: error.message,
    });
  }
};

export const startNhsOAuth = async (_req, res) => {
  return res.status(200).json({
    success: false,
    message: "NHS login is coming soon",
  });
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshSession,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  startFacebookOAuth,
  handleFacebookOAuthCallback,
  startNhsOAuth,
};
