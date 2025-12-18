// Phase 6.4.5 validation script (dev-only, read-only).
// Usage:
//   node backend/scripts/phase_6_4_5_validate_pillar_checkins.js
//   node backend/scripts/phase_6_4_5_validate_pillar_checkins.js --sample=50
//   node backend/scripts/phase_6_4_5_validate_pillar_checkins.js --userId=<mongoObjectId>
//
// Exits non-zero if mismatches are found.

import "../loadEnv.js";

import mongoose from "mongoose";
import crypto from "crypto";
import connectDB from "../config/database.js";
import { prisma } from "../src/db/prismaClient.js";

import PillarCheckIn from "../models/PillarCheckIn.js";
import PillarScore from "../models/PillarScore.js";

const PREFIX = "[PHASE 6.4][VALIDATION]";

const isDevOnly = () => process.env.NODE_ENV !== "production";

const parseArgs = () => {
  const args = new Map();
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const [k, v] = raw.slice(2).split("=");
    args.set(k, v ?? true);
  }
  return {
    sample: Number(args.get("sample") || 50),
    userId: typeof args.get("userId") === "string" ? args.get("userId") : null,
    pillar: typeof args.get("pillar") === "string" ? args.get("pillar") : null,
  };
};

const log = (level, message, meta) => {
  const payload = meta ? { ...meta } : undefined;
  // eslint-disable-next-line no-console
  (console[level] || console.log)(`${PREFIX} ${message}`, payload || "");
};

const stableUuidFromString = (input) => {
  // Keep consistent with pillarsController dual-write.
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

const toMs = (d) =>
  d instanceof Date ? d.getTime() : d ? new Date(d).getTime() : null;

const roughlyEqualTime = (a, b, toleranceMs = 2000) => {
  const am = toMs(a);
  const bm = toMs(b);
  if (am === null || bm === null) return am === bm;
  return Math.abs(am - bm) <= toleranceMs;
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

const buildPgCheckinWhere = ({ userId, pillar }) => {
  const where = {};
  if (pillar) where.pillarIdentifier = pillar;
  if (userId) where.userId = String(userId);
  return where;
};

const buildMongoScoreFilter = ({ userId, pillar }) => {
  const filter = {};
  if (pillar) filter.pillar = pillar;
  if (userId) filter.userId = String(userId);
  return filter;
};

const buildPgScoreWhere = ({ userId, pillar }) => {
  const where = {};
  if (pillar) where.pillarIdentifier = pillar;
  if (userId) where.userId = String(userId);
  return where;
};

const main = async () => {
  if (!isDevOnly()) {
    log("error", "Refusing to run in production.");
    process.exit(2);
  }

  const opts = parseArgs();
  if (!Number.isFinite(opts.sample) || opts.sample <= 0) {
    throw new Error(`Invalid --sample: ${opts.sample}`);
  }

  const mongoConn = await connectDB();
  if (!mongoConn) {
    log(
      "error",
      "MongoDB disabled (no valid MONGO_URI). Cannot validate Mongo vs Postgres parity.",
      { hint: "Set MONGO_URI to a valid mongodb:// or mongodb+srv:// URI" }
    );
    process.exit(2);
  }

  let mismatchCount = 0;

  // --- PillarCheckIn: counts + latest timestamp ---
  const mongoCheckinFilter = buildMongoCheckinFilter(opts);
  const pgCheckinWhere = buildPgCheckinWhere(opts);

  const [mongoCheckinCount, pgCheckinCount] = await Promise.all([
    PillarCheckIn.countDocuments(mongoCheckinFilter),
    prisma.pillarCheckIn.count({ where: pgCheckinWhere }),
  ]);

  if (mongoCheckinCount !== pgCheckinCount) {
    mismatchCount += 1;
    log("warn", "PillarCheckIn count mismatch", {
      mongo: mongoCheckinCount,
      postgres: pgCheckinCount,
      scope: { userId: opts.userId, pillar: opts.pillar },
    });
  } else {
    log("info", "PillarCheckIn counts match", {
      count: mongoCheckinCount,
      scope: { userId: opts.userId, pillar: opts.pillar },
    });
  }

  const [mongoLatestCheckin, pgLatestCheckin] = await Promise.all([
    PillarCheckIn.findOne(mongoCheckinFilter)
      .sort({ createdAt: -1 })
      .select("_id userId pillarId createdAt updatedAt")
      .lean(),
    prisma.pillarCheckIn.findFirst({
      where: pgCheckinWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        pillarIdentifier: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const mongoLatestAt = mongoLatestCheckin?.createdAt || null;
  const pgLatestAt = pgLatestCheckin?.createdAt || null;

  if (!roughlyEqualTime(mongoLatestAt, pgLatestAt, 5000)) {
    mismatchCount += 1;
    log("warn", "Most recent PillarCheckIn timestamp mismatch", {
      mongo: mongoLatestAt,
      postgres: pgLatestAt,
      mongoDoc: mongoLatestCheckin
        ? {
            _id: String(mongoLatestCheckin._id),
            userId: String(mongoLatestCheckin.userId),
            pillarId: mongoLatestCheckin.pillarId,
          }
        : null,
      postgresRow: pgLatestCheckin
        ? {
            id: pgLatestCheckin.id,
            userId: pgLatestCheckin.userId,
            pillarIdentifier: pgLatestCheckin.pillarIdentifier,
          }
        : null,
    });
  } else {
    log("info", "Most recent PillarCheckIn timestamps align", {
      at: mongoLatestAt || pgLatestAt,
    });
  }

  // --- PillarCheckIn: recent sample parity ---
  const recentMongoCheckins = await PillarCheckIn.find(mongoCheckinFilter)
    .sort({ createdAt: -1 })
    .limit(opts.sample)
    .select("_id userId pillarId value note createdAt updatedAt")
    .lean();

  let sampleMissing = 0;
  let sampleFieldMismatch = 0;

  for (const doc of recentMongoCheckins) {
    const pgId = stableUuidFromString(
      `pillar_check_in:mongo:${String(doc._id)}`
    );
    const row = await prisma.pillarCheckIn.findUnique({
      where: { id: pgId },
      select: {
        id: true,
        userId: true,
        pillarIdentifier: true,
        value: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!row) {
      sampleMissing += 1;
      mismatchCount += 1;
      log("warn", "Missing Postgres PillarCheckIn row", {
        mongoId: String(doc._id),
        expectedPgId: pgId,
        userId: String(doc.userId),
        pillarId: doc.pillarId,
        createdAt: doc.createdAt,
      });
      continue;
    }

    const expectedUserId = String(doc.userId);
    const expectedPillar = doc.pillarId;
    const expectedValue = Number.isFinite(Number(doc.value))
      ? Math.round(Number(doc.value))
      : 0;
    const expectedNote = doc.note || "";

    const mismatches = [];
    if (row.userId !== expectedUserId) mismatches.push("userId");
    if (row.pillarIdentifier !== expectedPillar)
      mismatches.push("pillarIdentifier");
    if (row.value !== expectedValue) mismatches.push("value");
    if ((row.note || "") !== expectedNote) mismatches.push("note");
    if (!roughlyEqualTime(row.createdAt, doc.createdAt))
      mismatches.push("createdAt");
    if (!roughlyEqualTime(row.updatedAt, doc.updatedAt))
      mismatches.push("updatedAt");

    if (mismatches.length > 0) {
      sampleFieldMismatch += 1;
      mismatchCount += 1;
      log("warn", "PillarCheckIn field mismatch", {
        fields: mismatches,
        mongo: {
          _id: String(doc._id),
          userId: String(doc.userId),
          pillarId: doc.pillarId,
          value: doc.value,
          note: doc.note,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
        postgres: row,
      });
    }
  }

  log("info", "PillarCheckIn sample parity summary", {
    sampled: recentMongoCheckins.length,
    missingInPostgres: sampleMissing,
    fieldMismatches: sampleFieldMismatch,
  });

  // --- PillarScore: counts + latest timestamp + sample parity ---
  const mongoScoreFilter = buildMongoScoreFilter(opts);
  const pgScoreWhere = buildPgScoreWhere(opts);

  const [mongoScoreCount, pgScoreCount] = await Promise.all([
    PillarScore.countDocuments(mongoScoreFilter),
    prisma.pillarScore.count({ where: pgScoreWhere }),
  ]);

  if (mongoScoreCount !== pgScoreCount) {
    mismatchCount += 1;
    log("warn", "PillarScore count mismatch", {
      mongo: mongoScoreCount,
      postgres: pgScoreCount,
      scope: { userId: opts.userId, pillar: opts.pillar },
    });
  } else {
    log("info", "PillarScore counts match", {
      count: mongoScoreCount,
      scope: { userId: opts.userId, pillar: opts.pillar },
    });
  }

  const [mongoLatestScore, pgLatestScore] = await Promise.all([
    PillarScore.findOne(mongoScoreFilter)
      .sort({ updatedAt: -1 })
      .select(
        "userId pillar score trend weeklyScores monthlyScores quickWins createdAt updatedAt"
      )
      .lean(),
    prisma.pillarScore.findFirst({
      where: pgScoreWhere,
      orderBy: { updatedAt: "desc" },
      select: {
        userId: true,
        pillarIdentifier: true,
        score: true,
        trend: true,
        weeklyScores: true,
        monthlyScores: true,
        quickWins: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  if (
    !roughlyEqualTime(
      mongoLatestScore?.updatedAt || null,
      pgLatestScore?.updatedAt || null,
      5000
    )
  ) {
    mismatchCount += 1;
    log("warn", "Most recent PillarScore updatedAt mismatch", {
      mongo: mongoLatestScore?.updatedAt || null,
      postgres: pgLatestScore?.updatedAt || null,
      mongoDoc: mongoLatestScore
        ? { userId: mongoLatestScore.userId, pillar: mongoLatestScore.pillar }
        : null,
      postgresRow: pgLatestScore
        ? {
            userId: pgLatestScore.userId,
            pillarIdentifier: pgLatestScore.pillarIdentifier,
          }
        : null,
    });
  } else {
    log("info", "Most recent PillarScore updatedAt aligns", {
      at: mongoLatestScore?.updatedAt || pgLatestScore?.updatedAt || null,
    });
  }

  const recentMongoScores = await PillarScore.find(mongoScoreFilter)
    .sort({ updatedAt: -1 })
    .limit(opts.sample)
    .select(
      "userId pillar score trend weeklyScores monthlyScores quickWins updatedAt createdAt"
    )
    .lean();

  let scoreMissing = 0;
  let scoreFieldMismatch = 0;

  for (const doc of recentMongoScores) {
    const row = await prisma.pillarScore.findUnique({
      where: {
        userId_pillarIdentifier: {
          userId: String(doc.userId),
          pillarIdentifier: String(doc.pillar),
        },
      },
      select: {
        userId: true,
        pillarIdentifier: true,
        score: true,
        trend: true,
        weeklyScores: true,
        monthlyScores: true,
        quickWins: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!row) {
      scoreMissing += 1;
      mismatchCount += 1;
      log("warn", "Missing Postgres PillarScore row", {
        userId: String(doc.userId),
        pillar: String(doc.pillar),
        updatedAt: doc.updatedAt,
      });
      continue;
    }

    const mismatches = [];
    if (row.score !== Number(doc.score)) mismatches.push("score");
    if (String(row.trend) !== String(doc.trend || "stable"))
      mismatches.push("trend");

    if (mismatches.length > 0) {
      scoreFieldMismatch += 1;
      mismatchCount += 1;
      log("warn", "PillarScore field mismatch", {
        fields: mismatches,
        mongo: {
          userId: doc.userId,
          pillar: doc.pillar,
          score: doc.score,
          trend: doc.trend,
        },
        postgres: {
          userId: row.userId,
          pillarIdentifier: row.pillarIdentifier,
          score: row.score,
          trend: row.trend,
        },
      });
    }
  }

  log("info", "PillarScore sample parity summary", {
    sampled: recentMongoScores.length,
    missingInPostgres: scoreMissing,
    fieldMismatches: scoreFieldMismatch,
  });

  if (mismatchCount > 0) {
    log("error", "Validation found mismatches", { mismatchCount });
    process.exit(1);
  }

  log("info", "Validation passed (no mismatches detected)");
  process.exit(0);
};

main()
  .catch((err) => {
    log("error", "Validation crashed", {
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
