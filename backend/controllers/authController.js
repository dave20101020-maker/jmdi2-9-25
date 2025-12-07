import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import User from "../models/User.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { resolveEntitlements } from "../utils/entitlements.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
const ACCESS_TOKEN_MAX_AGE =
  Number(process.env.JWT_ACCESS_MAX_AGE_MS) || 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE =
  Number(process.env.JWT_REFRESH_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
const ACCESS_COOKIE_NAME = process.env.JWT_ACCESS_COOKIE_NAME || "ns_at";
const REFRESH_COOKIE_NAME = process.env.JWT_REFRESH_COOKIE_NAME || "ns_rt";
const COOKIE_SECURE = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || undefined;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || null;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || null;
const GOOGLE_OAUTH_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  process.env.GOOGLE_REDIRECT_URI ||
  undefined;

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID || null;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET || null;
const FACEBOOK_OAUTH_REDIRECT_URI =
  process.env.FACEBOOK_OAUTH_REDIRECT_URI ||
  process.env.FACEBOOK_REDIRECT_URI ||
  null;
const FACEBOOK_SCOPES = (
  process.env.FACEBOOK_OAUTH_SCOPES || "public_profile,email"
)
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const FACEBOOK_DIALOG_URL =
  process.env.FACEBOOK_DIALOG_URL ||
  "https://www.facebook.com/v19.0/dialog/oauth";
const FACEBOOK_TOKEN_URL =
  process.env.FACEBOOK_TOKEN_URL ||
  "https://graph.facebook.com/v19.0/oauth/access_token";
const FACEBOOK_PROFILE_URL =
  process.env.FACEBOOK_PROFILE_URL || "https://graph.facebook.com/v19.0/me";

const CLIENT_BASE_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  "http://localhost:5173";
const DEFAULT_FACEBOOK_CALLBACK_PATH =
  process.env.FACEBOOK_CALLBACK_PATH || "/auth/facebook/callback";
const OAUTH_REDIRECT_TTL_MS = 5 * 60 * 1000;

const pendingOAuthRedirects = new Map();

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET || undefined,
      GOOGLE_OAUTH_REDIRECT_URI
    )
  : null;

const resolveFrontendOrigin = () => {
  try {
    return new URL(CLIENT_BASE_URL).origin;
  } catch (error) {
    console.warn(
      "[authController] CLIENT_BASE_URL is invalid. Falling back to http://localhost:5173",
      error
    );
    return "http://localhost:5173";
  }
};

const FRONTEND_ORIGIN = resolveFrontendOrigin();

const buildFrontendRedirect = (candidate, fallbackPath = "/") => {
  if (!candidate) {
    return new URL(fallbackPath, FRONTEND_ORIGIN).toString();
  }

  try {
    const parsed = candidate.startsWith("http")
      ? new URL(candidate)
      : new URL(candidate, FRONTEND_ORIGIN);
    if (parsed.origin !== FRONTEND_ORIGIN) {
      return new URL(fallbackPath, FRONTEND_ORIGIN).toString();
    }
    return parsed.toString();
  } catch (error) {
    console.warn(
      "[authController] Invalid OAuth redirect candidate provided. Using fallback.",
      { candidate, error: error.message }
    );
    return new URL(fallbackPath, FRONTEND_ORIGIN).toString();
  }
};

const cleanupExpiredOAuthRedirects = () => {
  if (!pendingOAuthRedirects.size) return;
  const now = Date.now();
  for (const [state, entry] of pendingOAuthRedirects.entries()) {
    if (!entry || entry.expiresAt < now) {
      pendingOAuthRedirects.delete(state);
    }
  }
};

const rememberOAuthRedirect = (state, redirectUri, fallbackPath = "/") => {
  if (!state) return;
  cleanupExpiredOAuthRedirects();
  const safeRedirect = buildFrontendRedirect(redirectUri, fallbackPath);
  pendingOAuthRedirects.set(state, {
    redirectUri: safeRedirect,
    expiresAt: Date.now() + OAUTH_REDIRECT_TTL_MS,
  });
};

const consumeOAuthRedirect = (state, fallbackPath = "/") => {
  cleanupExpiredOAuthRedirects();
  if (!state) {
    return buildFrontendRedirect(null, fallbackPath);
  }
  const entry = pendingOAuthRedirects.get(state);
  pendingOAuthRedirects.delete(state);
  if (!entry || entry.expiresAt < Date.now()) {
    return buildFrontendRedirect(null, fallbackPath);
  }
  return entry.redirectUri;
};

const redirectWithStatus = (res, targetUrl, params = {}) => {
  try {
    const redirectUrl = new URL(targetUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === "undefined" || value === null) return;
      redirectUrl.searchParams.set(key, String(value));
    });
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[authController] Failed to build redirect URL", {
      targetUrl,
      params,
      error: error.message,
    });
    return res
      .status(500)
      .json({ success: false, error: "Unable to complete OAuth redirect" });
  }
};

const ROLE_OPTIONS = ["user", "admin", "nhs_referral_patient"];
const SUBSCRIPTION_TIERS = ["free", "basic", "premium", "nhs_referred"];
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

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  const { passwordHash, refreshTokens, __v, ...rest } = plain;
  return {
    ...rest,
    entitlements: resolveEntitlements(plain),
  };
};

const normalizeRole = (role) => (ROLE_OPTIONS.includes(role) ? role : "user");

const normalizeTier = (tier) =>
  SUBSCRIPTION_TIERS.includes(tier) ? tier : "free";

const determineAllowedPillars = (tier = "free") => {
  if (tier === "basic") return ALL_PILLARS.slice(0, 4);
  if (tier === "premium" || tier === "nhs_referred") return [...ALL_PILLARS];
  return ["sleep", "mental_health"];
};

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.subscriptionTier,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

const createRefreshToken = (user, tokenId) =>
  jwt.sign({ sub: user._id.toString(), tokenId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

const setCookie = (res, name, value, maxAge) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? "strict" : "lax",
    maxAge,
    path: "/",
    domain: COOKIE_DOMAIN,
  });
};

const clearCookie = (res, name) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? "strict" : "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
  });
};

const issueSession = async (user, req, res) => {
  const now = new Date();
  const tokenId = crypto.randomUUID();
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);

  user.refreshTokens = (user.refreshTokens || []).filter(
    (token) => new Date(token.expiresAt).getTime() > now.getTime()
  );

  user.refreshTokens.push({
    tokenId,
    expiresAt: refreshExpiresAt,
    userAgent: req.get("user-agent") || null,
    ip: req.ip,
  });

  user.lastLoginAt = now;
  user.entitlements = resolveEntitlements(user);
  await user.save();

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user, tokenId);

  setCookie(res, ACCESS_COOKIE_NAME, accessToken, ACCESS_TOKEN_MAX_AGE);
  setCookie(res, REFRESH_COOKIE_NAME, refreshToken, REFRESH_TOKEN_MAX_AGE);

  return sanitizeUser(user);
};

const ensureGoogleClientConfigured = () => {
  if (!googleClient) {
    const error = new Error("Google OAuth is not configured");
    error.statusCode = 503;
    throw error;
  }
};

const verifyGoogleIdentity = async ({
  idToken,
  authorizationCode,
  codeVerifier,
  redirectUri,
}) => {
  ensureGoogleClientConfigured();

  if (!idToken && !authorizationCode) {
    const error = new Error("idToken or authorizationCode is required");
    error.statusCode = 400;
    throw error;
  }

  try {
    if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      return ticket.getPayload();
    }

    if (!GOOGLE_CLIENT_SECRET) {
      const error = new Error(
        "Google client secret is required to exchange authorization codes"
      );
      error.statusCode = 500;
      throw error;
    }

    const resolvedRedirectUri = redirectUri || GOOGLE_OAUTH_REDIRECT_URI;
    if (!resolvedRedirectUri) {
      const error = new Error(
        "redirectUri is required when exchanging authorization codes"
      );
      error.statusCode = 400;
      throw error;
    }

    const { tokens } = await googleClient.getToken({
      code: authorizationCode,
      codeVerifier,
      redirect_uri: resolvedRedirectUri,
    });

    if (!tokens?.id_token) {
      const error = new Error("Google did not return an ID token");
      error.statusCode = 502;
      throw error;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    throw error;
  }
};

const ensureFacebookConfigured = () => {
  if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) {
    const error = new Error("Facebook OAuth is not configured");
    error.statusCode = 503;
    throw error;
  }
  if (!FACEBOOK_OAUTH_REDIRECT_URI) {
    const error = new Error("FACEBOOK_OAUTH_REDIRECT_URI is not configured");
    error.statusCode = 500;
    throw error;
  }
};

const buildFacebookAuthUrl = ({
  state,
  scope,
  redirectUri = FACEBOOK_OAUTH_REDIRECT_URI,
  authType,
} = {}) => {
  ensureFacebookConfigured();
  if (!state) {
    const error = new Error("state is required for Facebook OAuth");
    error.statusCode = 400;
    throw error;
  }

  const resolvedScope = Array.isArray(scope)
    ? scope.join(",")
    : scope || FACEBOOK_SCOPES.join(",");

  const authUrl = new URL(FACEBOOK_DIALOG_URL);
  authUrl.searchParams.set("client_id", FACEBOOK_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", resolvedScope);
  if (authType) {
    authUrl.searchParams.set("auth_type", authType);
  }
  return authUrl.toString();
};

const exchangeFacebookCodeForToken = async ({ code, redirectUri }) => {
  ensureFacebookConfigured();
  if (!code) {
    const error = new Error("Authorization code is required");
    error.statusCode = 400;
    throw error;
  }

  const tokenUrl = new URL(FACEBOOK_TOKEN_URL);
  tokenUrl.searchParams.set("client_id", FACEBOOK_CLIENT_ID);
  tokenUrl.searchParams.set("client_secret", FACEBOOK_CLIENT_SECRET);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set(
    "redirect_uri",
    redirectUri || FACEBOOK_OAUTH_REDIRECT_URI
  );

  const response = await fetch(tokenUrl.toString());
  const payload = await response.json();

  if (!response.ok || !payload?.access_token) {
    const message = payload?.error?.message || "Failed to exchange code";
    const error = new Error(message);
    error.statusCode = response.status || 502;
    throw error;
  }

  return payload;
};

const fetchFacebookProfile = async (accessToken) => {
  if (!accessToken) {
    const error = new Error(
      "accessToken is required to fetch Facebook profile"
    );
    error.statusCode = 400;
    throw error;
  }

  const profileUrl = new URL(FACEBOOK_PROFILE_URL);
  profileUrl.searchParams.set(
    "fields",
    "id,name,email,first_name,last_name,picture.type(large)"
  );
  profileUrl.searchParams.set("access_token", accessToken);

  const response = await fetch(profileUrl.toString());
  const payload = await response.json();

  if (!response.ok || !payload?.id) {
    const message =
      payload?.error?.message || "Failed to load Facebook profile";
    const error = new Error(message);
    error.statusCode = response.status || 502;
    throw error;
  }

  return payload;
};

const verifyFacebookIdentity = async ({
  accessToken,
  authorizationCode,
  redirectUri,
} = {}) => {
  ensureFacebookConfigured();

  let token = accessToken;
  if (!token && authorizationCode) {
    const tokens = await exchangeFacebookCodeForToken({
      code: authorizationCode,
      redirectUri,
    });
    token = tokens.access_token;
  }

  if (!token) {
    const error = new Error(
      "accessToken or authorizationCode is required for Facebook login"
    );
    error.statusCode = 400;
    throw error;
  }

  return fetchFacebookProfile(token);
};

const sanitizeUsernameSeed = (value) => {
  if (!value || typeof value !== "string") return "northstar";
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "northstar"
  );
};

const generateUniqueUsername = async (seedValue) => {
  let base = sanitizeUsernameSeed(seedValue);
  if (!base) {
    base = "northstar";
  }

  let candidate = base;
  let suffix = 0;
  while (await User.exists({ username: candidate })) {
    suffix += 1;
    const suffixText = String(suffix);
    candidate = `${base}${suffixText}`.slice(0, 30);
    if (suffix > 9999) {
      candidate = `${base}${crypto.randomInt(10000, 99999)}`.slice(0, 30);
      break;
    }
  }

  return candidate;
};

const ensureLinkedProviders = (user, provider) => {
  if (!Array.isArray(user.linkedProviders)) {
    user.linkedProviders = [];
  }
  if (!user.linkedProviders.includes(provider)) {
    user.linkedProviders.push(provider);
  }
};

const applyGoogleProfileData = (user, payload, googleId) => {
  user.googleId = googleId;
  ensureLinkedProviders(user, "google");
  if (payload?.name && !user.name) {
    user.name = payload.name;
  }
  if (payload?.email && !user.email) {
    user.email = payload.email.toLowerCase();
  }
  if (payload?.email_verified && !user.emailVerified) {
    user.emailVerified = true;
  }
};

const applyFacebookProfileData = (user, payload, facebookId) => {
  user.facebookId = facebookId;
  ensureLinkedProviders(user, "facebook");
  if (payload?.name && !user.name) {
    user.name = payload.name;
  }
  const payloadEmail = payload?.email?.toLowerCase?.();
  if (payloadEmail && !user.email) {
    user.email = payloadEmail;
  }
  if (payloadEmail && !user.emailVerified) {
    user.emailVerified = true;
  }
};

const createRandomPasswordHash = async () => {
  const random = crypto.randomBytes(32).toString("hex");
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(random, salt);
};

const resolveFacebookUser = async (payload) => {
  const facebookId = payload?.id;
  const email = payload?.email?.toLowerCase?.();

  if (!facebookId) {
    const error = new Error("Facebook profile is missing an identifier");
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ facebookId });
  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (user) {
    applyFacebookProfileData(user, payload, facebookId);
    return user;
  }

  if (!email) {
    const error = new Error(
      "Facebook account did not provide an email address that we can use"
    );
    error.statusCode = 400;
    throw error;
  }

  const usernameSeed =
    payload?.first_name ||
    payload?.last_name ||
    payload?.name ||
    email.split("@")[0] ||
    "northstar";
  const username = await generateUniqueUsername(usernameSeed);
  const passwordHash = await createRandomPasswordHash();
  const normalizedTier = "free";

  const newUser = new User({
    username,
    email,
    passwordHash,
    subscriptionTier: normalizedTier,
    allowedPillars: determineAllowedPillars(normalizedTier),
    role: "user",
    name: payload?.name,
  });

  applyFacebookProfileData(newUser, payload, facebookId);
  return newUser;
};

export const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      subscriptionTier = "free",
      role = "user",
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "username, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const normalizedTier = normalizeTier(subscriptionTier);
    const normalizedRole = normalizeRole(role);

    const user = new User({
      username,
      email: normalizedEmail,
      passwordHash,
      subscriptionTier: normalizedTier,
      allowedPillars: determineAllowedPillars(normalizedTier),
      role: normalizedRole,
    });

    const sessionUser = await issueSession(user, req, res);

    return res.status(201).json({ success: true, data: sessionUser });
  } catch (err) {
    console.error("registerUser error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      await logAuditEvent({
        action: "login-attempt",
        req,
        status: "failure",
        description: "Missing credentials",
        metadata: { identifier: emailOrUsername || null },
      });
      return res.status(400).json({
        success: false,
        error: "emailOrUsername and password required",
      });
    }

    const normalized = emailOrUsername.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalized }, { username: emailOrUsername }],
    });

    if (!user) {
      await logAuditEvent({
        action: "login-attempt",
        req,
        status: "failure",
        description: "Account not found",
        metadata: { identifier: normalized },
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      await logAuditEvent({
        action: "login-attempt",
        req,
        userId: user._id,
        status: "failure",
        description: "Incorrect password",
        metadata: { identifier: normalized },
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const sessionUser = await issueSession(user, req, res);
    await logAuditEvent({
      action: "login-attempt",
      req,
      userId: user._id,
      status: "success",
      description: "Login successful via password",
      metadata: { identifier: normalized },
    });

    return res.status(200).json({ success: true, data: sessionUser });
  } catch (err) {
    console.error("loginUser error", err);
    await logAuditEvent({
      action: "login-attempt",
      req,
      status: "failure",
      description: err?.message || "Unhandled login error",
    });
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }
    return res
      .status(200)
      .json({ success: true, data: sanitizeUser(req.user) });
  } catch (err) {
    console.error("getCurrentUser error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      await logAuditEvent({
        action: "token-refresh",
        req,
        status: "failure",
        description: "Missing refresh token",
      });
      return res
        .status(401)
        .json({ success: false, error: "Missing refresh token" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      await logAuditEvent({
        action: "token-refresh",
        req,
        status: "denied",
        description: "Invalid refresh token",
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      clearCookie(res, ACCESS_COOKIE_NAME);
      clearCookie(res, REFRESH_COOKIE_NAME);
      await logAuditEvent({
        action: "token-refresh",
        req,
        status: "failure",
        description: "User referenced in refresh token was not found",
        userId: payload.sub || null,
      });
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const tokenRecord = (user.refreshTokens || []).find(
      (token) => token.tokenId === payload.tokenId
    );

    if (!tokenRecord || new Date(tokenRecord.expiresAt) < new Date()) {
      clearCookie(res, ACCESS_COOKIE_NAME);
      clearCookie(res, REFRESH_COOKIE_NAME);
      await logAuditEvent({
        action: "token-refresh",
        req,
        userId: user._id,
        status: "denied",
        description: "Refresh token expired or not recognized",
      });
      return res
        .status(401)
        .json({ success: false, error: "Refresh token expired" });
    }

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.tokenId !== payload.tokenId
    );

    const sessionUser = await issueSession(user, req, res);
    await logAuditEvent({
      action: "token-refresh",
      req,
      userId: user._id,
      status: "success",
      description: "Refresh token exchanged for new session",
    });

    return res.status(200).json({ success: true, data: sessionUser });
  } catch (err) {
    console.error("refreshSession error", err);
    await logAuditEvent({
      action: "token-refresh",
      req,
      status: "failure",
      description: err?.message || "Unhandled refresh session error",
    });
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const logoutUser = async (req, res) => {
  let resolvedUserId = req.user?._id || null;
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        resolvedUserId = payload.sub || resolvedUserId;
        await User.updateOne(
          { _id: payload.sub },
          { $pull: { refreshTokens: { tokenId: payload.tokenId } } }
        );
      } catch (err) {
        // ignore invalid refresh tokens during logout
      }
    }

    clearCookie(res, ACCESS_COOKIE_NAME);
    clearCookie(res, REFRESH_COOKIE_NAME);

    await logAuditEvent({
      action: "logout",
      req,
      userId: resolvedUserId,
      status: "success",
      description: "User logged out and session cookies cleared",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("logoutUser error", err);
    await logAuditEvent({
      action: "logout",
      req,
      userId: resolvedUserId,
      status: "failure",
      description: err?.message || "Logout failed",
    });
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const googleOAuthLogin = async (req, res) => {
  try {
    const payload = await verifyGoogleIdentity(req.body || {});
    const googleId = payload?.sub;
    const email = payload?.email?.toLowerCase();
    const metadata = { provider: "google", googleId, email };

    if (!googleId) {
      await logAuditEvent({
        action: "social-login",
        req,
        status: "failure",
        description: "Google profile missing identifier",
        metadata,
      });
      return res.status(400).json({
        success: false,
        error: "Google profile is missing an identifier",
      });
    }

    let user = await User.findOne({ googleId });
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      applyGoogleProfileData(user, payload, googleId);
    } else {
      if (!email) {
        await logAuditEvent({
          action: "social-login",
          req,
          status: "failure",
          description: "Google account missing email",
          metadata,
        });
        return res.status(400).json({
          success: false,
          error: "Google account did not provide an email address",
        });
      }

      const usernameSeed =
        payload?.given_name ||
        payload?.family_name ||
        email.split("@")[0] ||
        "northstar";
      const username = await generateUniqueUsername(usernameSeed);
      const passwordHash = await createRandomPasswordHash();
      const normalizedTier = "free";

      user = new User({
        username,
        email,
        passwordHash,
        subscriptionTier: normalizedTier,
        allowedPillars: determineAllowedPillars(normalizedTier),
        role: "user",
        name: payload?.name,
      });

      applyGoogleProfileData(user, payload, googleId);
    }

    const sessionUser = await issueSession(user, req, res);
    await logAuditEvent({
      action: "social-login",
      req,
      userId: user._id,
      status: "success",
      description: "Google OAuth login completed",
      metadata,
    });
    return res.status(200).json({ success: true, data: sessionUser });
  } catch (err) {
    console.error("googleOAuthLogin error", err);
    await logAuditEvent({
      action: "social-login",
      req,
      status: "failure",
      description: err?.message || "Google OAuth login failed",
      metadata: { provider: "google" },
    });
    const status = err?.statusCode || err?.status || 500;
    return res.status(status).json({
      success: false,
      error: err?.message || "Google sign-in failed",
    });
  }
};

export const linkGoogleAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    const payload = await verifyGoogleIdentity(req.body || {});
    const googleId = payload?.sub;
    if (!googleId) {
      return res.status(400).json({
        success: false,
        error: "Google profile is missing an identifier",
      });
    }

    const existing = await User.findOne({ googleId });
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({
        success: false,
        error: "Google account is already linked to another profile",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    applyGoogleProfileData(user, payload, googleId);

    const sessionUser = await issueSession(user, req, res);
    return res.status(200).json({
      success: true,
      message: "Google account linked",
      data: sessionUser,
    });
  } catch (err) {
    console.error("linkGoogleAccount error", err);
    const status = err?.statusCode || err?.status || 500;
    return res.status(status).json({
      success: false,
      error: err?.message || "Failed to link Google account",
    });
  }
};

export const facebookOAuthLogin = async (req, res) => {
  try {
    const profile = await verifyFacebookIdentity(req.body || {});
    const user = await resolveFacebookUser(profile);
    const sessionUser = await issueSession(user, req, res);
    await logAuditEvent({
      action: "social-login",
      req,
      userId: user._id,
      status: "success",
      description: "Facebook OAuth login completed",
      metadata: { provider: "facebook", facebookId: profile?.id },
    });
    return res.status(200).json({ success: true, data: sessionUser });
  } catch (err) {
    console.error("facebookOAuthLogin error", err);
    await logAuditEvent({
      action: "social-login",
      req,
      status: "failure",
      description: err?.message || "Facebook OAuth login failed",
      metadata: { provider: "facebook" },
    });
    const status = err?.statusCode || err?.status || 500;
    return res.status(status).json({
      success: false,
      error: err?.message || "Facebook sign-in failed",
    });
  }
};

export const startFacebookOAuth = async (req, res) => {
  try {
    ensureFacebookConfigured();
    const {
      redirect_uri: finalRedirectCandidate,
      state,
      scope,
      auth_type: authType,
    } = req.query;

    if (!state) {
      return res
        .status(400)
        .json({ success: false, error: "state query parameter is required" });
    }

    rememberOAuthRedirect(
      state,
      finalRedirectCandidate,
      DEFAULT_FACEBOOK_CALLBACK_PATH
    );

    const authUrl = buildFacebookAuthUrl({
      state,
      scope,
      authType,
    });
    return res.redirect(authUrl);
  } catch (err) {
    console.error("startFacebookOAuth error", err);
    const status = err?.statusCode || err?.status || 500;
    return res.status(status).json({
      success: false,
      error: err?.message || "Unable to start Facebook sign-in",
    });
  }
};

export const facebookOAuthCallback = async (req, res) => {
  let finalRedirect = buildFrontendRedirect(
    null,
    DEFAULT_FACEBOOK_CALLBACK_PATH
  );
  try {
    ensureFacebookConfigured();
    const {
      code,
      state,
      error,
      error_description: errorDescription,
    } = req.query;

    if (state) {
      finalRedirect = consumeOAuthRedirect(
        state,
        DEFAULT_FACEBOOK_CALLBACK_PATH
      );
    }

    if (error) {
      await logAuditEvent({
        action: "social-login",
        req,
        status: "failure",
        description: `Facebook callback error: ${error}`,
        metadata: { provider: "facebook", state },
      });
      return redirectWithStatus(res, finalRedirect, {
        status: "error",
        error,
        error_description: errorDescription,
        state,
      });
    }

    if (!code) {
      await logAuditEvent({
        action: "social-login",
        req,
        status: "failure",
        description: "Facebook callback missing authorization code",
        metadata: { provider: "facebook", state },
      });
      return redirectWithStatus(res, finalRedirect, {
        status: "error",
        error: "missing_code",
        error_description: "Facebook did not return an authorization code",
        state,
      });
    }

    const tokens = await exchangeFacebookCodeForToken({ code });
    const profile = await fetchFacebookProfile(tokens.access_token);
    const user = await resolveFacebookUser(profile);
    await issueSession(user, req, res);
    await logAuditEvent({
      action: "social-login",
      req,
      userId: user._id,
      status: "success",
      description: "Facebook OAuth callback completed",
      metadata: { provider: "facebook", facebookId: profile?.id, state },
    });

    return redirectWithStatus(res, finalRedirect, {
      status: "success",
      state,
    });
  } catch (err) {
    console.error("facebookOAuthCallback error", err);
    await logAuditEvent({
      action: "social-login",
      req,
      status: "failure",
      description: err?.message || "Facebook callback failed",
      metadata: { provider: "facebook" },
    });
    return redirectWithStatus(res, finalRedirect, {
      status: "error",
      error: "facebook_callback_failed",
      error_description:
        err?.message || "We could not finalize Facebook authentication",
    });
  }
};

export const linkFacebookAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    const profile = await verifyFacebookIdentity(req.body || {});
    const facebookId = profile?.id;
    if (!facebookId) {
      return res.status(400).json({
        success: false,
        error: "Facebook profile is missing an identifier",
      });
    }

    const existing = await User.findOne({ facebookId });
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({
        success: false,
        error: "Facebook account is already linked to another profile",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    applyFacebookProfileData(user, profile, facebookId);
    const sessionUser = await issueSession(user, req, res);
    return res.status(200).json({
      success: true,
      message: "Facebook account linked",
      data: sessionUser,
    });
  } catch (err) {
    console.error("linkFacebookAccount error", err);
    const status = err?.statusCode || err?.status || 500;
    return res.status(status).json({
      success: false,
      error: err?.message || "Failed to link Facebook account",
    });
  }
};
