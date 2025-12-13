import mongoose from "mongoose";

const miniChallengeSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    reward: { type: String },
    note: { type: String, maxlength: 400 },
    status: {
      type: String,
      enum: ["sent", "accepted", "completed", "dismissed"],
      default: "sent",
      index: true,
    },
  },
  { timestamps: true }
);

miniChallengeSchema.index({ creatorId: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("MiniChallenge", miniChallengeSchema);
