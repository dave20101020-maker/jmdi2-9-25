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
    memory.onboarding = {
      completed: true,
      demographics,
      selectedGoals,
      healthScreens,
      mentalHealthScreens,
      consents: normalizedConsents,
      assessments: profile.assessments,
      completedAt: new Date(),
    };
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
