import mongoose from "mongoose";
import { VALID_PILLARS } from "../utils/pillars.js";

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, "content is required"],
    },
    pillar: {
      type: String,
      enum: VALID_PILLARS,
      index: true,
    },
    habitId: {
      type: String,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: "manual",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

insightSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Insight", insightSchema);
