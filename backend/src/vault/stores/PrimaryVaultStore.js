import mongoose from "mongoose";
import VaultEvent from "../../../models/VaultEvent.js";

const isMongoReady = () =>
  VaultEvent?.db?.readyState === 1 || mongoose.connection.readyState === 1;

export default class PrimaryVaultStore {
  async put({ userId, type, payload, metadata }) {
    if (!process.env.MONGO_URI || !isMongoReady()) {
      return { ok: false, stored: false, reason: "mongo_unavailable" };
    }

    const timestamp = metadata?.timestamp
      ? new Date(metadata.timestamp)
      : new Date();

    const record = await VaultEvent.create({
      userId,
      type,
      assessmentId: metadata?.assessmentId || null,
      schemaVersion: metadata?.schemaVersion || "v1",
      timestamp,
      payload: payload || {},
    });

    return { ok: true, stored: true, record };
  }

  async query({ userId, type, filters = {} }) {
    if (!process.env.MONGO_URI || !isMongoReady()) {
      return { ok: false, items: [], reason: "mongo_unavailable" };
    }

    const query = { userId, type, ...filters };
    const items = await VaultEvent.find(query).sort({ timestamp: -1 }).lean();
    return { ok: true, items };
  }
}
