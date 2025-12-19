import crypto from "crypto";
import argon2 from "argon2";
import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "../models/User.js";
import { issueSession } from "../utils/sessionTokens.js";

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`[auth0] Missing required env: ${key}`);
  return value;
};

const getIssuer = () => {
  const override = process.env.AUTH0_ISSUER?.trim();
  if (override) {
    const cleaned = override.replace(/\/+$/, "");
    return cleaned.endsWith("/") ? cleaned : `${cleaned}/`;
  }

  const domain = requiredEnv("AUTH0_DOMAIN")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return `https://${domain}/`;
};

const getJwks = (() => {
  let jwks = null;
  return () => {
    if (!jwks) {
      const issuer = getIssuer();
      const url = new URL(".well-known/jwks.json", issuer);
      jwks = createRemoteJWKSet(url);
    }
    return jwks;
  };
})();

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const generateUniqueUsername = async (seed) => {
  const normalized = (seed || "northstar")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24);

  let attempt = 0;
  while (attempt < 50) {
    const suffix = attempt === 0 ? "" : `${Math.floor(Math.random() * 10000)}`;
    const candidate =
      `${normalized}${suffix}`.slice(0, 24) || `pilot${Date.now()}`;
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
    attempt += 1;
  }

  return `${normalized}${crypto.randomBytes(2).toString("hex")}`;
};

export const auth0Exchange = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (!match)
      return res.status(401).json({ ok: false, error: "missing_bearer" });

    const token = match[1];
    const issuer = getIssuer();

    // If AUTH0_AUDIENCE is set (API audience), verify against it.
    // Otherwise default to client id, which is typical for ID tokens.
    const audience =
      process.env.AUTH0_AUDIENCE?.trim() ||
      requiredEnv("AUTH0_CLIENT_ID").trim();

    const { payload } = await jwtVerify(token, getJwks(), {
      issuer,
      audience,
    });

    const sub = payload.sub;
    const email = normalizeEmail(payload.email);
    const name = payload.name || payload.nickname || payload.given_name || "";

    if (!sub) return res.status(401).json({ ok: false, error: "missing_sub" });
    if (!email)
      return res.status(401).json({ ok: false, error: "missing_email" });

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.findOne({ auth0Sub: sub });
    }

    if (!user) {
      const usernameSeed = email.split("@")[0] || "northstar";
      const username = await generateUniqueUsername(usernameSeed);
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await argon2.hash(randomPassword, {
        type: argon2.argon2id,
      });

      user = await User.create({
        email,
        username,
        name: name || undefined,
        auth0Sub: sub,
        passwordHash,
        emailVerified: true,
      });
    } else {
      if (!user.auth0Sub) user.auth0Sub = sub;
      if (email && !user.email) user.email = email;
      if (name && !user.name) user.name = name;
      await user.save();
    }

    // Mint existing httpOnly session cookie (ns_session)
    await issueSession(user, req, res, { updateLoginTimestamp: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[auth0] exchange failed:", err?.message || err);
    return res.status(401).json({ ok: false, error: "invalid_token" });
  }
};
