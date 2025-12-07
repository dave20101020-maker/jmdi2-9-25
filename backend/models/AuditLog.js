import mongoose from "mongoose";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      default: null,
      trim: true,
    },
    ip: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failure", "denied"],
      default: "success",
    },
    description: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

auditLogSchema.set("toJSON", { virtuals: true });
auditLogSchema.set("toObject", { virtuals: true });

export default mongoose.model("AuditLog", auditLogSchema);
