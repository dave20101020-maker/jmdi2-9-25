import mongoose from "mongoose";
import {
  ENTITLEMENT_PLANS,
  getFeaturesForPlan,
  mapTierToPlan,
  resolveEntitlements,
} from "../utils/entitlements.js";
import { getAllowedPillarsForTier } from "../utils/subscriptionAccess.js";

const entitlementSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ENTITLEMENT_PLANS,
      default: "free",
    },
    features: {
      type: [String],
      default: function defaultEntitlementFeatures() {
        const plan =
          this?.entitlements?.plan ||
          mapTierToPlan(this?.subscriptionTier || "free");
        return getFeaturesForPlan(plan);
      },
    },
  },
  { _id: false }
);

const assessmentResultSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    totalPossible: { type: Number, default: 0 },
    percentile: { type: Number, default: null },
    severity: { type: String, default: null },
    interpretation: { type: String, default: null },
    recommendations: { type: [String], default: [] },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const subscriptionStateSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: ["free", "premium", "referral"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "trial", "expired", "canceled"],
      default: "active",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    referralCode: {
      type: String,
      default: null,
    },
    referralExpiresAt: {
      type: Date,
      default: null,
    },
    trialUsed: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: "self",
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name must be less than 100 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be less than 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please provide a valid email address"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "nhs_referral_patient"],
      default: "user",
      index: true,
    },
    subscriptionTier: {
      type: String,
      enum: ["free", "basic", "premium", "nhs_referred"],
      default: "free",
    },
    subscription: {
      type: subscriptionStateSchema,
      default: () => ({
        tier: "free",
        status: "active",
        startedAt: Date.now(),
        trialUsed: false,
        source: "self",
      }),
    },
    entitlements: {
      type: entitlementSchema,
      default: function defaultEntitlements() {
        const plan = mapTierToPlan(this?.subscriptionTier || "free");
        return {
          plan,
          features: getFeaturesForPlan(plan),
        };
      },
    },
    allowedPillars: {
      type: [String],
      default: function () {
        return getAllowedPillarsForTier("free");
      },
    },
    // User pillars progress and preferences
    pillars: {
      type: Map,
      of: {
        score: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
      default: {},
    },
    // User settings and preferences
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ["public", "friends", "private"],
          default: "friends",
        },
        showActivity: { type: Boolean, default: true },
        showStats: { type: Boolean, default: true },
      },
      preferences: {
        theme: {
          type: String,
          enum: ["light", "dark", "auto"],
          default: "auto",
        },
        language: { type: String, default: "en" },
        timezone: { type: String, default: "UTC" },
        startOfWeek: {
          type: String,
          enum: ["sunday", "monday"],
          default: "monday",
        },
      },
      coaching: {
        aiCoachEnabled: { type: Boolean, default: true },
        coachingFrequency: {
          type: String,
          enum: ["daily", "weekly", "asNeeded"],
          default: "daily",
        },
        focusAreas: { type: [String], default: [] },
      },
    },
    // Gamification: streaks and badges
    current_streak: {
      type: Number,
      default: 0,
    },
    longest_streak: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    // Email verification
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
    // Password reset
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    failedOtpAttempts: {
      type: Number,
      default: 0,
    },
    authLock: {
      reason: { type: String, default: null },
      lockedAt: { type: Date, default: null },
      lockedUntil: { type: Date, default: null },
    },
    lastFailedLoginAt: {
      type: Date,
    },
    lastFailedOtpAt: {
      type: Date,
    },
    // AI Data Usage Consent
    aiConsent: {
      type: Boolean,
      default: false,
      required: true,
    },
    consentTimestamp: {
      type: Date,
      default: null,
    },
    consentVersion: {
      type: String,
      default: null,
    },
    refreshTokens: {
      type: [
        new mongoose.Schema(
          {
            tokenId: { type: String, required: true },
            expiresAt: { type: Date, required: true },
            createdAt: { type: Date, default: Date.now },
            userAgent: { type: String, default: null },
            ip: { type: String, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    linkedProviders: {
      type: [String],
      default: [],
    },
    consents: {
      gdpr: {
        accepted: { type: Boolean, default: false },
        version: { type: String, default: null },
        timestamp: { type: Date, default: null },
      },
      clinical: {
        accepted: { type: Boolean, default: false },
        version: { type: String, default: null },
        timestamp: { type: Date, default: null },
      },
    },
    assessments: {
      type: Map,
      of: assessmentResultSchema,
      default: {},
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ facebookId: 1 }, { sparse: true });

userSchema.pre("save", function applyEntitlementDefaults(next) {
  this.entitlements = resolveEntitlements(this);
  next();
});

export default mongoose.model("User", userSchema);
