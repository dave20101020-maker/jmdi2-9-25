/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: User Tone & Preferences Profiler
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Analyzes user communication style during onboarding and creates a personality
 * profile to personalize future AI coaching interactions.
 * 
 * Features:
 * - Analyze written responses for tone (formal/casual, direct/indirect)
 * - Identify communication preferences (emoji usage, detail level)
 * - Detect motivational style (encouragement, challenge, accountability)
 * - Create personality profile stored in user document
 * - Use profile to customize AI responses in future interactions
 * - Periodic re-profiling to track preference changes
 */

import User from "../models/User.js";
import Entry from "../models/Entry.js";
import { openaiClient } from "../config/openai.js";

// Tone analysis keywords and patterns
const toneAnalyzers = {
  formality: {
    formal: [
      "sir",
      "madam",
      "would",
      "prefer",
      "thoroughly",
      "furthermore",
      "please",
    ],
    casual: [
      "hey",
      "yeah",
      "gonna",
      "wanna",
      "cool",
      "awesome",
      "lol",
      "haha",
    ],
    neutral: ["yes", "okay", "thanks", "sounds good"],
  },

  directness: {
    direct: ["I need", "I want", "Must", "Do", "Change", "Fix"],
    indirect: [
      "Maybe",
      "Might",
      "Could",
      "Perhaps",
      "Would prefer",
      "If possible",
    ],
    moderate: ["Should", "Try", "Consider", "Plan", "Work on"],
  },

  emotionality: {
    high: ["love", "hate", "amazing", "terrible", "excited", "devastated", "!"],
    low: ["fine", "okay", "acceptable", "understandable", "reasonable"],
    moderate: ["good", "bad", "interesting", "concerning"],
  },

  motivationalStyle: {
    encouragement: [
      "can do",
      "believe in",
      "proud",
      "support",
      "together",
      "help",
    ],
    challenge: ["beat", "compete", "win", "strong", "tough", "push"],
    accountability: [
      "track",
      "measure",
      "goals",
      "results",
      "progress",
      "metrics",
    ],
    autonomy: ["independent", "freedom", "self", "own", "decide", "choice"],
  },

  detailPreference: {
    high: /(\banalyze\b|\bdetailed\b|\bstep-by-step\b|\bnumbers\b|\bdata\b)/i,
    low: /(\bsummary\b|\bquick\b|\bsimple\b|\bgist\b|\boverview\b)/i,
    moderate: /(\bbalanced\b|\breasonable\b|\bpractical\b)/i,
  },

  emojiPreference: {
    high: /😊|🎉|💪|😄|❤️|🚀|⭐|👍/gi,
    none: /^[^\u1F300-\u1F9FF]*$/,
  },
};

/**
 * Analyze user responses for communication style
 * @param {Array<string>} responses - User's onboarding responses
 * @returns {Object} Tone analysis scores (0-100)
 */
export function analyzeTone(responses) {
  const combinedText = responses.join(" ").toLowerCase();
  const wordCount = combinedText.split(/\s+/).length;

  const scores = {
    formality: analyzeScore(
      combinedText,
      toneAnalyzers.formality.formal,
      toneAnalyzers.formality.casual
    ),
    directness: analyzeScore(
      combinedText,
      toneAnalyzers.directness.direct,
      toneAnalyzers.directness.indirect
    ),
    emotionality: analyzeScore(
      combinedText,
      toneAnalyzers.emotionality.high,
      toneAnalyzers.emotionality.low
    ),
    motivationalStyle: {
      encouragement: calculateKeywordDensity(
        combinedText,
        toneAnalyzers.motivationalStyle.encouragement,
        wordCount
      ),
      challenge: calculateKeywordDensity(
        combinedText,
        toneAnalyzers.motivationalStyle.challenge,
        wordCount
      ),
      accountability: calculateKeywordDensity(
        combinedText,
        toneAnalyzers.motivationalStyle.accountability,
        wordCount
      ),
      autonomy: calculateKeywordDensity(
        combinedText,
        toneAnalyzers.motivationalStyle.autonomy,
        wordCount
      ),
    },
    detailPreference:
      calculateDetailPreference(combinedText) || "moderate",
    emojiUsage:
      (combinedText.match(toneAnalyzers.emojiPreference.high) || []).length > 2
        ? "high"
        : (combinedText.match(toneAnalyzers.emojiPreference.high) || []).length >
            0
          ? "moderate"
          : "none",
    responseLength:
      wordCount > 500
        ? "detailed"
        : wordCount > 100
          ? "moderate"
          : "brief",
    sentenceAveragLength: wordCount / (combinedText.split(/[.!?]+/).length - 1),
  };

  return scores;
}

/**
 * Calculate score between two keyword groups (e.g., formal vs casual)
 * Higher = more formal/direct/emotional, Lower = opposite
 * @param {string} text - Text to analyze
 * @param {Array} positiveKeywords - Keywords indicating higher score
 * @param {Array} negativeKeywords - Keywords indicating lower score
 * @returns {number} Score 0-100
 */
function analyzeScore(text, positiveKeywords, negativeKeywords) {
  const positiveMatches = positiveKeywords.filter((kw) =>
    text.includes(kw)
  ).length;
  const negativeMatches = negativeKeywords.filter((kw) =>
    text.includes(kw)
  ).length;
  const total = positiveMatches + negativeMatches;

  if (total === 0) return 50; // Neutral if no matches
  return Math.round((positiveMatches / total) * 100);
}

/**
 * Calculate keyword density in text
 * @param {string} text - Text to analyze
 * @param {Array} keywords - Keywords to search for
 * @param {number} totalWords - Total word count
 * @returns {number} Score 0-100
 */
function calculateKeywordDensity(text, keywords, totalWords) {
  const matches = keywords.filter((kw) => text.includes(kw)).length;
  if (totalWords === 0) return 0;
  return Math.min(Math.round((matches / totalWords) * 10000), 100);
}

/**
 * Calculate detail preference from text patterns
 * @param {string} text - Text to analyze
 * @returns {string} 'high', 'low', or 'moderate'
 */
function calculateDetailPreference(text) {
  const highMatches = (text.match(toneAnalyzers.detailPreference.high) || [])
    .length;
  const lowMatches = (text.match(toneAnalyzers.detailPreference.low) || [])
    .length;

  if (highMatches > lowMatches) return "high";
  if (lowMatches > highMatches) return "low";
  return "moderate";
}

/**
 * Generate user personality profile from tone analysis
 * @param {string} userId - User ID
 * @param {Object} toneAnalysis - Tone analysis results
 * @returns {Promise<Object>} Personality profile
 */
export async function generatePersonalityProfile(userId, toneAnalysis) {
  // Determine primary communication style
  const primaryStyle =
    toneAnalysis.formality > 70
      ? "formal"
      : toneAnalysis.formality < 30
        ? "casual"
        : "balanced";

  const primaryDirectness =
    toneAnalysis.directness > 70
      ? "direct"
      : toneAnalysis.directness < 30
        ? "indirect"
        : "balanced";

  // Find strongest motivational driver
  const motivationScores = Object.entries(
    toneAnalysis.motivationalStyle
  ).map(([style, score]) => ({ style, score }));
  motivationScores.sort((a, b) => b.score - a.score);
  const primaryMotivation = motivationScores[0];

  // Use AI to generate profile summary
  const profileSummary = await generateProfileSummary(
    toneAnalysis,
    primaryStyle,
    primaryDirectness,
    primaryMotivation
  );

  return {
    userId,
    generatedAt: new Date(),
    communicationStyle: {
      formality: primaryStyle,
      formalityScore: toneAnalysis.formality,
      directness: primaryDirectness,
      directnessScore: toneAnalysis.directness,
      emotionality: toneAnalysis.emotionality,
      detailPreference: toneAnalysis.detailPreference,
      emojiUsage: toneAnalysis.emojiUsage,
      responseLength: toneAnalysis.responseLength,
    },
    motivationalProfile: {
      primaryStyle: primaryMotivation.style,
      primaryScore: primaryMotivation.score,
      allScores: {
        encouragement: toneAnalysis.motivationalStyle.encouragement,
        challenge: toneAnalysis.motivationalStyle.challenge,
        accountability: toneAnalysis.motivationalStyle.accountability,
        autonomy: toneAnalysis.motivationalStyle.autonomy,
      },
    },
    aiResponseRecommendations: {
      tone: primaryStyle === "formal" ? "Professional, structured" : "Friendly, conversational",
      directness:
        primaryDirectness === "direct"
          ? "Direct action items, clear goals"
          : "Gentle suggestions, options provided",
      motivationApproach:
        primaryMotivation.score > 30
          ? `Use ${primaryMotivation.style}: ${getMotivationStrategy(primaryMotivation.style)}`
          : "Balanced approach across motivational styles",
      detailLevel:
        toneAnalysis.detailPreference === "high"
          ? "Provide detailed breakdowns, data, steps"
          : toneAnalysis.detailPreference === "low"
            ? "Keep concise, bullet points, summaries"
            : "Balanced: overview with optional details",
      emojiRecommendation:
        toneAnalysis.emojiUsage === "high"
          ? "Use relevant emojis frequently"
          : toneAnalysis.emojiUsage === "moderate"
            ? "Use emojis occasionally for emphasis"
            : "Minimal emoji usage, focus on text",
      sentenceStructure:
        toneAnalysis.sentenceAveragLength > 15
          ? "Complex sentences acceptable, detailed explanations"
          : "Short, punchy sentences, easy scanning",
    },
    profileSummary,
    version: 1,
  };
}

/**
 * Generate AI-readable profile summary
 * @returns {Promise<string>} Profile summary
 */
async function generateProfileSummary(toneAnalysis, style, directness, motivation) {
  const prompt = `
Based on this tone analysis:
- Communication style: ${style} (formality: ${toneAnalysis.formality})
- Directness: ${directness}
- Emotionality: ${toneAnalysis.emotionality}
- Primary motivation: ${motivation.style}
- Detail preference: ${toneAnalysis.detailPreference}
- Emoji usage: ${toneAnalysis.emojiUsage}
- Response length: ${toneAnalysis.responseLength}

Generate a 2-3 sentence personality profile for an AI coaching assistant to understand how to best communicate with this user. 
Focus on their preferred communication style and what will resonate most with them.
Be insightful but practical.
  `;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in communication psychology. Generate brief, accurate personality profiles.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating profile summary:", error);
    return "User with " + style + " communication style.";
  }
}

/**
 * Get motivation strategy description
 * @param {string} style - Motivation style
 * @returns {string} Strategy description
 */
function getMotivationStrategy(style) {
  const strategies = {
    encouragement:
      "Provide positive reinforcement, celebrate small wins, emphasize progress",
    challenge: "Frame goals as challenges, compare progress, highlight achievements",
    accountability:
      "Share metrics, track progress visibly, create measurable goals",
    autonomy: "Provide options, let user decide approach, minimize micromanagement",
  };
  return strategies[style] || "Balanced approach";
}

/**
 * Store personality profile in user document
 * @param {string} userId - User ID
 * @param {Object} profile - Personality profile
 * @returns {Promise<Object>} Updated user
 */
export async function storePersonalityProfile(userId, profile) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        "profile.personalityProfile": profile,
        "profile.aiCommunicationPreferences": profile.aiResponseRecommendations,
        "profile.profileGeneratedAt": new Date(),
      },
      { new: true }
    );

    // Store as Entry for history
    await Entry.create({
      userId,
      pillar: "profile",
      type: "personality-profile",
      content: `User personality profile generated: ${profile.communicationStyle.formality} communicator, ${profile.motivationalProfile.primaryStyle}-oriented`,
      score: 100,
      data: profile,
    });

    return user;
  } catch (error) {
    console.error("Error storing personality profile:", error);
    throw error;
  }
}

/**
 * Get user's personality profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's personality profile
 */
export async function getPersonalityProfile(userId) {
  try {
    const user = await User.findById(userId);
    return user?.profile?.personalityProfile || null;
  } catch (error) {
    console.error("Error retrieving personality profile:", error);
    return null;
  }
}

/**
 * Use personality profile to customize AI response
 * @param {string} userId - User ID
 * @param {string} baseResponse - Original AI response
 * @returns {Promise<string>} Customized response
 */
export async function customizeResponseWithProfile(userId, baseResponse) {
  try {
    const profile = await getPersonalityProfile(userId);
    if (!profile) return baseResponse;

    const preferences = profile.aiResponseRecommendations;

    // Customize based on preferences
    let customized = baseResponse;

    // Add/remove emojis
    if (preferences.emojiRecommendation === "Minimal emoji usage, focus on text") {
      customized = customized.replace(/[^\w\s.!?,;:/\-–—\n]/g, " ");
    } else if (
      preferences.emojiRecommendation === "Use relevant emojis frequently"
    ) {
      // Could inject relevant emojis here
    }

    // Adjust length if needed
    if (
      preferences.detailLevel.includes("concise") ||
      preferences.detailLevel.includes("Minimal")
    ) {
      // Shorten if too long
      if (customized.length > 1000) {
        customized = customized.substring(0, 800) + "...";
      }
    }

    return customized;
  } catch (error) {
    console.error("Error customizing response:", error);
    return baseResponse;
  }
}

/**
 * Analyze response to see if tone preferences are being met
 * @param {string} userId - User ID
 * @param {string} userFeedback - Feedback score or text
 * @returns {Promise<Object>} Feedback analysis
 */
export async function analyzeFeedbackAgainstProfile(userId, userFeedback) {
  try {
    const profile = await getPersonalityProfile(userId);
    if (!profile) return null;

    // Simple analysis: if feedback is negative, note for future customization
    const sentiment =
      userFeedback.includes("helpful") ||
      userFeedback.includes("good") ||
      userFeedback.includes("thanks")
        ? "positive"
        : userFeedback.includes("confusing") ||
            userFeedback.includes("unclear")
          ? "negative"
          : "neutral";

    return {
      userId,
      sentiment,
      profileAlignment: sentiment === "positive",
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error analyzing feedback:", error);
    return null;
  }
}

export default {
  analyzeTone,
  generatePersonalityProfile,
  storePersonalityProfile,
  getPersonalityProfile,
  customizeResponseWithProfile,
  analyzeFeedbackAgainstProfile,
};
