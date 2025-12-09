import mongoose from "mongoose";

const comBSubSchema = new mongoose.Schema(
  {
    capability: { type: Number, min: 0, max: 10, default: 5 },
    opportunity: { type: Number, min: 0, max: 10, default: 5 },
    motivation: { type: Number, min: 0, max: 10, default: 5 },
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

const psychologyProfileSchema = new mongoose.Schema(
  {
    physiology: {
      heightCm: { type: Number, min: 90, max: 250 },
      weightKg: { type: Number, min: 25, max: 350 },
      age: { type: Number, min: 13, max: 120 },
      sex: {
        type: String,
        enum: ["male", "female", "non_binary", "intersex", "prefer_not_say"],
        default: "prefer_not_say",
      },
      bmi: { type: Number, min: 10, max: 60 },
      notes: { type: String, default: null },
    },
    sleepChronotype: {
      type: {
        type: String,
        enum: [
          "bear",
          "lion",
          "wolf",
          "dolphin",
          "early_bird",
          "night_owl",
          "balanced",
        ],
        default: "balanced",
      },
      chronotypeScore: { type: Number, min: 0, max: 100 },
      preferredSleepWindow: {
        start: { type: String, default: null },
        end: { type: String, default: null },
      },
      wakeTime: { type: String, default: null },
      windDownTime: { type: String, default: null },
      notes: { type: String, default: null },
    },
    comBProfile: {
      capability: { type: Number, min: 0, max: 10, default: 5 },
      opportunity: { type: Number, min: 0, max: 10, default: 5 },
      motivation: { type: Number, min: 0, max: 10, default: 5 },
      limitingBeliefs: { type: [String], default: [] },
      accelerators: { type: [String], default: [] },
      frictionPoints: { type: [String], default: [] },
      narrativeSummary: { type: String, default: null },
    },
    cognitiveDistortions: {
      totalScore: { type: Number, min: 0, max: 100 },
      severity: {
        type: String,
        enum: ["minimal", "moderate", "significant", "severe"],
        default: "minimal",
      },
      endorsedPatterns: { type: [String], default: [] },
      copingStatements: { type: [String], default: [] },
      notes: { type: String, default: null },
    },
    stressIndex: {
      score: { type: Number, min: 0, max: 100 },
      severity: {
        type: String,
        enum: ["low", "elevated", "high", "critical"],
        default: "low",
      },
      topTriggers: { type: [String], default: [] },
      regulationCapacity: { type: Number, min: 0, max: 10 },
      recoveryAssets: { type: [String], default: [] },
      notes: { type: String, default: null },
    },
    moodBaseline: {
      average: { type: Number, min: 0, max: 10 },
      variability: { type: Number, min: 0, max: 10 },
      descriptors: { type: [String], default: [] },
      supportiveFactors: { type: [String], default: [] },
      challengeAreas: { type: [String], default: [] },
      notes: { type: String, default: null },
    },
    habitAdherence: {
      profile: {
        type: String,
        enum: ["architect", "rebel", "sprinter", "minimalist", "balanced"],
        default: "balanced",
      },
      adherenceScore: { type: Number, min: 0, max: 100 },
      consistency: { type: Number, min: 0, max: 10 },
      frictionPoints: { type: [String], default: [] },
      enablingFactors: { type: [String], default: [] },
      notes: { type: String, default: null },
    },
    dopamineReward: {
      calibrationScore: { type: Number, min: 0, max: 100 },
      sensitivityLevel: {
        type: String,
        enum: ["low", "balanced", "high"],
        default: "balanced",
      },
      rewardDrivers: { type: [String], default: [] },
      cautionFlags: { type: [String], default: [] },
      notes: { type: String, default: null },
    },
    overwhelmThreshold: {
      thresholdScore: { type: Number, min: 0, max: 100 },
      riskLevel: {
        type: String,
        enum: ["steady", "sensitive", "fragile"],
        default: "steady",
      },
      earlySignals: { type: [String], default: [] },
      recoveryStrategies: { type: [String], default: [] },
      notes: { type: String, default: null },
    },
    responses: { type: mongoose.Schema.Types.Mixed, default: {} },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const onboardingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: { unique: true } },

    // New demographic fields
    demographics: {
      age: Number,
      gender: String,
      location: String,
      timezone: String,
    },

    // Legacy COM-B fields
    age: { type: Number },
    sex: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_say"],
      default: "prefer_not_say",
    },
    heightCm: { type: Number },
    weightKg: { type: Number },
    shiftWork: { type: Boolean, default: false },

    // per-pillar COM-B scores
    com_b: {
      sleep: { type: comBSubSchema, default: () => ({}) },
      diet: { type: comBSubSchema, default: () => ({}) },
      exercise: { type: comBSubSchema, default: () => ({}) },
      physical_health: { type: comBSubSchema, default: () => ({}) },
      mental_health: { type: comBSubSchema, default: () => ({}) },
      finances: { type: comBSubSchema, default: () => ({}) },
      social: { type: comBSubSchema, default: () => ({}) },
      spirituality: { type: comBSubSchema, default: () => ({}) },
    },

    // New goal selection
    selectedGoals: [
      {
        pillar: String,
        goal: String,
      },
    ],

    // Health screening responses
    healthScreens: {
      overall_health: Number,
      chronic_conditions: Boolean,
      medications: Boolean,
      exercise_frequency: String,
    },

    // Mental health screening responses
    mentalHealthScreens: {
      depression: [Number],
      anxiety: [Number],
      stress: [Number],
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

    // Psychometric assessment responses/results
    assessments: {
      responses: { type: mongoose.Schema.Types.Mixed, default: {} },
      results: {
        type: Map,
        of: assessmentResultSchema,
        default: {},
      },
    },
    secureAssessments: {
      cipherText: { type: String, default: null },
      iv: { type: String, default: null },
      authTag: { type: String, default: null },
      version: { type: String, default: null },
    },

    psychologyProfile: {
      type: psychologyProfileSchema,
      default: null,
    },

    // Completion tracking
    completedAt: Date,

    // Legacy extra field
    extra: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("OnboardingProfile", onboardingSchema);
