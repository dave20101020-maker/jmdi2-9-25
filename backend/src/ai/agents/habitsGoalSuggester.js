/**
 * Habit & Goal Suggestion System
 *
 * AI analyzes screening scores and weak pillars
 * Suggests new habits or goals automatically
 * Scoring system rates suggestions by relevance and difficulty
 *
 * File: backend/src/ai/agents/habitsGoalSuggester.js
 */

import OpenAI from "openai";
import PillarScore from "../../models/PillarScore.js";
import Habit from "../../models/Habit.js";
import Entry from "../../models/Entry.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Suggestion scoring criteria:
 * - Relevance (1-10): How well does this address the user's weak areas?
 * - Difficulty (1-10): How hard is it to start? (lower = easier to start)
 * - Impact (1-10): How much will this improve their scores?
 * - Feasibility (1-10): Is this realistic given their current habits?
 *
 * Final Score = (Relevance * 0.3) + (Impact * 0.3) + ((10 - Difficulty) * 0.2) + (Feasibility * 0.2)
 */

const suggestedHabits = {
  sleep: [
    {
      name: "Consistent Sleep Schedule",
      description: "Sleep and wake at the same time every day, even weekends",
      relevance: 9,
      difficulty: 7,
      impact: 9,
      feasibility: 6,
      duration: "30 days",
      steps: [
        "Pick a bedtime based on when you need to wake",
        "Stick to it for 14 days minimum",
        "Your body will adjust and sleep will improve",
      ],
    },
    {
      name: "Sleep Hygiene Routine",
      description: "Create a 30-minute wind-down routine before bed",
      relevance: 9,
      difficulty: 5,
      impact: 8,
      feasibility: 8,
      duration: "14 days",
      steps: [
        "Choose 3 relaxing activities (reading, stretching, meditation)",
        "Start 30 minutes before desired bedtime",
        "Exclude screens, caffeine, heavy meals",
      ],
    },
    {
      name: "No Screens Before Bed",
      description:
        "Stop using phones, tablets, and computers 1 hour before sleep",
      relevance: 8,
      difficulty: 6,
      impact: 7,
      feasibility: 7,
      duration: "21 days",
      steps: [
        "Put all devices in another room at bedtime - 60min",
        "Use an alarm clock instead of phone",
        "Read or journal instead",
      ],
    },
  ],
  diet: [
    {
      name: "Hydration Habit",
      description: "Drink 8 glasses of water per day",
      relevance: 8,
      difficulty: 3,
      impact: 7,
      feasibility: 9,
      duration: "7 days",
      steps: [
        "Get a water bottle you like",
        "Drink one glass with each meal",
        "Drink before, during, and after exercise",
      ],
    },
    {
      name: "Meal Prep Sunday",
      description: "Prepare 3 healthy meals every Sunday for the week",
      relevance: 8,
      difficulty: 7,
      impact: 9,
      feasibility: 7,
      duration: "30 days",
      steps: [
        "Choose 3 recipes you enjoy",
        "Grocery shop Saturday",
        "Spend 2-3 hours cooking Sunday",
        "Store in containers in fridge",
      ],
    },
    {
      name: "Vegetables with Every Meal",
      description: "Include vegetables in breakfast, lunch, and dinner",
      relevance: 8,
      difficulty: 4,
      impact: 8,
      feasibility: 8,
      duration: "14 days",
      steps: [
        "Identify 5 vegetables you enjoy",
        "Keep them prepped and visible in fridge",
        "Add to every meal automatically",
      ],
    },
  ],
  exercise: [
    {
      name: "Daily 30-Minute Walk",
      description: "Go for a 30-minute walk, outdoors preferred",
      relevance: 8,
      difficulty: 3,
      impact: 8,
      feasibility: 9,
      duration: "30 days",
      steps: [
        "Pick a time that works (morning or evening)",
        "Pick a route you enjoy",
        "Add music or podcast if desired",
      ],
    },
    {
      name: "Strength Training 3x/Week",
      description: "Do 20-30 minute strength workouts 3 times per week",
      relevance: 7,
      difficulty: 6,
      impact: 9,
      feasibility: 6,
      duration: "30 days",
      steps: [
        "Choose bodyweight, weights, or gym",
        "Pick 3 exercises (squats, push-ups, rows)",
        "Do 3 sets of 8-12 reps each",
      ],
    },
    {
      name: "Stretching Routine",
      description: "Stretch for 10 minutes daily to improve flexibility",
      relevance: 7,
      difficulty: 2,
      impact: 6,
      feasibility: 9,
      duration: "21 days",
      steps: [
        "Learn 10 basic stretches (yoga is great)",
        "Do them after exercise or before bed",
        "Hold each stretch 30 seconds",
      ],
    },
  ],
  mental_health: [
    {
      name: "Daily Meditation",
      description: "Meditate for 5-10 minutes daily to reduce stress",
      relevance: 9,
      difficulty: 4,
      impact: 9,
      feasibility: 8,
      duration: "30 days",
      steps: [
        "Use Calm, Headspace, or YouTube",
        "Start with 5 minutes",
        "Same time each day (morning is best)",
      ],
    },
    {
      name: "Journaling Practice",
      description:
        "Journal for 10 minutes daily about your thoughts and feelings",
      relevance: 8,
      difficulty: 2,
      impact: 8,
      feasibility: 9,
      duration: "21 days",
      steps: [
        "Get a journal you like",
        "Write without censoring yourself",
        "Reflect on what you wrote",
      ],
    },
    {
      name: "Social Connection Time",
      description:
        "Schedule 30 minutes of quality time with friends/family daily",
      relevance: 8,
      difficulty: 5,
      impact: 8,
      feasibility: 7,
      duration: "30 days",
      steps: [
        "Identify 2-3 people you want to connect with",
        "Schedule regular calls or hangouts",
        "Be fully present (phones away)",
      ],
    },
  ],
  finances: [
    {
      name: "Budget Tracking",
      description: "Track all expenses daily using an app or spreadsheet",
      relevance: 8,
      difficulty: 4,
      impact: 8,
      feasibility: 8,
      duration: "30 days",
      steps: [
        "Choose an app (YNAB, Mint, Goodbudget)",
        "Log every purchase same day",
        "Review weekly spending patterns",
      ],
    },
    {
      name: "Automatic Savings",
      description: "Transfer $50-100 to savings automatically each paycheck",
      relevance: 8,
      difficulty: 2,
      impact: 7,
      feasibility: 9,
      duration: "30 days",
      steps: [
        "Set up automatic transfer on payday",
        "Start with amount you won't miss",
        "Increase gradually each month",
      ],
    },
    {
      name: "No-Spend Challenge",
      description: "Have one day per week with zero discretionary spending",
      relevance: 7,
      difficulty: 5,
      impact: 6,
      feasibility: 7,
      duration: "30 days",
      steps: [
        "Pick one day per week",
        "Plan meals and activities ahead",
        "Track how much you save",
      ],
    },
  ],
  physical_health: [
    {
      name: "Posture Awareness",
      description: "Check and correct your posture 3 times daily",
      relevance: 7,
      difficulty: 2,
      impact: 6,
      feasibility: 9,
      duration: "14 days",
      steps: [
        "Set phone reminders 3x daily",
        "Roll shoulders back, align ears over shoulders",
        "Notice improvement in energy and mood",
      ],
    },
    {
      name: "Water Intake Tracking",
      description: "Drink 8-10 glasses of water daily",
      relevance: 7,
      difficulty: 3,
      impact: 7,
      feasibility: 9,
      duration: "7 days",
      steps: [
        "Get a 32oz water bottle",
        "Drink one bottle before noon",
        "One bottle in afternoon, evening, night",
      ],
    },
    {
      name: "Doctor Check-Up Schedule",
      description: "Schedule annual physical and dental appointments",
      relevance: 8,
      difficulty: 3,
      impact: 8,
      feasibility: 8,
      duration: "14 days (to schedule)",
      steps: [
        "Call doctor and dentist",
        "Book annual appointments",
        "Put on calendar with reminders",
      ],
    },
  ],
  social: [
    {
      name: "Weekly Friend Time",
      description: "Schedule one social activity per week (dinner, game, etc)",
      relevance: 8,
      difficulty: 5,
      impact: 8,
      feasibility: 7,
      duration: "30 days",
      steps: [
        "Pick one friend or group",
        "Schedule recurring weekly hangout",
        "Alternate who suggests activity",
      ],
    },
    {
      name: "Outreach Calls",
      description:
        "Call or video chat with 2 friends you haven't talked to recently",
      relevance: 7,
      difficulty: 3,
      impact: 7,
      feasibility: 8,
      duration: "7 days",
      steps: [
        "Make a list of 10 people you miss",
        "Call/message 2 this week",
        "Schedule regular check-ins",
      ],
    },
  ],
  spirituality: [
    {
      name: "Morning Intention Setting",
      description: "Set one intention each morning aligned with your values",
      relevance: 8,
      difficulty: 2,
      impact: 7,
      feasibility: 9,
      duration: "21 days",
      steps: [
        "Decide on your core values",
        "Each morning, state one intention",
        "Review evening on how you lived it",
      ],
    },
    {
      name: "Nature Connection Time",
      description: "Spend 20 minutes in nature daily (park, garden, beach)",
      relevance: 7,
      difficulty: 3,
      impact: 7,
      feasibility: 8,
      duration: "30 days",
      steps: [
        "Find a natural space near you",
        "Go same time each day",
        "Leave phone on silent, observe",
      ],
    },
  ],
};

/**
 * Calculate suggestion score
 * @param {Object} suggestion - Habit/goal suggestion
 * @returns {Number} Weighted score (0-100)
 */
const calculateSuggestionScore = (suggestion) => {
  const score =
    suggestion.relevance * 0.3 +
    suggestion.impact * 0.3 +
    (10 - suggestion.difficulty) * 0.2 +
    suggestion.feasibility * 0.2;

  return Math.round(score);
};

/**
 * Get suggestions for a user based on their weak areas
 * @param {String} userId - User ID
 * @param {Number} limit - Max suggestions to return (default 5)
 * @returns {Array} Sorted suggestions with scores
 */
export const getSuggestions = async (userId, limit = 5) => {
  try {
    // Get pillar scores
    const pillarScores = await PillarScore.find({ userId });

    // Get existing habits (to avoid duplicate suggestions)
    const existingHabits = await Habit.find({ userId, isActive: true }).lean();
    const existingHabitNames = new Set(
      existingHabits.map((h) => h.name.toLowerCase())
    );

    // Find weakest pillars (score < 6)
    const weakPillars = pillarScores
      .filter((ps) => ps.score < 6)
      .sort((a, b) => a.score - b.score);

    // Collect suggestions from weakest pillars
    const allSuggestions = [];

    weakPillars.forEach((pillarScore) => {
      const pillarSuggestions = suggestedHabits[pillarScore.pillar] || [];

      pillarSuggestions.forEach((suggestion) => {
        // Skip if already exists
        if (existingHabitNames.has(suggestion.name.toLowerCase())) {
          return;
        }

        const score = calculateSuggestionScore(suggestion);

        allSuggestions.push({
          ...suggestion,
          pillar: pillarScore.pillar,
          currentScore: pillarScore.score,
          score, // Calculated score
          reason: `Your ${
            pillarScore.pillar
          } score is ${pillarScore.score.toFixed(
            1
          )}/10. This habit can help improve it.`,
        });
      });
    });

    // Sort by score descending
    const sorted = allSuggestions.sort((a, b) => b.score - a.score);

    return {
      ok: true,
      suggestions: sorted.slice(0, limit),
      total: sorted.length,
    };
  } catch (error) {
    console.error("Get suggestions error:", error);
    return {
      ok: false,
      error: error.message,
      suggestions: [],
    };
  }
};

/**
 * Accept a suggestion and create a habit from it
 * @param {String} userId - User ID
 * @param {Object} suggestion - Suggestion data
 * @returns {Object} Created habit
 */
export const acceptSuggestion = async (userId, suggestion) => {
  try {
    const habit = await Habit.create({
      userId,
      name: suggestion.name,
      pillar: suggestion.pillar,
      isActive: true,
      metadata: {
        fromSuggestion: true,
        suggestionScore: suggestion.score,
        suggestedAt: new Date(),
      },
    });

    // Create entry for tracking
    const entry = await Entry.create({
      userId,
      type: "habit-created",
      pillar: suggestion.pillar,
      date: new Date(),
      score: 100, // Full points for creating habit
      metadata: {
        habitName: suggestion.name,
        fromSuggestion: true,
      },
    });

    return {
      ok: true,
      habit,
      entry,
      message: `Great! "${suggestion.name}" has been added to your active habits.`,
    };
  } catch (error) {
    console.error("Accept suggestion error:", error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

/**
 * Generate AI-personalized suggestions (fallback)
 * @param {String} userId - User ID
 * @param {Array} weakPillars - Pillars with low scores
 * @returns {Array} AI-generated suggestions
 */
export const generatePersonalizedSuggestions = async (userId, weakPillars) => {
  try {
    const prompt = `
      Generate 3 personalized habit/goal suggestions for someone struggling with: ${weakPillars.join(
        ", "
      )}
      
      Requirements:
      - Focus on QUICK WINS (habits that can be built in 7-30 days)
      - Be SPECIFIC and ACTIONABLE
      - Address ROOT CAUSES not just symptoms
      - Include clear steps to implement
      
      Format as JSON array with objects containing:
      { name, description, difficulty(1-10), impact(1-10), steps:[] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a wellness coach creating personalized habit suggestions. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return {
      ok: true,
      suggestions: suggestions.map((s) => ({
        ...s,
        relevance: 9,
        feasibility: 7,
        score: calculateSuggestionScore({ ...s, relevance: 9, feasibility: 7 }),
      })),
    };
  } catch (error) {
    console.error("Generate personalized suggestions error:", error);
    return {
      ok: false,
      error: error.message,
      suggestions: [],
    };
  }
};

export default {
  getSuggestions,
  acceptSuggestion,
  generatePersonalizedSuggestions,
  suggestedHabits,
  calculateSuggestionScore,
};
