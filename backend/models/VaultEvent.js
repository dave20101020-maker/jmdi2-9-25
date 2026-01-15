import mongoose from "mongoose";

const vaultEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    assessmentId: {
      type: String,
      default: null,
    },
    schemaVersion: {
      type: String,
      default: "v1",
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true, collection: "vault_events" }
);

vaultEventSchema.index({ userId: 1, type: 1, timestamp: -1 });

export default mongoose.model("VaultEvent", vaultEventSchema);
