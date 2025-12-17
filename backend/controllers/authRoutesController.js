import argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import env from "../config/env.js";

const buildAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.subscriptionTier,
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessTtl,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    }
  );

const buildRefreshToken = (user, tokenId) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      jti: tokenId,
    },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshTtl,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    }
  );

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.nodeEnv === "production",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  const { passwordHash, refreshTokens, __v, ...rest } = obj;
  return rest;
};

const attachRefreshToken = async ({ user, res, userAgent, ip }) => {
  const tokenId = crypto.randomUUID();
  const refreshToken = buildRefreshToken(user, tokenId);
  const decoded = jwt.decode(refreshToken);
  user.refreshTokens = [
    ...(user.refreshTokens || []).filter(
      (entry) => entry.expiresAt > new Date()
    ),
    {
      tokenId,
      expiresAt: decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 86400000),
      userAgent: userAgent || "unknown",
      ip: ip || null,
    },
  ];
  await user.save();
  res.cookie(env.jwt.cookieName, refreshToken, REFRESH_COOKIE_OPTIONS);
  return refreshToken;
};

export const register = async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: "Email already registered" });
    }
    const hash = await argon2.hash(password);
    const user = await User.create({
      email,
      passwordHash: hash,
      name,
      username: username || email.split("@")[0],
      subscriptionTier: "free",
      role: "user",
    });
    await attachRefreshToken({
      user,
      res,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    const accessToken = buildAccessToken(user);
    return res
      .status(201)
      .json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    await attachRefreshToken({
      user,
      res,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    const accessToken = buildAccessToken(user);
    return res.json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.[env.jwt.cookieName];
    if (!token)
      return res
        .status(401)
        .json({ success: false, error: "Missing refresh token" });

    const payload = jwt.verify(token, env.jwt.refreshSecret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
    const user = await User.findById(payload.sub);
    if (!user)
      return res.status(401).json({ success: false, error: "User not found" });

    const tokenEntry = (user.refreshTokens || []).find(
      (entry) => entry.tokenId === payload.jti
    );
    if (!tokenEntry || new Date(tokenEntry.expiresAt) < new Date()) {
      return res
        .status(401)
        .json({ success: false, error: "Refresh token expired" });
    }

    return res.status(403).json({
      success: false,
      error: "Auth0 login required",
      message: "Authenticate via Auth0 to start a new session",
    });

    user.refreshTokens = (user.refreshTokens || []).filter(
      (entry) => entry.tokenId !== payload.jti
    );
    await attachRefreshToken({
      user,
      res,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    const accessToken = buildAccessToken(user);
    return res.json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid refresh token" });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies?.[env.jwt.cookieName];
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwt.refreshSecret, {
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
      });
      await User.updateOne(
        { _id: payload.sub },
        { $pull: { refreshTokens: { tokenId: payload.jti } } }
      );
    } catch (error) {
      // ignore invalid token on logout
    }
  }
  res.clearCookie(env.jwt.cookieName, REFRESH_COOKIE_OPTIONS);
  return res.json({ success: true });
};

export const currentUser = async (req, res) => {
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  return res.json({ success: true, user: sanitizeUser(req.user) });
};
