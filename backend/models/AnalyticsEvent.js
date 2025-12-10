import mongoose from "mongoose";

const AnalyticsEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    source: {
      type: String,
      default: "backend",
    },
    ip: String,
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    minimize: true,
    versionKey: false,
  }
);

AnalyticsEventSchema.index({ createdAt: -1 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", AnalyticsEventSchema);

export default AnalyticsEvent;
