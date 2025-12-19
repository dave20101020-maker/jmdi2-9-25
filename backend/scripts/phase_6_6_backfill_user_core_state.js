/**
 * PHASE 6.6 — MANUAL BACKFILL (DEV ONLY)
 * Backfills UserCoreState from Mongo User documents
 *
 * Usage:
 *   node backend/scripts/phase_6_6_backfill_user_core_state.js
 */

import "../loadEnv.js";

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import User from "../models/User.js";
import { prisma } from "../src/db/prismaClient.js";

const PREFIX = "[PHASE 6.6][BACKFILL]";

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

  const cursor = User.find()
    .select("_id allowedPillars pillars settings subscriptionTier")
    .cursor();

  let scanned = 0;
  let upserted = 0;
  let failed = 0;

  for await (const user of cursor) {
    scanned += 1;

    const uid = String(user._id);

    try {
      const pillarsObj =
        user?.pillars &&
        typeof user.pillars === "object" &&
        typeof user.pillars.toObject === "function"
          ? user.pillars.toObject()
          : user?.pillars;

      await prisma.userCoreState.upsert({
        where: { userId: uid },
        create: {
          userId: uid,
          allowedPillars: user.allowedPillars ?? null,
          pillars: pillarsObj ?? null,
          settings: user.settings ?? null,
          subscriptionTier: user.subscriptionTier ?? null,
        },
        update: {
          allowedPillars: user.allowedPillars ?? null,
          pillars: pillarsObj ?? null,
          settings: user.settings ?? null,
          subscriptionTier: user.subscriptionTier ?? null,
        },
      });

      upserted += 1;
    } catch (err) {
      failed += 1;
      log("warn", "upsert_failed", {
        userId: uid,
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
