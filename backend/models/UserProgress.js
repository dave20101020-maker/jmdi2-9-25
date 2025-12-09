import mongoose from "mongoose";
import { VALID_PILLARS } from "../utils/pillars.js";

const pillarProgressSchema = new mongoose.Schema(
  {
    pillar: {
      type: String,
      enum: VALID_PILLARS,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    trend: {
      type: String,
      default: "stable",
      enum: ["up", "down", "stable"],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const habitProgressSchema = new mongoose.Schema(
  {
    habitId: { type: String, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },
    streak: { type: Number, default: 0, min: 0 },
    completions: { type: Number, default: 0, min: 0 },
    lastCompletedAt: { type: Date },
  },
  { _id: false }
);

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },
    pillars: {
      type: [pillarProgressSchema],
      default: [],
    },
    habits: {
      type: [habitProgressSchema],
      default: [],
    },
    insightIds: {
      type: [String],
      default: [],
    },
    lastSyncedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserProgress", userProgressSchema);
