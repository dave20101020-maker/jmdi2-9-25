/**
 * PHASE 6.5 — MANUAL BACKFILL (DEV ONLY)
 * Usage:
 *   node backend/scripts/phase_6_5_backfill_onboarding.js
 */

import "../loadEnv.js";

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import OnboardingProfile from "../models/OnboardingProfile.js";
import { prisma } from "../src/db/prismaClient.js";

const PREFIX = "[PHASE 6.5][BACKFILL]";

const log = (level, message, meta) => {
  // eslint-disable-next-line no-console
  (console[level] || console.log)(`${PREFIX} ${message}`, meta || "");
};

async function run() {
  if (process.env.NODE_ENV === "production") {
    log("error", "Refusing to run in production.");
    process.exit(2);
  }

  const mongoConn = await connectDB();
  if (!mongoConn) {
    log(
      "error",
      "MongoDB disabled (no valid MONGO_URI). Cannot backfill from Mongo.",
      { hint: "Set MONGO_URI to a valid mongodb:// or mongodb+srv:// URI" }
    );
    process.exit(2);
  }

  const cursor = OnboardingProfile.find()
    .select(
      "userId demographics com_b selectedGoals assessments psychologyProfile completedAt createdAt updatedAt"
    )
    .cursor();

  let scanned = 0;
  let upserted = 0;
  let failed = 0;

  for await (const doc of cursor) {
    scanned += 1;

    const userId = String(doc.userId);
    try {
      const snapshot =
        typeof doc?.toObject === "function"
          ? doc.toObject({ depopulate: true })
          : doc;

      await prisma.onboardingProfile.upsert({
        where: { userId },
        create: {
          userId,
          doc: snapshot,
        },
        update: {
          doc: snapshot,
        },
      });

      upserted += 1;
    } catch (err) {
      failed += 1;
      log("warn", "upsert_failed", {
        userId,
        name: err?.name,
        code: err?.code,
        message: err?.message || String(err),
      });
    }
  }

  log("info", "complete", { scanned, upserted, failed });
}

run()
  .catch((err) => {
    log("error", "crashed", {
      name: err?.name,
      message: err?.message || String(err),
      stack: err?.stack,
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }

    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }

    process.exit(process.exitCode || 0);
  });
