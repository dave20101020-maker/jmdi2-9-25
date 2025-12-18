// Phase 6.4.5 backfill helper (manual invocation only).
// Safe + idempotent: creates missing Postgres rows from Mongo source.
//
// Usage:
//   node backend/scripts/phase_6_4_5_backfill_pillar_checkins.js --dry-run
//   node backend/scripts/phase_6_4_5_backfill_pillar_checkins.js --limit=500
//   node backend/scripts/phase_6_4_5_backfill_pillar_checkins.js --userId=<mongoObjectId>
//   node backend/scripts/phase_6_4_5_backfill_pillar_checkins.js --checkins-only
//   node backend/scripts/phase_6_4_5_backfill_pillar_checkins.js --scores-only
//
// Notes:
// - Requires MONGO_URI set (mongodb:// or mongodb+srv://)
// - Does not modify existing Postgres rows.

import "../loadEnv.js";

import mongoose from "mongoose";
import crypto from "crypto";
import connectDB from "../config/database.js";
import { prisma } from "../src/db/prismaClient.js";

import PillarCheckIn from "../models/PillarCheckIn.js";
import PillarScore from "../models/PillarScore.js";

const PREFIX = "[PHASE 6.4][VALIDATION]";

const log = (level, message, meta) => {
  // eslint-disable-next-line no-console
  (console[level] || console.log)(`${PREFIX} ${message}`, meta || "");
};

const parseArgs = () => {
  const args = new Map();
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const [k, v] = raw.slice(2).split("=");
    args.set(k, v ?? true);
  }

  const has = (k) => args.get(k) === true || args.get(k) === "true";

  return {
    dryRun: has("dry-run") || has("dryRun"),
    limit: Number(args.get("limit") || 0),
    userId: typeof args.get("userId") === "string" ? args.get("userId") : null,
    pillar: typeof args.get("pillar") === "string" ? args.get("pillar") : null,
    checkinsOnly: has("checkins-only") || has("checkinsOnly"),
    scoresOnly: has("scores-only") || has("scoresOnly"),
  };
};

const stableUuidFromString = (input) => {
  const hash = crypto.createHash("sha256").update(String(input)).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const buildMongoCheckinFilter = ({ userId, pillar }) => {
  const filter = {};
  if (pillar) filter.pillarId = pillar;
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid --userId (expected Mongo ObjectId): ${userId}`);
    }
    filter.userId = new mongoose.Types.ObjectId(userId);
  }
  return filter;
};

const buildMongoScoreFilter = ({ userId, pillar }) => {
  const filter = {};
  if (pillar) filter.pillar = pillar;
  if (userId) filter.userId = String(userId);
  return filter;
};

const main = async () => {
  if (process.env.NODE_ENV === "production") {
    log("error", "Refusing to run in production.");
    process.exit(2);
  }

  const opts = parseArgs();
  const doCheckins = opts.scoresOnly ? false : true;
  const doScores = opts.checkinsOnly ? false : true;

  const mongoConn = await connectDB();
  if (!mongoConn) {
    log(
      "error",
      "MongoDB disabled (no valid MONGO_URI). Cannot backfill from Mongo.",
      { hint: "Set MONGO_URI to a valid mongodb:// or mongodb+srv:// URI" }
    );
    process.exit(2);
  }

  const summary = {
    dryRun: opts.dryRun,
    limit: opts.limit || null,
    scope: { userId: opts.userId, pillar: opts.pillar },
    checkins: { scanned: 0, created: 0, skippedExisting: 0 },
    scores: { scanned: 0, created: 0, skippedExisting: 0 },
  };

  if (doCheckins) {
    const filter = buildMongoCheckinFilter(opts);
    const cursor = PillarCheckIn.find(filter)
      .sort({ createdAt: 1 })
      .select("_id userId pillarId value note createdAt updatedAt")
      .cursor();

    for await (const doc of cursor) {
      summary.checkins.scanned += 1;
      if (opts.limit && summary.checkins.scanned > opts.limit) break;

      const pgId = stableUuidFromString(
        `pillar_check_in:mongo:${String(doc._id)}`
      );
      const exists = await prisma.pillarCheckIn.findUnique({
        where: { id: pgId },
        select: { id: true },
      });
      if (exists) {
        summary.checkins.skippedExisting += 1;
        continue;
      }

      summary.checkins.created += 1;
      if (opts.dryRun) continue;

      const pgUserId = String(doc.userId);
      const value = Number.isFinite(Number(doc.value))
        ? Math.round(Number(doc.value))
        : 0;

      await prisma.pillarCheckIn.create({
        data: {
          id: pgId,
          userId: pgUserId,
          pillarIdentifier: String(doc.pillarId),
          value,
          note: doc.note || "",
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      });
    }

    log("info", "Backfill pillar_check_in done", summary.checkins);
  }

  if (doScores) {
    const filter = buildMongoScoreFilter(opts);
    const cursor = PillarScore.find(filter)
      .sort({ updatedAt: 1 })
      .select(
        "userId pillar score trend weeklyScores monthlyScores quickWins createdAt updatedAt"
      )
      .cursor();

    for await (const doc of cursor) {
      summary.scores.scanned += 1;
      if (opts.limit && summary.scores.scanned > opts.limit) break;

      const key = {
        userId_pillarIdentifier: {
          userId: String(doc.userId),
          pillarIdentifier: String(doc.pillar),
        },
      };

      const exists = await prisma.pillarScore
        .findUnique({ where: key, select: { id: true } })
        .catch(() => null);
      if (exists) {
        summary.scores.skippedExisting += 1;
        continue;
      }

      summary.scores.created += 1;
      if (opts.dryRun) continue;

      await prisma.pillarScore.create({
        data: {
          userId: String(doc.userId),
          pillarIdentifier: String(doc.pillar),
          score: Number(doc.score ?? 50),
          trend: String(doc.trend || "stable"),
          weeklyScores: Array.isArray(doc.weeklyScores) ? doc.weeklyScores : [],
          monthlyScores: Array.isArray(doc.monthlyScores)
            ? doc.monthlyScores
            : [],
          quickWins: Array.isArray(doc.quickWins) ? doc.quickWins : [],
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      });
    }

    log("info", "Backfill pillar_score done", summary.scores);
  }

  log("info", "Backfill complete", summary);
  process.exit(0);
};

main()
  .catch((err) => {
    log("error", "Backfill crashed", {
      message: err?.message || String(err),
      name: err?.name,
      stack: err?.stack,
    });
    process.exit(1);
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
  });
