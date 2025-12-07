import mongoose from "mongoose";

const userConsentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    consentType: {
      type: String,
      enum: ["gdpr", "clinical"],
      required: true,
    },
    consentVersion: {
      type: String,
      required: true,
    },
    ipHash: {
      type: String,
      required: true,
    },
    userAgentHash: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userConsentSchema.index({ userId: 1, consentType: 1 }, { unique: true });

export default mongoose.model("UserConsent", userConsentSchema);
