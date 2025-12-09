// Load environment variables FIRST before any other imports
import "./loadEnv.js";

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

const envName = process.env.NODE_ENV || "development";

// Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate critical environment variables
if (!JWT_SECRET && envName === "production") {
  logger.error("FATAL: JWT_SECRET is required in production");
  process.exit(1);
}

if (!MONGO_URI) {
  logger.warn("MONGO_URI not set — MongoDB connection will be skipped");
}

if (!JWT_SECRET) {
  logger.warn("JWT_SECRET not set — using default (NOT SECURE for production)");
}

const allowedOrigins = [
  "https://fictional-disco-x5797q7rr56wf9v7-5173.app.github.dev",
  "https://*.github.dev",
  "http://localhost:5173",
];

const app = express();

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "NorthStar Backend is running",
  });
});

// AI Routes (legacy)
app.use("/api/ai", aiRoutes);

// NorthStar Orchestrator Routes (new)
app.use("/api/orchestrator", orchestratorRoutes);

// Unified AI Orchestrator Routes (all modules integrated)
app.use("/api/ai/unified", aiUnifiedRoutes);

// Feature Routes
app.use("/api/habits", habitsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/pillars", pillarsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
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

// Connect to MongoDB
let mongoRetryCount = 0;
const MAX_RETRY_DELAY_MS = 30_000;

const connectToMongo = async () => {
  if (!MONGO_URI) {
    logger.warn("MONGO_URI not set — skipping MongoDB connection");
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
} else {
  logger.warn("MONGO_URI not set — skipping MongoDB connection");
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
  app.listen(PORT, () => {
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
