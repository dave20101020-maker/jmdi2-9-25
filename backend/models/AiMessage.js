import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["system", "user", "assistant", "tool"],
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Content is required"],
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

aiMessageSchema.index({ userId: 1, createdAt: -1 });
aiMessageSchema.index({ sessionId: 1 });

export default mongoose.model("AiMessage", aiMessageSchema);
