/**
 * Onboarding Routes
 *
 * Multi-step onboarding flow:
 * 1. Demographics (age, gender, location, timezone)
 * 2. Goals (select primary goals for up to 3 pillars)
 * 3. Health screens (physical health assessment)
 * 4. Mental health screens (depression/anxiety/stress)
 *
 * POST /api/onboarding/complete  - Submit complete onboarding
 * GET  /api/onboarding/status    - Get onboarding completion status
 * GET  /api/onboarding/template  - Get form template
 */

import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import OnboardingProfile from "../models/OnboardingProfile.js";
import { loadMemory, saveMemory } from "../src/ai/orchestrator/memoryStore.js";
import logger from "../utils/logger.js";
import { requireSensitiveConsent } from "../middleware/consentGuard.js";

const router = express.Router();
router.use(authRequired);

// Available goals per pillar
const PILLAR_GOALS = {
  sleep: [
    "Establish consistent sleep schedule",
    "Reduce sleep onset time",
    "Eliminate night time awakenings",
    "Feel more rested each morning",
    "Track sleep patterns",
  ],
  fitness: [
    "Build muscle strength",
    "Improve cardiovascular health",
    "Increase overall endurance",
    "Reach target weight",
    "Establish workout habit",
  ],
  "mental-health": [
    "Reduce anxiety",
    "Improve mood stability",
    "Build coping strategies",
    "Reduce stress levels",
    "Practice mindfulness",
  ],
  nutrition: [
    "Eat more balanced meals",
    "Reduce sugar intake",
    "Increase water consumption",
    "Cook more at home",
    "Nutritional awareness",
  ],
  finances: [
    "Build emergency fund",
    "Reduce debt",
    "Save for specific goal",
    "Budget tracking",
    "Build good financial habits",
  ],
  "physical-health": [
    "Manage chronic condition",
    "Reduce pain/discomfort",
    "Improve energy levels",
    "Regular health check-ups",
    "Medication compliance",
  ],
  social: [
    "Build stronger relationships",
    "Reduce loneliness",
    "Improve social skills",
    "Expand friend group",
    "Quality time with loved ones",
  ],
  spirituality: [
    "Develop spiritual practice",
    "Connect with purpose",
    "Practice gratitude",
    "Find inner peace",
    "Explore beliefs and values",
  ],
};

// Mental health screening questions
const MENTAL_HEALTH_SCREENS = {
  depression: {
    label: "Depression Screening",
    questions: [
      "Over the past 2 weeks, how often have you felt down, depressed, or hopeless?",
      "Over the past 2 weeks, have you lost interest in things you normally enjoy?",
      "I feel like I have less energy than usual",
      "I have trouble concentrating or making decisions",
    ],
  },
  anxiety: {
    label: "Anxiety Screening",
    questions: [
      "Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?",
      "Do you have difficulty controlling worry?",
      "I experience physical symptoms like racing heart or difficulty breathing",
      "Anxiety interferes with my daily activities",
    ],
  },
  stress: {
    label: "Stress Screening",
    questions: [
      "How would you rate your current stress level? (1=low, 10=high)",
      "I feel overwhelmed by my responsibilities",
      "I have adequate coping strategies for stress",
      "My stress affects my sleep or appetite",
    ],
  },
};

const PSYCHOMETRIC_SURVEYS = [
  { id: "phq9", name: "PHQ-9 Mood Survey", domain: "mental_health" },
  { id: "gad7", name: "GAD-7 Anxiety", domain: "mental_health" },
  { id: "adhd", name: "ADHD Focus Screener", domain: "neurodiversity" },
  { id: "aq10", name: "Autism Quotient (AQ-10)", domain: "neurodiversity" },
  { id: "sleep_hygiene", name: "Sleep Hygiene Index", domain: "sleep" },
  { id: "diet_quality", name: "Diet Quality Pulse", domain: "nutrition" },
  { id: "exercise_readiness", name: "Exercise Readiness", domain: "fitness" },
  {
    id: "social_support",
    name: "Social Support Index",
    domain: "relationships",
  },
];

const CONSENT_VERSION = {
  gdpr: "gdpr-2025.12",
  clinical: "clinical-2025.12",
};

const CONSENT_REQUIREMENTS = [
  {
    id: "gdpr",
    title: "GDPR Data Processing Consent",
    version: CONSENT_VERSION.gdpr,
    summary:
      "Authorize NorthStar to process your personal and wellbeing data under GDPR Article 6(1)(a).",
    bulletPoints: [
      "We store your check-ins and assessments inside the EU/US with encryption.",
      "You may withdraw consent at any time inside Settings > Privacy.",
      "Data is only shared with processors listed in our Trust Center.",
    ],
  },
  {
    id: "clinical",
    title: "Clinical Safety Acknowledgement",
    version: CONSENT_VERSION.clinical,
    summary:
      "Confirm you understand NorthStar is a coaching companion and not a licensed clinician.",
    bulletPoints: [
      "AI output is for educational coaching—not medical diagnosis.",
      "Always contact emergency services for life-threatening concerns.",
      "Review recommendations with your healthcare team when unsure.",
    ],
  },
];

const normalizeConsentSnapshot = (consents = {}) => {
  const now = new Date();
  return {
    gdpr: {
      accepted: !!consents?.gdpr?.accepted,
      version: consents?.gdpr?.version || CONSENT_VERSION.gdpr,
      timestamp: consents?.gdpr?.timestamp
        ? new Date(consents.gdpr.timestamp)
        : now,
    },
    clinical: {
      accepted: !!consents?.clinical?.accepted,
      version: consents?.clinical?.version || CONSENT_VERSION.clinical,
      timestamp: consents?.clinical?.timestamp
        ? new Date(consents.clinical.timestamp)
        : now,
    },
  };
};

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "intersex", label: "Intersex" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const CHRONOTYPE_OPTIONS = [
  { value: "bear", label: "Bear" },
  { value: "lion", label: "Lion" },
  { value: "wolf", label: "Wolf" },
  { value: "dolphin", label: "Dolphin" },
  { value: "early_bird", label: "Early Bird" },
  { value: "night_owl", label: "Night Owl" },
  { value: "balanced", label: "Balanced" },
];

const COGNITIVE_DISTORTION_OPTIONS = [
  "All-or-nothing thinking",
  "Catastrophizing",
  "Mental filtering",
  "Disqualifying the positive",
  "Mind reading",
  "Fortune telling",
  "Emotional reasoning",
  "Should statements",
  "Labeling",
  "Personalization",
];

const STRESS_SEVERITY_OPTIONS = ["low", "elevated", "high", "critical"];
const COGNITIVE_SEVERITY_OPTIONS = [
  "minimal",
  "moderate",
  "significant",
  "severe",
];
const HABIT_PROFILE_OPTIONS = [
  { value: "architect", label: "Architect" },
  { value: "rebel", label: "Rebel" },
  { value: "sprinter", label: "Sprinter" },
  { value: "minimalist", label: "Minimalist" },
  { value: "balanced", label: "Balanced" },
];
const DOPAMINE_SENSITIVITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "balanced", label: "Balanced" },
  { value: "high", label: "High" },
];
const OVERWHELM_RISK_OPTIONS = [
  { value: "steady", label: "Steady" },
  { value: "sensitive", label: "Sensitive" },
  { value: "fragile", label: "Fragile" },
];

const enumValues = (options = []) =>
  options.map((option) => option.value ?? option);

const startCase = (value) =>
  value
    .split(/[_\s-]+/)
    .map((segment) =>
      segment.length ? segment.charAt(0).toUpperCase() + segment.slice(1) : ""
    )
    .join(" ");

const mapToOptions = (values = []) =>
  values.map((value) => ({ value, label: startCase(value) }));

const STRESS_SEVERITY_SELECT = mapToOptions(STRESS_SEVERITY_OPTIONS);
const COGNITIVE_SEVERITY_SELECT = mapToOptions(COGNITIVE_SEVERITY_OPTIONS);

const normalizeNumber = (
  value,
  { min = null, max = null, precision = null } = {}
) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  let adjusted = numeric;
  if (typeof min === "number") {
    adjusted = Math.max(min, adjusted);
  }
  if (typeof max === "number") {
    adjusted = Math.min(max, adjusted);
  }
  if (typeof precision === "number") {
    const factor = 10 ** precision;
    adjusted = Math.round(adjusted * factor) / factor;
  }
  return adjusted;
};

const normalizeEnum = (value, options, fallback = null) => {
  const allowed = new Set(enumValues(options));
  if (typeof value === "string" && allowed.has(value)) {
    return value;
  }
  return fallback;
};

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTimeValue = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

const normalizeStringArray = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set();
  return input
    .map((item) => normalizeString(item))
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const calculateBmi = (heightCm, weightKg) => {
  const height = normalizeNumber(heightCm, { min: 50, max: 250, precision: 2 });
  const weight = normalizeNumber(weightKg, { min: 25, max: 350, precision: 2 });
  if (!height || !weight) {
    return null;
  }
  const meters = height / 100;
  const bmi = weight / (meters * meters);
  if (!Number.isFinite(bmi)) {
    return null;
  }
  return Math.round(bmi * 10) / 10;
};

// ============================================================================
// GET ONBOARDING TEMPLATE
// ============================================================================

/**
 * GET /api/onboarding/template
 *
 * Returns the full onboarding form template with questions and options
 */
router.get("/template", (req, res) => {
  res.json({
    ok: true,
    template: {
      demographics: {
        fields: [
          {
            name: "age",
            label: "Age",
            type: "number",
            min: 13,
            max: 120,
            required: true,
          },
          {
            name: "gender",
            label: "Gender",
            type: "select",
            options: [
              "Male",
              "Female",
              "Non-binary",
              "Prefer to say",
              "Prefer not to say",
            ],
            required: true,
          },
          {
            name: "location",
            label: "Country/Region",
            type: "text",
            placeholder: "e.g., United States",
            required: true,
          },
          {
            name: "timezone",
            label: "Timezone",
            type: "select",
            options: [
              "UTC-11",
              "UTC-10",
              "UTC-9",
              "UTC-8",
              "UTC-7",
              "UTC-6",
              "UTC-5",
              "UTC-4",
              "UTC-3",
              "UTC-2",
              "UTC-1",
              "UTC",
              "UTC+1",
              "UTC+2",
              "UTC+3",
              "UTC+4",
              "UTC+5",
              "UTC+6",
              "UTC+7",
              "UTC+8",
              "UTC+9",
              "UTC+10",
              "UTC+11",
              "UTC+12",
            ],
            required: true,
          },
        ],
      },
      goals: {
        description: "Select your primary focus areas (up to 3 pillars)",
        pillars: Object.entries(PILLAR_GOALS).map(([pillar, goals]) => ({
          name: pillar,
          label: pillar.replace("-", " ").toUpperCase(),
          goals,
        })),
      },
      healthScreens: {
        description: "Quick health assessment (1-5 scale)",
        questions: [
          {
            id: "overall_health",
            question: "How would you rate your overall physical health?",
            type: "number",
            range: [1, 5],
            labels: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
          },
          {
            id: "chronic_conditions",
            question: "Do you have any chronic health conditions?",
            type: "boolean",
          },
          {
            id: "medications",
            question: "Are you currently taking any medications?",
            type: "boolean",
          },
          {
            id: "exercise_frequency",
            question: "How often do you exercise per week?",
            type: "select",
            options: ["Never", "Less than 1x", "1-2x", "3-4x", "5+ times"],
          },
        ],
      },
      mentalHealthScreens: MENTAL_HEALTH_SCREENS,
      psychometricAssessments: {
        instruments: PSYCHOMETRIC_SURVEYS,
        required: true,
        description:
          "Evidence-based questionnaires that help NorthStar personalize care.",
      },
      psychologyFlow: {
        title: "Psychology & Physiology",
        description:
          "CBT-informed intake that maps mindset, physiology, and behaviour barriers across the COM-B model.",
        sections: [
          {
            id: "physiology",
            label: "Physiology Baseline",
            fields: [
              {
                name: "physiology.heightCm",
                label: "Height",
                type: "number",
                unit: "cm",
                min: 90,
                max: 250,
                required: true,
              },
              {
                name: "physiology.weightKg",
                label: "Weight",
                type: "number",
                unit: "kg",
                min: 25,
                max: 350,
                required: true,
              },
              {
                name: "physiology.age",
                label: "Age",
                type: "number",
                min: 13,
                max: 120,
                required: true,
              },
              {
                name: "physiology.sex",
                label: "Sex",
                type: "select",
                options: SEX_OPTIONS,
                required: true,
              },
            ],
          },
          {
            id: "chronotype",
            label: "Sleep Chronotype",
            fields: [
              {
                name: "sleepChronotype.type",
                label: "Chronotype",
                type: "select",
                options: CHRONOTYPE_OPTIONS,
                required: true,
              },
              {
                name: "sleepChronotype.chronotypeScore",
                label: "Chronotype Score",
                type: "slider",
                min: 0,
                max: 100,
                helperText:
                  "Composite score from morningness-eveningness scale.",
              },
              {
                name: "sleepChronotype.preferredSleepWindow.start",
                label: "Preferred Sleep Start",
                type: "time",
              },
              {
                name: "sleepChronotype.preferredSleepWindow.end",
                label: "Preferred Wake Time",
                type: "time",
              },
            ],
          },
          {
            id: "com_b",
            label: "COM-B Profile",
            fields: [
              {
                name: "comBProfile.capability",
                label: "Capability",
                type: "slider",
                min: 0,
                max: 10,
                required: true,
              },
              {
                name: "comBProfile.opportunity",
                label: "Opportunity",
                type: "slider",
                min: 0,
                max: 10,
                required: true,
              },
              {
                name: "comBProfile.motivation",
                label: "Motivation",
                type: "slider",
                min: 0,
                max: 10,
                required: true,
              },
              {
                name: "comBProfile.limitingBeliefs",
                label: "Limiting Beliefs",
                type: "tags",
                helperText: "Select or add top cognitive/behavioural blockers.",
              },
              {
                name: "comBProfile.accelerators",
                label: "Accelerators",
                type: "tags",
                helperText: "Strengths that make change easier.",
              },
              {
                name: "comBProfile.frictionPoints",
                label: "Friction Points",
                type: "tags",
              },
            ],
          },
          {
            id: "cognitive_distortions",
            label: "Cognitive Distortions",
            fields: [
              {
                name: "cognitiveDistortions.totalScore",
                label: "Distortion Load",
                type: "slider",
                min: 0,
                max: 100,
              },
              {
                name: "cognitiveDistortions.severity",
                label: "Severity",
                type: "select",
                options: COGNITIVE_SEVERITY_SELECT,
              },
              {
                name: "cognitiveDistortions.endorsedPatterns",
                label: "Endorsed Patterns",
                type: "multi-select",
                options: COGNITIVE_DISTORTION_OPTIONS,
              },
            ],
          },
          {
            id: "stress",
            label: "Stress Capacity",
            fields: [
              {
                name: "stressIndex.score",
                label: "Stress Index",
                type: "slider",
                min: 0,
                max: 100,
                required: true,
              },
              {
                name: "stressIndex.severity",
                label: "Stress Severity",
                type: "select",
                options: STRESS_SEVERITY_SELECT,
              },
              {
                name: "stressIndex.topTriggers",
                label: "Top Triggers",
                type: "tags",
              },
              {
                name: "stressIndex.regulationCapacity",
                label: "Regulation Capacity",
                type: "slider",
                min: 0,
                max: 10,
              },
            ],
          },
          {
            id: "mood",
            label: "Mood Baseline",
            fields: [
              {
                name: "moodBaseline.average",
                label: "Average Mood",
                type: "slider",
                min: 0,
                max: 10,
              },
              {
                name: "moodBaseline.variability",
                label: "Mood Variability",
                type: "slider",
                min: 0,
                max: 10,
              },
              {
                name: "moodBaseline.descriptors",
                label: "Mood Descriptors",
                type: "tags",
              },
            ],
          },
          {
            id: "habit",
            label: "Habit Adherence",
            fields: [
              {
                name: "habitAdherence.profile",
                label: "Habit Identity",
                type: "select",
                options: HABIT_PROFILE_OPTIONS,
              },
              {
                name: "habitAdherence.adherenceScore",
                label: "Adherence Score",
                type: "slider",
                min: 0,
                max: 100,
              },
              {
                name: "habitAdherence.consistency",
                label: "Consistency",
                type: "slider",
                min: 0,
                max: 10,
              },
            ],
          },
          {
            id: "dopamine",
            label: "Dopamine Calibration",
            fields: [
              {
                name: "dopamineReward.calibrationScore",
                label: "Calibration Score",
                type: "slider",
                min: 0,
                max: 100,
              },
              {
                name: "dopamineReward.sensitivityLevel",
                label: "Sensitivity",
                type: "select",
                options: DOPAMINE_SENSITIVITY_OPTIONS,
              },
              {
                name: "dopamineReward.rewardDrivers",
                label: "Reward Drivers",
                type: "tags",
              },
            ],
          },
          {
            id: "overwhelm",
            label: "Overwhelm Threshold",
            fields: [
              {
                name: "overwhelmThreshold.thresholdScore",
                label: "Threshold Score",
                type: "slider",
                min: 0,
                max: 100,
              },
              {
                name: "overwhelmThreshold.riskLevel",
                label: "Risk Level",
                type: "select",
                options: OVERWHELM_RISK_OPTIONS,
              },
              {
                name: "overwhelmThreshold.earlySignals",
                label: "Early Signals",
                type: "tags",
              },
              {
                name: "overwhelmThreshold.recoveryStrategies",
                label: "Recovery Strategies",
                type: "tags",
              },
            ],
          },
        ],
        scoring: {
          comBScale: { min: 0, max: 10 },
          stressIndex: { min: 0, max: 100 },
          habitAdherence: { min: 0, max: 100 },
        },
      },
      consents: {
        requirements: CONSENT_REQUIREMENTS,
      },
    },
  });
});

// ============================================================================
// GET ONBOARDING STATUS
// ============================================================================

/**
 * GET /api/onboarding/status
 *
 * Check if user has completed onboarding
 */
router.get("/status", async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const profile = await OnboardingProfile.findOne({ userId });

    if (!profile) {
      return res.json({
        ok: true,
        completed: false,
        step: "demographics",
      });
    }

    const completionStatus = {
      demographics: !!profile.demographics,
      goals: !!profile.selectedGoals && profile.selectedGoals.length > 0,
      healthScreens: !!profile.healthScreens,
      mentalHealthScreens: !!profile.mentalHealthScreens,
      consents:
        profile?.consents?.gdpr?.accepted &&
        profile?.consents?.clinical?.accepted,
    };

    const allCompleted = Object.values(completionStatus).every((v) => v);

    res.json({
      ok: true,
      completed: allCompleted,
      completionStatus,
      profile: profile
        ? {
            demographics: profile.demographics,
            selectedGoals: profile.selectedGoals,
            createdAt: profile.createdAt,
          }
        : null,
    });
  } catch (error) {
    logger.error(`Error checking onboarding status: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================================
// PSYCHOLOGY FLOW
// ============================================================================

router.get("/psychology", requireSensitiveConsent, async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const profile = await OnboardingProfile.findOne(
      { userId },
      { psychologyProfile: 1, updatedAt: 1 }
    ).lean();

    if (!profile || !profile.psychologyProfile) {
      return res.json({
        ok: true,
        completed: false,
        psychologyProfile: null,
      });
    }

    return res.json({
      ok: true,
      completed: !!profile.psychologyProfile.completedAt,
      psychologyProfile: profile.psychologyProfile,
      updatedAt: profile.psychologyProfile.completedAt || profile.updatedAt,
    });
  } catch (error) {
    logger.error(`Error fetching psychology onboarding: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/psychology", requireSensitiveConsent, async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const {
      physiology = {},
      sleepChronotype = {},
      comBProfile = {},
      cognitiveDistortions = {},
      stressIndex = {},
      moodBaseline = {},
      habitAdherence = {},
      dopamineReward = {},
      overwhelmThreshold = {},
      responses = {},
    } = req.body || {};

    const errors = [];

    const heightCm = normalizeNumber(physiology.heightCm, {
      min: 90,
      max: 250,
      precision: 1,
    });
    if (heightCm === null) errors.push("physiology.heightCm");

    const weightKg = normalizeNumber(physiology.weightKg, {
      min: 25,
      max: 350,
      precision: 1,
    });
    if (weightKg === null) errors.push("physiology.weightKg");

    const age = normalizeNumber(physiology.age, {
      min: 13,
      max: 120,
      precision: 0,
    });
    if (age === null) errors.push("physiology.age");

    const sexValue = normalizeEnum(
      physiology.sex,
      SEX_OPTIONS,
      "prefer_not_say"
    );
    if (!sexValue) errors.push("physiology.sex");

    const capability = normalizeNumber(comBProfile.capability, {
      min: 0,
      max: 10,
      precision: 1,
    });
    if (capability === null) errors.push("comBProfile.capability");

    const opportunity = normalizeNumber(comBProfile.opportunity, {
      min: 0,
      max: 10,
      precision: 1,
    });
    if (opportunity === null) errors.push("comBProfile.opportunity");

    const motivation = normalizeNumber(comBProfile.motivation, {
      min: 0,
      max: 10,
      precision: 1,
    });
    if (motivation === null) errors.push("comBProfile.motivation");

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: `Missing or invalid fields: ${errors.join(", ")}`,
      });
    }

    const chronotypeType = normalizeEnum(
      sleepChronotype.type,
      CHRONOTYPE_OPTIONS,
      "balanced"
    );
    const chronotypeScore = normalizeNumber(sleepChronotype.chronotypeScore, {
      min: 0,
      max: 100,
      precision: 0,
    });
    const preferredWindow = sleepChronotype?.preferredSleepWindow || {};
    const sleepWindowStart = normalizeTimeValue(
      preferredWindow.start ?? sleepChronotype.sleepStart
    );
    const sleepWindowEnd = normalizeTimeValue(
      preferredWindow.end ?? sleepChronotype.sleepEnd
    );

    const cognitionSeverity = normalizeEnum(
      cognitiveDistortions.severity,
      COGNITIVE_SEVERITY_SELECT,
      "minimal"
    );
    const cognitiveScore = normalizeNumber(cognitiveDistortions.totalScore, {
      min: 0,
      max: 100,
      precision: 0,
    });

    const stressScore = normalizeNumber(stressIndex.score, {
      min: 0,
      max: 100,
      precision: 0,
    });
    const stressSeverity = normalizeEnum(
      stressIndex.severity,
      STRESS_SEVERITY_SELECT,
      "low"
    );
    const regulationCapacity = normalizeNumber(stressIndex.regulationCapacity, {
      min: 0,
      max: 10,
      precision: 1,
    });

    const moodAverage = normalizeNumber(moodBaseline.average, {
      min: 0,
      max: 10,
      precision: 1,
    });
    const moodVariability = normalizeNumber(moodBaseline.variability, {
      min: 0,
      max: 10,
      precision: 1,
    });

    const habitProfile = normalizeEnum(
      habitAdherence.profile,
      HABIT_PROFILE_OPTIONS,
      "balanced"
    );
    const habitScore = normalizeNumber(habitAdherence.adherenceScore, {
      min: 0,
      max: 100,
      precision: 0,
    });
    const habitConsistency = normalizeNumber(habitAdherence.consistency, {
      min: 0,
      max: 10,
      precision: 1,
    });

    const dopamineScore = normalizeNumber(dopamineReward.calibrationScore, {
      min: 0,
      max: 100,
      precision: 0,
    });
    const dopamineSensitivity = normalizeEnum(
      dopamineReward.sensitivityLevel,
      DOPAMINE_SENSITIVITY_OPTIONS,
      "balanced"
    );

    const overwhelmScore = normalizeNumber(overwhelmThreshold.thresholdScore, {
      min: 0,
      max: 100,
      precision: 0,
    });
    const overwhelmRisk = normalizeEnum(
      overwhelmThreshold.riskLevel,
      OVERWHELM_RISK_OPTIONS,
      "steady"
    );

    const bmi = calculateBmi(heightCm, weightKg);

    const psychologyProfile = {
      physiology: {
        heightCm,
        weightKg,
        age,
        sex: sexValue,
        bmi,
        notes: normalizeString(physiology.notes),
      },
      sleepChronotype: {
        type: chronotypeType,
        chronotypeScore,
        preferredSleepWindow: {
          start: sleepWindowStart,
          end: sleepWindowEnd,
        },
        wakeTime: normalizeTimeValue(
          sleepChronotype.wakeTime ?? sleepChronotype.targetWakeTime
        ),
        windDownTime: normalizeTimeValue(
          sleepChronotype.windDownTime ?? sleepChronotype.targetWindDown
        ),
        notes: normalizeString(sleepChronotype.notes),
      },
      comBProfile: {
        capability,
        opportunity,
        motivation,
        limitingBeliefs: normalizeStringArray(comBProfile.limitingBeliefs),
        accelerators: normalizeStringArray(comBProfile.accelerators),
        frictionPoints: normalizeStringArray(comBProfile.frictionPoints),
        narrativeSummary: normalizeString(comBProfile.narrativeSummary),
      },
      cognitiveDistortions: {
        totalScore: cognitiveScore,
        severity: cognitionSeverity,
        endorsedPatterns: normalizeStringArray(
          cognitiveDistortions.endorsedPatterns
        ),
        copingStatements: normalizeStringArray(
          cognitiveDistortions.copingStatements
        ),
        notes: normalizeString(cognitiveDistortions.notes),
      },
      stressIndex: {
        score: stressScore,
        severity: stressSeverity,
        topTriggers: normalizeStringArray(stressIndex.topTriggers),
        regulationCapacity,
        recoveryAssets: normalizeStringArray(stressIndex.recoveryAssets),
        notes: normalizeString(stressIndex.notes),
      },
      moodBaseline: {
        average: moodAverage,
        variability: moodVariability,
        descriptors: normalizeStringArray(moodBaseline.descriptors),
        supportiveFactors: normalizeStringArray(moodBaseline.supportiveFactors),
        challengeAreas: normalizeStringArray(moodBaseline.challengeAreas),
        notes: normalizeString(moodBaseline.notes),
      },
      habitAdherence: {
        profile: habitProfile,
        adherenceScore: habitScore,
        consistency: habitConsistency,
        frictionPoints: normalizeStringArray(habitAdherence.frictionPoints),
        enablingFactors: normalizeStringArray(habitAdherence.enablingFactors),
        notes: normalizeString(habitAdherence.notes),
      },
      dopamineReward: {
        calibrationScore: dopamineScore,
        sensitivityLevel: dopamineSensitivity,
        rewardDrivers: normalizeStringArray(dopamineReward.rewardDrivers),
        cautionFlags: normalizeStringArray(dopamineReward.cautionFlags),
        notes: normalizeString(dopamineReward.notes),
      },
      overwhelmThreshold: {
        thresholdScore: overwhelmScore,
        riskLevel: overwhelmRisk,
        earlySignals: normalizeStringArray(overwhelmThreshold.earlySignals),
        recoveryStrategies: normalizeStringArray(
          overwhelmThreshold.recoveryStrategies
        ),
        notes: normalizeString(overwhelmThreshold.notes),
      },
      responses: responses && typeof responses === "object" ? responses : {},
      completedAt: new Date(),
    };

    let profile = await OnboardingProfile.findOne({ userId });
    if (!profile) {
      profile = new OnboardingProfile({ userId });
    }

    profile.psychologyProfile = psychologyProfile;
    if (heightCm !== null) profile.heightCm = heightCm;
    if (weightKg !== null) profile.weightKg = weightKg;
    if (age !== null) profile.age = age;
    if (sexValue) profile.sex = sexValue;

    if (!profile.demographics) {
      profile.demographics = {};
    }
    if (age !== null) {
      profile.demographics.age = age;
    }
    const sexLabel = SEX_OPTIONS.find((item) => item.value === sexValue)?.label;
    if (sexLabel) {
      profile.demographics.gender = sexLabel;
    }

    await profile.save();

    await User.findByIdAndUpdate(userId, {
      $set: {
        psychologyProfile,
      },
    });

    const memory = await loadMemory(userId);
    memory.psychologyProfile = psychologyProfile;
    memory.onboarding = memory.onboarding || {};
    memory.onboarding.psychologyProfile = psychologyProfile;
    await saveMemory(userId, memory);

    logger.info(`Psychology onboarding flow captured for ${userId}`);

    return res.json({
      ok: true,
      psychologyProfile,
    });
  } catch (error) {
    logger.error(`Error saving psychology onboarding: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================================
// COMPLETE ONBOARDING
// ============================================================================

/**
 * POST /api/onboarding/complete
 *
 * Body: {
 *   demographics: {
 *     age: 28,
 *     gender: 'Male',
 *     location: 'United States',
 *     timezone: 'UTC-5'
 *   },
 *   selectedGoals: [
 *     { pillar: 'sleep', goal: 'Establish consistent sleep schedule' },
 *     { pillar: 'fitness', goal: 'Build muscle strength' },
 *     { pillar: 'mental-health', goal: 'Reduce anxiety' }
 *   ],
 *   healthScreens: {
 *     overall_health: 3,
 *     chronic_conditions: false,
 *     medications: true,
 *     exercise_frequency: '1-2x'
 *   },
 *   mentalHealthScreens: {
 *     depression: [2, 1, 2, 2],
 *     anxiety: [3, 2, 3, 2],
 *     stress: [6, 3, 4, 2]
 *   }
 * }
 */
router.post("/complete", requireSensitiveConsent, async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const {
      demographics,
      selectedGoals,
      healthScreens,
      mentalHealthScreens,
      assessments,
      consents,
    } = req.body;

    // Validate input
    if (!demographics || !selectedGoals || !healthScreens) {
      return res.status(400).json({
        ok: false,
        error: "demographics, selectedGoals, and healthScreens required",
      });
    }

    if (!Array.isArray(selectedGoals) || selectedGoals.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "selectedGoals must be non-empty array",
      });
    }

    if (!consents?.gdpr?.accepted || !consents?.clinical?.accepted) {
      return res.status(400).json({
        ok: false,
        error: "GDPR and clinical acknowledgements are required",
      });
    }

    const normalizedConsents = normalizeConsentSnapshot(consents);

    // Create or update onboarding profile
    let profile = await OnboardingProfile.findOne({ userId });

    if (!profile) {
      profile = new OnboardingProfile({ userId });
    }

    profile.demographics = demographics;
    profile.selectedGoals = selectedGoals;
    profile.healthScreens = healthScreens;
    profile.mentalHealthScreens = mentalHealthScreens;
    profile.consents = normalizedConsents;
    profile.assessments = {
      responses: assessments?.responses || {},
      results: assessments?.results || {},
    };
    profile.completedAt = new Date();

    await profile.save();

    // Update user model
    await User.findByIdAndUpdate(userId, {
      demographics,
      primaryPillars: selectedGoals.map((g) => g.pillar),
      onboardingCompleted: true,
      aiConsent: true,
      consentTimestamp: normalizedConsents.gdpr.timestamp,
      consentVersion: normalizedConsents.gdpr.version,
      consents: normalizedConsents,
      assessments: assessments?.results || {},
    });

    // Load and update memory
    const memory = await loadMemory(userId);
    const existingOnboardingState = memory.onboarding || {};
    memory.onboarding = {
      ...existingOnboardingState,
      completed: true,
      demographics,
      selectedGoals,
      healthScreens,
      mentalHealthScreens,
      consents: normalizedConsents,
      assessments: profile.assessments,
      completedAt: new Date(),
    };
    if (profile.psychologyProfile) {
      memory.onboarding.psychologyProfile = profile.psychologyProfile;
    }
    await saveMemory(userId, memory);

    logger.info(`Onboarding completed for ${userId}`);

    res.json({
      ok: true,
      message: "Onboarding completed successfully!",
      profile: {
        userId,
        demographics,
        selectedGoals,
        completedAt: profile.completedAt,
        consents: normalizedConsents,
        assessments: profile.assessments?.results || {},
      },
    });
  } catch (error) {
    logger.error(`Error completing onboarding: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
