import mongoose from "mongoose";

const FriendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    shareInsights: { type: Boolean, default: true },
    inviteNote: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

// prevent duplicate relationships (one direction)
FriendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export default mongoose.model("Friend", FriendSchema);
