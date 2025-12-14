/**
 * Micro-Actions Engine
 *
 * Each agent produces tiny 2-5 min quick-win micro-actions
 * Examples: 5-min meditation, 10-min walk, drink water
 * Stored with habits for easy access
 *
 * File: backend/src/ai/agents/microActionsEngine.js
 */

import OpenAI from "openai";

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn(
      "[microActionsEngine] OpenAI client initialization failed:",
      error?.message
    );
    return null;
  }
};

/**
 * Micro-action template structure
 */
const microActionTemplate = {
  pillar: "string",
  title: "string", // Short action name (5 words max)
  description: "string", // How to do it (1-2 sentences)
  duration: "number", // Minutes (2-5)
  difficulty: "easy" | "medium", // Only easy/medium for quick wins
  energy: "low" | "medium", // Energy required
  tools: ["array of items needed"], // What you need
  benefits: ["array of benefits"], // Quick wins you'll get
  motivation: "string", // Why it matters
};

/**
 * Predefined micro-actions by pillar
 * These are templates; AI can generate variations
 */
const predefinedActions = {
  sleep: [
    {
      title: "Box Breathing for Sleep",
      description:
        "Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat 5 times.",
      duration: 3,
      difficulty: "easy",
      energy: "low",
      tools: [],
      benefits: [
        "reduces anxiety",
        "calms nervous system",
        "prepares for sleep",
      ],
      motivation: "Deep breathing signals your body to rest.",
    },
    {
      title: "Bedroom Temperature Check",
      description: "Check that your room is between 65-68°F. Adjust if needed.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: [],
      benefits: ["optimizes sleep environment", "improves sleep quality"],
      motivation: "Temperature is a primary sleep trigger.",
    },
    {
      title: "Screen Shutdown",
      description:
        "Put all screens away. No phones, tablets, computers for 30 min before bed.",
      duration: 0,
      difficulty: "medium",
      energy: "low",
      tools: [],
      benefits: [
        "reduces blue light",
        "increases melatonin",
        "better sleep onset",
      ],
      motivation: "Blue light suppresses melatonin production.",
    },
  ],
  diet: [
    {
      title: "Hydration Boost",
      description:
        "Drink a full glass of water right now. Add lemon if you like.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: ["water", "cup"],
      benefits: ["increases hydration", "boosts energy", "aids digestion"],
      motivation: "Most people are chronically dehydrated.",
    },
    {
      title: "Snack Swap",
      description: "Replace your current snack with nuts, fruit, or yogurt.",
      duration: 1,
      difficulty: "easy",
      energy: "low",
      tools: ["healthy snack"],
      benefits: ["better nutrition", "stable energy", "improved focus"],
      motivation: "Small swaps add up to big health changes.",
    },
    {
      title: "Meal Prep 3 Items",
      description: "Cut vegetables or portion proteins for the next 3 meals.",
      duration: 5,
      difficulty: "medium",
      energy: "medium",
      tools: ["cutting board", "knife", "containers"],
      benefits: [
        "saves time",
        "ensures healthy eating",
        "reduces decision fatigue",
      ],
      motivation: "Prep work eliminates unhealthy shortcuts.",
    },
  ],
  exercise: [
    {
      title: "Quick Walk",
      description: "Step outside and walk briskly for 5-10 minutes.",
      duration: 5,
      difficulty: "easy",
      energy: "medium",
      tools: [],
      benefits: ["increases heart rate", "boosts mood", "clears mind"],
      motivation: "Movement is mood medicine.",
    },
    {
      title: "Desk Stretches",
      description:
        "Do 5 minutes of neck, shoulder, and back stretches at your desk.",
      duration: 5,
      difficulty: "easy",
      energy: "low",
      tools: [],
      benefits: [
        "releases tension",
        "improves posture",
        "increases circulation",
      ],
      motivation: "Stretching prevents injury and stiffness.",
    },
    {
      title: "Stair Challenge",
      description: "Climb stairs 3-5 times, resting between rounds.",
      duration: 3,
      difficulty: "medium",
      energy: "high",
      tools: [],
      benefits: ["builds leg strength", "cardio boost", "burns calories"],
      motivation: "Stairs are a powerhouse workout.",
    },
  ],
  mental_health: [
    {
      title: "5-Minute Meditation",
      description:
        "Use a guided app (Calm, Headspace) or just focus on breathing.",
      duration: 5,
      difficulty: "easy",
      energy: "low",
      tools: ["phone with meditation app"],
      benefits: ["reduces stress", "increases focus", "improves mood"],
      motivation: "Meditation rewires your brain for calm.",
    },
    {
      title: "Gratitude Journaling",
      description: "Write down 3 things you are grateful for today.",
      duration: 3,
      difficulty: "easy",
      energy: "low",
      tools: ["journal", "pen"],
      benefits: ["shifts mindset", "increases happiness", "boosts resilience"],
      motivation: "Gratitude is a superpower for mental health.",
    },
    {
      title: "Reach Out to Friend",
      description: "Text or call one friend you haven't talked to recently.",
      duration: 5,
      difficulty: "easy",
      energy: "low",
      tools: ["phone"],
      benefits: ["strengthens connection", "combats loneliness", "boosts mood"],
      motivation: "Connection is medicine for anxiety.",
    },
  ],
  finances: [
    {
      title: "Track One Expense",
      description: "Log today's largest purchase into your budget app.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: ["budget app or spreadsheet"],
      benefits: ["awareness", "prevents overspending", "accountability"],
      motivation: "What you track, you control.",
    },
    {
      title: "Review One Bill",
      description: "Check one monthly subscription. Cancel if unused.",
      duration: 5,
      difficulty: "easy",
      energy: "low",
      tools: ["phone or computer"],
      benefits: ["saves money", "reduces waste", "clarity on spending"],
      motivation: "Small cuts compound over time.",
    },
    {
      title: "Save $5-10",
      description: "Transfer $5-10 to savings. No amount is too small.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: ["banking app"],
      benefits: ["builds savings habit", "security", "progress"],
      motivation: "Every dollar counts. Build momentum.",
    },
  ],
  physical_health: [
    {
      title: "Posture Check",
      description:
        "Sit up straight, roll shoulders back, align ears over shoulders.",
      duration: 1,
      difficulty: "easy",
      energy: "low",
      tools: [],
      benefits: ["reduces pain", "improves confidence", "aids digestion"],
      motivation: "Posture affects both body and mind.",
    },
    {
      title: "Body Scan",
      description:
        "Mentally scan your body from head to toe. Notice where you hold tension.",
      duration: 3,
      difficulty: "easy",
      energy: "low",
      tools: [],
      benefits: [
        "increases body awareness",
        "identifies tension",
        "promotes relaxation",
      ],
      motivation: "Awareness is the first step to healing.",
    },
    {
      title: "Mobility Drill",
      description:
        "Do 2 minutes of hip circles, arm rotations, and neck rolls.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: [],
      benefits: ["improves range of motion", "prevents injury", "feels good"],
      motivation: "Mobility is quality of life.",
    },
  ],
  social: [
    {
      title: "Send a Compliment",
      description:
        "Message someone and tell them something you appreciate about them.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: ["phone"],
      benefits: [
        "strengthens relationships",
        "spreads joy",
        "builds connection",
      ],
      motivation: "Kindness comes back multiplied.",
    },
    {
      title: "Social Plan",
      description: "Schedule a 30-min call or coffee with a friend.",
      duration: 5,
      difficulty: "easy",
      energy: "low",
      tools: ["phone", "calendar"],
      benefits: [
        "combats loneliness",
        "deepens bonds",
        "gives you something to look forward to",
      ],
      motivation: "Scheduled social time is more likely to happen.",
    },
  ],
  spirituality: [
    {
      title: "Morning Intention",
      description:
        "Set one intention for the day. Write it down or say it aloud.",
      duration: 2,
      difficulty: "easy",
      energy: "low",
      tools: ["journal or paper"],
      benefits: ["clarity", "purpose", "direction"],
      motivation: "Intention creates alignment.",
    },
    {
      title: "Gratitude Walk",
      description: "Walk outside and notice 5 things you're grateful for.",
      duration: 5,
      difficulty: "easy",
      energy: "medium",
      tools: [],
      benefits: ["connects to purpose", "increases happiness", "mindfulness"],
      motivation: "Nature and gratitude are deeply connecting.",
    },
  ],
};

/**
 * Generate micro-actions for a pillar
 * @param {String} pillar - The pillar (sleep, diet, exercise, etc.)
 * @param {Object} context - User context (habits, scores, etc.)
 * @returns {Array} Array of micro-actions (5-8 options)
 */
export const generateMicroActions = async (pillar, context = {}) => {
  try {
    // Get predefined actions for this pillar
    const baseActions = predefinedActions[pillar] || [];

    // If we have predefined actions, return them with some randomization
    if (baseActions.length > 0) {
      // Shuffle and return top actions
      const shuffled = baseActions.sort(() => Math.random() - 0.5);
      return {
        ok: true,
        pillar,
        actions: shuffled.slice(0, 5).map((action, index) => ({
          id: `${pillar}-${index}`,
          pillar,
          ...action,
          difficulty: action.difficulty,
          energyRequired: action.energy,
        })),
      };
    }

    // Fallback: Generate via AI if predefined not available
    const prompt = `
      Generate 5 micro-actions (2-5 minute quick wins) for the ${pillar} pillar.
      
      Each should be:
      - Quick (2-5 minutes max)
      - Easy to medium difficulty
      - Achievable right now
      - Specific and actionable
      - Result-oriented
      
      Format as JSON array with objects containing: 
      { title, description, duration, difficulty, tools, benefits, motivation }
      
      ${context.score ? `Current ${pillar} score: ${context.score}/10` : ""}
      ${context.trend ? `Trend: ${context.trend}` : ""}
    `;

    const openai = getOpenAIClient();
    if (!openai) {
      return {
        ok: false,
        pillar,
        message:
          "OpenAI is not configured. Provide OPENAI_API_KEY to enable generated micro-actions.",
        actions: [],
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a wellness coach who creates quick, achievable micro-actions. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const actions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return {
      ok: true,
      pillar,
      actions: actions.map((action, index) => ({
        id: `${pillar}-ai-${index}`,
        pillar,
        ...action,
        difficulty: action.difficulty || "easy",
        energyRequired: action.energy || "low",
      })),
    };
  } catch (error) {
    console.error("Generate micro-actions error:", error);
    // Return default action on error
    return {
      ok: false,
      pillar,
      actions: [
        {
          id: `${pillar}-default`,
          pillar,
          title: `Take a 5-minute break`,
          description: `Pause what you are doing and take a moment to breathe and refocus.`,
          duration: 5,
          difficulty: "easy",
          energyRequired: "low",
          tools: [],
          benefits: ["reduces stress", "increases clarity"],
          motivation: "Small breaks boost productivity and wellbeing.",
        },
      ],
    };
  }
};

/**
 * Complete a micro-action (track it)
 * @param {String} userId - User ID
 * @param {String} actionId - Micro-action ID
 * @param {String} pillar - Pillar
 * @returns {Object} Completion record
 */
export const completeMicroAction = async (userId, actionId, pillar) => {
  try {
    const Entry = (await import("../../models/Entry.js")).default;

    const entry = await Entry.create({
      userId,
      type: "micro-action",
      pillar,
      date: new Date(),
      score: 100, // Full points for completing a micro-action
      metadata: {
        actionId,
        completedAt: new Date().toISOString(),
      },
    });

    return {
      ok: true,
      completed: true,
      entry,
    };
  } catch (error) {
    console.error("Complete micro-action error:", error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

export default {
  generateMicroActions,
  completeMicroAction,
  predefinedActions,
};
