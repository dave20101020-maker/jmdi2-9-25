/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: AI-Generated Onboarding Instructions Based on Pillar Weaknesses
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Analyzes user pillar weaknesses during onboarding and generates personalized
 * AI-guided instructions to help users focus on weak areas first.
 * 
 * Features:
 * - Analyze initial pillar assessment scores
 * - Identify 1-3 weakest pillars (< 5/10 score)
 * - Generate personalized instructions per weak pillar
 * - Create focused habit recommendations
 * - Provide pillar-specific resources and guides
 * - Store in user profile for reference
 */

import User from "../models/User.js";
import Entry from "../models/Entry.js";
import { openaiClient } from "../config/openai.js";

// Pillar context for detailed instructions
const pillarContexts = {
  sleep: {
    label: "Sleep & Recovery",
    emoji: "🌙",
    weaknessSignals: ["irregular sleep", "late nights", "poor sleep quality"],
    resources: [
      "Sleep hygiene guide",
      "Circadian rhythm optimization",
      "Bedtime routine templates",
      "Sleep tracking tips",
    ],
    urgency: "high", // Sleep is foundational
  },
  diet: {
    label: "Nutrition & Diet",
    emoji: "🥗",
    weaknessSignals: [
      "irregular meals",
      "poor nutrition",
      "emotional eating",
    ],
    resources: [
      "Balanced meal planning",
      "Nutrition basics",
      "Grocery shopping guide",
      "Hydration tracking",
    ],
    urgency: "high",
  },
  exercise: {
    label: "Exercise & Fitness",
    emoji: "🏃",
    weaknessSignals: [
      "sedentary lifestyle",
      "low fitness",
      "no exercise routine",
    ],
    resources: [
      "Beginner fitness routines",
      "Home workout guides",
      "Form and safety tips",
      "Progressive training",
    ],
    urgency: "high",
  },
  physical: {
    label: "Physical Health",
    emoji: "❤️",
    weaknessSignals: [
      "chronic pain",
      "health issues",
      "poor posture",
    ],
    resources: [
      "Preventive health guide",
      "Posture improvement",
      "Pain management",
      "Doctor visit checklist",
    ],
    urgency: "medium",
  },
  mental: {
    label: "Mental & Emotional Health",
    emoji: "🧘",
    weaknessSignals: ["stress", "anxiety", "depression", "mood swings"],
    resources: [
      "Stress management techniques",
      "Mindfulness and meditation",
      "Emotional regulation",
      "When to seek professional help",
    ],
    urgency: "high",
  },
  finances: {
    label: "Financial Wellness",
    emoji: "💰",
    weaknessSignals: ["debt", "no budget", "financial stress"],
    resources: [
      "Basic budgeting",
      "Debt management",
      "Saving strategies",
      "Financial goal setting",
    ],
    urgency: "medium",
  },
  social: {
    label: "Social Connections",
    emoji: "🤝",
    weaknessSignals: ["isolation", "no support network", "poor relationships"],
    resources: [
      "Building relationships",
      "Communication skills",
      "Community involvement",
      "Support group resources",
    ],
    urgency: "medium",
  },
  spirit: {
    label: "Spirituality & Purpose",
    emoji: "✨",
    weaknessSignals: ["lack of purpose", "no meaning", "directionless"],
    resources: [
      "Purpose discovery",
      "Values clarification",
      "Mindfulness practices",
      "Gratitude and reflection",
    ],
    urgency: "low",
  },
};

/**
 * Analyze onboarding pillar assessment and identify weaknesses
 * @param {Object} pillarAssessment - User's initial pillar scores {pillar: score}
 * @returns {Array} Sorted array of weak pillars with context
 */
export async function identifyWeakPillars(pillarAssessment) {
  const weakPillars = [];

  for (const [pillar, score] of Object.entries(pillarAssessment)) {
    if (score < 5) {
      weakPillars.push({
        pillar,
        score,
        context: pillarContexts[pillar],
        severity: score < 3 ? "critical" : "significant",
      });
    }
  }

  // Sort by severity, then score (lowest first)
  weakPillars.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "critical" ? -1 : 1;
    }
    return a.score - b.score;
  });

  return weakPillars.slice(0, 3); // Top 3 weak pillars
}

/**
 * Generate personalized onboarding instructions for a weak pillar
 * @param {Object} weakPillar - Weak pillar object
 * @param {Object} userProfile - User's background info
 * @returns {Promise<Object>} Generated instructions
 */
export async function generatePillarInstructions(weakPillar, userProfile) {
  const { pillar, context, severity } = weakPillar;

  // Build detailed prompt for GPT
  const instructionPrompt = `
You are an expert wellness coach specializing in ${context.label}.

The user has indicated their ${context.label} score is ${weakPillar.score}/10 (${severity} weakness).
User profile: 
- Age: ${userProfile.age || "not specified"}
- Lifestyle: ${userProfile.lifestyle || "not specified"}
- Challenges: ${userProfile.challenges || "not specified"}
- Goals: ${userProfile.goals || "not specified"}
- Available resources: ${userProfile.availableResources || "not specified"}

Generate a personalized onboarding instruction plan for this user with:

1. **Understanding the Weakness**: 2-3 sentences explaining why this might be challenging for them
2. **Quick Wins**: 3 small, achievable actions they can do in the next 24-48 hours
3. **Foundation Building**: 5 core habits to establish over the next 2-4 weeks
4. **Common Obstacles**: 3 common obstacles they might face and how to overcome them
5. **Success Metrics**: 2-3 ways to track progress in this pillar
6. **Resources**: Recommended resources from: ${context.resources.join(", ")}

Keep language encouraging, practical, and specific to their situation.
Format as a structured guide they can reference during onboarding.
  `;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert wellness onboarding specialist. Provide detailed, personalized, 
          and encouraging instruction plans for users weak in specific wellness pillars. Be specific 
          and actionable. Consider their lifestyle and constraints.`,
        },
        {
          role: "user",
          content: instructionPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1200,
    });

    const instructions = response.choices[0].message.content;

    return {
      pillar,
      label: context.label,
      emoji: context.emoji,
      score: weakPillar.score,
      severity,
      urgency: context.urgency,
      instructions,
      generatedAt: new Date(),
      model: "gpt-4-turbo",
    };
  } catch (error) {
    console.error(`Error generating instructions for ${pillar}:`, error);
    return {
      pillar,
      label: context.label,
      emoji: context.emoji,
      score: weakPillar.score,
      severity,
      urgency: context.urgency,
      instructions: `Please consult with a wellness professional for ${context.label}.`,
      error: true,
    };
  }
}

/**
 * Generate complete onboarding plan for user
 * @param {string} userId - User ID
 * @param {Object} onboardingData - {pillarAssessment, userProfile}
 * @returns {Promise<Object>} Complete onboarding plan
 */
export async function generateOnboardingPlan(userId, onboardingData) {
  const { pillarAssessment, userProfile } = onboardingData;

  // Identify weakest pillars
  const weakPillars = await identifyWeakPillars(pillarAssessment);

  if (weakPillars.length === 0) {
    return {
      userId,
      message: "Excellent! Your pillars are well-balanced. Focus on maintenance.",
      weakPillars: [],
      instructions: [],
      recommendations: [],
    };
  }

  // Generate instructions for each weak pillar
  const instructions = [];
  for (const weakPillar of weakPillars) {
    const pillarInstructions = await generatePillarInstructions(
      weakPillar,
      userProfile
    );
    instructions.push(pillarInstructions);
  }

  // Generate overall strategy
  const overallStrategy = await generateOverallStrategy(
    weakPillars,
    instructions,
    userProfile
  );

  return {
    userId,
    generatedAt: new Date(),
    pillarAssessment,
    weakPillars: weakPillars.map((p) => ({
      pillar: p.pillar,
      score: p.score,
      severity: p.severity,
      urgency: p.context.urgency,
    })),
    instructions,
    overallStrategy,
    recommendations: generateRecommendations(weakPillars),
  };
}

/**
 * Generate overall strategy for addressing all weak pillars
 * @param {Array} weakPillars - Array of weak pillars
 * @param {Array} instructions - Generated instructions per pillar
 * @param {Object} userProfile - User profile
 * @returns {Promise<string>} Overall strategy text
 */
async function generateOverallStrategy(weakPillars, instructions, userProfile) {
  const pillarsSummary = weakPillars
    .map(
      (p) =>
        `${p.context.emoji} ${p.context.label} (${p.score}/10 - ${p.severity})`
    )
    .join("\n");

  const strategyPrompt = `
Given that a user has the following pillar weaknesses:
${pillarsSummary}

Generate a prioritized strategy that:
1. Addresses critical/significant weaknesses first (prioritization)
2. Identifies interdependencies (e.g., better sleep → better exercise capability)
3. Recommends weekly milestones for the first 4 weeks
4. Suggests starting with 1-2 pillars, then adding others
5. Balances improvement with preventing overwhelm

User context: ${userProfile.lifestyle || "standard"}
Tone: Encouraging, realistic, achievable

Keep it to 300-400 words max.
  `;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert wellness strategist. Create holistic, prioritized plans that address multiple weakness areas effectively.",
        },
        {
          role: "user",
          content: strategyPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating overall strategy:", error);
    return "Focus on the highest urgency pillars first, then gradually expand.";
  }
}

/**
 * Generate specific recommendations based on weak pillars
 * @param {Array} weakPillars - Array of weak pillars
 * @returns {Array} Recommendations
 */
function generateRecommendations(weakPillars) {
  const recommendations = [];

  for (const pillar of weakPillars) {
    const context = pillarContexts[pillar.pillar];

    if (context.urgency === "high") {
      recommendations.push({
        priority: "HIGH",
        pillar: pillar.pillar,
        label: context.label,
        action: `Start with ${context.label}. Your score is ${pillar.score}/10.`,
        suggestedActions: [
          "Use micro-actions for quick momentum",
          "Schedule a daily habit for this pillar",
          "Set a reminder for consistency",
        ],
      });
    }
  }

  // Add dependent habit suggestions
  const hasSleepIssue = weakPillars.some((p) => p.pillar === "sleep");
  if (hasSleepIssue) {
    recommendations.push({
      priority: "STRATEGY",
      note: "Improving sleep will boost other pillars (exercise, mental health, diet)",
    });
  }

  return recommendations;
}

/**
 * Store onboarding plan in user profile
 * @param {string} userId - User ID
 * @param {Object} plan - Onboarding plan
 * @returns {Promise<Object>} Updated user
 */
export async function storeOnboardingPlan(userId, plan) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        "profile.onboardingPlan": plan,
        "profile.onboardingCompleted": true,
        "profile.planGeneratedAt": new Date(),
      },
      { new: true }
    );

    // Also store as Entry for history
    await Entry.create({
      userId,
      pillar: "onboarding",
      type: "onboarding-plan",
      content: `Onboarding plan generated for weak pillars: ${plan.weakPillars
        .map((p) => p.pillar)
        .join(", ")}`,
      score: 100,
      data: plan,
    });

    return user;
  } catch (error) {
    console.error("Error storing onboarding plan:", error);
    throw error;
  }
}

/**
 * Get onboarding plan for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's onboarding plan
 */
export async function getOnboardingPlan(userId) {
  try {
    const user = await User.findById(userId);
    return user?.profile?.onboardingPlan || null;
  } catch (error) {
    console.error("Error retrieving onboarding plan:", error);
    return null;
  }
}

/**
 * Get all weak pillar instructions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of instructions
 */
export async function getWeakPillarInstructions(userId) {
  try {
    const plan = await getOnboardingPlan(userId);
    return plan?.instructions || [];
  } catch (error) {
    console.error("Error retrieving instructions:", error);
    return [];
  }
}

export default {
  identifyWeakPillars,
  generatePillarInstructions,
  generateOnboardingPlan,
  storeOnboardingPlan,
  getOnboardingPlan,
  getWeakPillarInstructions,
};
