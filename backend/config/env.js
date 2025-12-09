import dotenv from "dotenv";

dotenv.config();

const resolveArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || process.env.DATABASE_URL,
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev-access",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-refresh",
    issuer: process.env.JWT_ISSUER || "northstar",
    audience: process.env.JWT_AUDIENCE || "northstar.app",
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
    cookieName: process.env.JWT_REFRESH_COOKIE || "ns_refresh",
  },
  corsOrigins: resolveArray(
    process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS
  ),
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  region: process.env.DEPLOY_REGION || "uk",
};

export default env;
