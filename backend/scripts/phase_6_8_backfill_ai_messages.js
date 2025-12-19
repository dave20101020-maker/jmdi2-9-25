/**
 * PHASE 6.8 — MANUAL BACKFILL (DEV ONLY)
 * Backfills AI messages from Mongo -> Postgres
 *
 * Usage:
 *   node backend/scripts/phase_6_8_backfill_ai_messages.js
 */

import "../loadEnv.js";

import mongoose from "mongoose";
import crypto from "crypto";
import connectDB from "../config/database.js";
import AiMessage from "../models/AiMessage.js";
import { prisma } from "../src/db/prismaClient.js";

const PREFIX = "[PHASE 6.8][BACKFILL]";

const log = (level, message, meta) => {
  // eslint-disable-next-line no-console
  (console[level] || console.log)(`${PREFIX} ${message}`, meta || "");
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

const toPlain = (value) => {
  if (value && typeof value.toObject === "function") {
    return value.toObject({ depopulate: true });
  }
  return value;
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

  const cursor = AiMessage.find()
    .select("_id userId sessionId role content meta createdAt")
    .cursor();

  let scanned = 0;
  let upserted = 0;
  let failed = 0;

  for await (const msg of cursor) {
    scanned += 1;

    try {
      if (!msg?.userId) {
        log("warn", "skipping_missing_userId", { messageId: String(msg?._id) });
        continue;
      }

      const mongoId = String(msg?._id);
      const pgId = stableUuidFromString(`ai_message:mongo:${mongoId}`);

      const content = toPlain(msg.content);
      const meta = msg.meta == null ? null : toPlain(msg.meta);

      await prisma.aiMessage.upsert({
        where: { id: pgId },
        create: {
          id: pgId,
          userId: String(msg.userId),
          sessionId: msg.sessionId ? String(msg.sessionId) : null,
          role: String(msg.role),
          content,
          meta,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        },
        update: {
          userId: String(msg.userId),
          sessionId: msg.sessionId ? String(msg.sessionId) : null,
          role: String(msg.role),
          content,
          meta,
        },
      });

      upserted += 1;
    } catch (err) {
      failed += 1;
      log("warn", "upsert_failed", {
        messageId: String(msg?._id),
        userId: String(msg?.userId),
        sessionId: msg?.sessionId ? String(msg.sessionId) : null,
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
