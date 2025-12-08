import mongoose from "mongoose";

const oauthStateSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["google", "apple"],
    },
    codeVerifier: {
      type: String,
      required: false, // Only needed for PKCE flow
    },
    redirectUrl: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: { expires: 0 }, // TTL index - auto-delete when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

// Index for cleanup queries
oauthStateSchema.index({ expiresAt: 1 });

const OAuthState = mongoose.model("OAuthState", oauthStateSchema);

export default OAuthState;
