// Load environment variables FIRST before any other imports
import "./loadEnv.js";

import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import logger from "./utils/logger.js";
import aiRoutes from "./routes/ai.js";
import orchestratorRoutes from "./routes/aiRoutes.js";
import aiUnifiedRoutes from "./routes/aiUnifiedRoutes.js";
import { aiRateLimitMiddleware } from "./middleware/rateLimiter.js";
import habitsRoutes from "./routes/habits.js";
import entriesRoutes from "./routes/entries.js";
import pillarsRoutes from "./routes/pillars.js";
import authRoutes from "./routes/auth.js";
import auth0Routes from "./routes/auth0Routes.js";
import onboardingRoutes from "./routes/onboarding.js";
import subscriptionRoutes from "./routes/subscription.js";
import actionPlansRoutes from "./routes/actionPlans.js";
import friendsRoutes from "./routes/friends.js";
import challengesRoutes from "./routes/challenges.js";
import messagesRoutes from "./routes/messages.js";
import notificationsRoutes from "./routes/notifications.js";
import timelineRoutes from "./routes/timeline.js";
import userRoutes from "./routes/user.js";
import integrationsRoutes from "./routes/integrations.js";
import insightsRoutes from "./routes/insights.js";
import progressRoutes from "./routes/progress.js";
import checkinRoutes from "./routes/checkin.js";
import pagesRoutes from "./routes/pages.js";
import publicPagesRoutes from "./routes/publicPages.js";
import navRoutes from "./routes/navRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import assessmentsRoutes from "./routes/assessments.js";
import connectorsRoutes from "./routes/connectors.js";
import debugAiTestRoutes from "./routes/debugAiTest.js";
import internalPostgresHealthRoutes from "./routes/internalPostgresHealth.js";
import { primeProviderHealth } from "./utils/providerHealth.js";

const envName = process.env.NODE_ENV || "development";
const providerKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;

// Environment Variables
const PORT = process.env.PORT || 5000;
let mongoDisabledLogged = false;
const logMongoDisabledOnce = () => {
  if (mongoDisabledLogged) return;
  mongoDisabledLogged = true;
  console.log("[db] MongoDB disabled (no valid MONGO_URI)");
};

const RAW_MONGO_URI = process.env.MONGO_URI;
const MONGO_URI =
  typeof RAW_MONGO_URI === "string" &&
  /^(mongodb:\/\/|mongodb\+srv:\/\/)/.test(RAW_MONGO_URI)
    ? RAW_MONGO_URI
    : null;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate critical environment variables
if (!JWT_SECRET && envName === "production") {
  logger.error("FATAL: JWT_SECRET is required in production");
  process.exit(1);
}

if (!MONGO_URI) logMongoDisabledOnce();

if (!JWT_SECRET) {
  logger.warn("JWT_SECRET not set — using default (NOT SECURE for production)");
}

if (!providerKey) {
  if (envName !== "development") {
    logger.error(
      "FATAL: AI provider key (OPENAI_API_KEY or AI_PROVIDER_KEY) is required outside development"
    );
    process.exit(1);
  }
  logger.warn("AI provider key not set — AI features will be disabled");
}

// Kick off a non-blocking provider health probe so the first health request is warm
primeProviderHealth();

const codespaceOrigin = process.env.CODESPACE_NAME
  ? `https://${process.env.CODESPACE_NAME}-5173.app.github.dev`
  : null;

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set(["http://localhost:5173", codespaceOrigin, ...envOrigins])
);

const app = express();

app.set("trust proxy", 1);

// --- HARD HEALTH CHECK (prevents 502) ---
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "northstar-backend" });
});

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some((entry) => {
      if (!entry) return false;
      if (entry instanceof RegExp) return entry.test(origin);
      return origin === entry;
    });
    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Request logging with Winston
app.use(morgan("combined", { stream: logger.stream }));

// Response time tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res.statusCode, responseTime);
  });

  next();
});

app.use(cookieParser());
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "NorthStar Backend is running",
  });
});

// AI provider health endpoint
app.get("/api/ai/unified/health", (req, res) => {
  const present = Boolean(providerKey);
  res.json({
    provider_key_present: present,
    ai_provider_status: present ? "ok" : "not-configured",
  });
});

// Simple CORS test endpoint
app.get("/api/test-cors", (req, res) => {
  res.status(200).json({ ok: true, message: "CORS ok" });
});

// Internal DB health-check (PostgreSQL via Prisma)
app.use("/internal/postgres-health", internalPostgresHealthRoutes);

// Dev-only AI debug route
if (envName !== "production") {
  app.use("/api/debug/ai", debugAiTestRoutes);
}

// Unified AI Orchestrator Routes (all modules integrated)
// NOTE: Must be mounted BEFORE legacy `/api/ai` routes so `/api/ai/unified/*`
// does not get intercepted by legacy auth middleware.
app.use("/api/ai/unified", aiUnifiedRoutes);

// AI Routes (legacy)
app.use("/api/ai", aiRoutes);

// NorthStar Orchestrator Routes (new)
app.use("/api/orchestrator", orchestratorRoutes);
// Alias orchestrator chat under /api/ai for the assistant UI
app.use("/api/ai", orchestratorRoutes);

// Feature Routes
app.use("/api/habits", habitsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/pillars", pillarsRoutes);
// Auth0 -> backend session exchange
// NOTE: mount before any downstream auth guards that might block unauthenticated requests
app.use("/api/auth", auth0Routes);
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/action-plans", actionPlansRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/challenges", challengesRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/user", userRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/connectors", connectorsRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/nav", navRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/", publicPagesRoutes);

// Connect to MongoDB
let mongoRetryCount = 0;
const MAX_RETRY_DELAY_MS = 30_000;

const connectToMongo = async () => {
  if (!MONGO_URI) {
    return;
  }

  try {
    mongoRetryCount += 1;
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
    logger.info("Connected to MongoDB", {
      environment: envName,
      database: mongoose.connection.name,
      attempt: mongoRetryCount,
    });
    mongoRetryCount = 0;
  } catch (err) {
    const whitelistHint = err?.message?.includes("whitelist");
    const retryInMs = Math.min(MAX_RETRY_DELAY_MS, mongoRetryCount * 5_000);
    logger.error("MongoDB connection error", {
      error: err.message,
      stack: err.stack,
      attempt: mongoRetryCount,
      retryInMs,
    });

    if (whitelistHint) {
      logger.warn(
        "MongoDB Atlas is blocking this IP. Add it to the Atlas IP Access List or provide a local MONGO_URI."
      );
    }

    setTimeout(() => {
      connectToMongo();
    }, retryInMs || 5_000);
  }
};

if (MONGO_URI) {
  connectToMongo();
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected — retrying connection");
    connectToMongo();
  });
}

// 404 handler
app.use((req, res) => {
  logger.warn("404 Not Found", {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  res.status(404).json({
    error: true,
    message: "Not Found",
    path: req.path,
    method: req.method,
  });
});

// Global error handler
import errorHandler from "./middleware/errorHandler.js";
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    path: req.path,
    userId: req.user?.id || req.user?.email,
    ip: req.ip,
  });
  return errorHandler(err, req, res, next);
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    logger.info("NorthStar Backend started", {
      port: PORT,
      environment: envName,
      healthCheck: `http://localhost:${PORT}/health`,
      aiEndpoints: `http://localhost:${PORT}/api/ai`,
      jwtConfigured: !!JWT_SECRET,
      mongoConfigured: !!MONGO_URI,
      corsOrigins: allowedOrigins.map((entry) =>
        typeof entry === "string" ? entry : entry.toString()
      ),
    });

    console.log("\n" + "=".repeat(60));
    console.log(`🚀 NorthStar Backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${envName}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Endpoints: http://localhost:${PORT}/api/ai`);
    console.log(
      `🔐 JWT Secret: ${JWT_SECRET ? "✓ Set" : "✗ Not set (using default)"}`
    );
    console.log(
      `🗄️  MongoDB: ${MONGO_URI ? "✓ Connected" : "✗ Not configured"}`
    );
    console.log(
      `🌐 CORS Origins: ${allowedOrigins
        .map((entry) => (typeof entry === "string" ? entry : entry.toString()))
        .join(", ")}`
    );
    console.log(`📝 Logs: ./logs/`);
    console.log("=".repeat(60) + "\n");
  });
}

export default app;
