/**
 * Nutrition Agent - "Chef Nourish"
 * 
 * Specialized AI agent for the Nutrition pillar, providing expert guidance on:
 * - Meal planning and nutrition advice
 * - Dietary preferences and restrictions
 * - Macro and micronutrient optimization
 * - Healthy eating habits and behavior change
 * - Recipe suggestions and meal prep
 * - Nutrition education and guidance
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';

/**
 * Chef Nourish System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Nutrition pillar agent - a comprehensive AI nutrition specialist.
 */
export const nutritionSystemPrompt = `
=== CHEF NOURISH - AI NUTRITION SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Chef Nourish, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hi! I'm Chef Nourish, your AI nutrition coach. I help you hit your goals with realistic, delicious, evidence-based eating strategies. I'm an AI trained in clinical nutrition and culinary science—not a registered dietitian, but a very capable guide. You can call me Chef Nourish, Nourish, or rename me anything you like. What are you trying to achieve with food right now?"
- If user wants to rename you: "Love it—[new name] it is! What can I cook up for you today?"
- **Overlap redirect**: If user asks about medical conditions (diabetes management, kidney disease, eating disorders, food allergies requiring medical oversight), immediately redirect: "That level of clinical nutrition needs a registered dietitian or physician. Shall I connect you to Dr. Vitality (physical health) or NorthStar to coordinate care? I'll stay here for performance nutrition, weight goals, and habit-building."

**Your Core Mission:** Deliver hyper-personalized, sustainable, delicious nutrition strategies that actually fit real life—while staying ruthlessly within nutritional science boundaries and redirecting medical cases instantly.

CORE BEHAVIOR:
- Warm, chef-meets-coach vibe (never clinical or preachy)
- Zero interrogation—maximum 1–2 targeted questions
- Immediately turn insight into trackable items (plans, habits, recipes)
- Ruthlessly anti-repetitive and progressive
- Celebrate wins hard, troubleshoot fast

ANTI-REPETITION RULES – CRITICAL:
1. Never re-explain macros, fiber, or "eat whole foods" once covered
2. Reference existing items by exact name: "How did the 35g-protein breakfast experiment feel this week?"
3. Every message must unlock NEW flavor, strategy, or optimization

CONVERSATION PROGRESSION:
- **Week 1**: Nail the biggest lever (protein, volume eating, meal timing, etc.) → launch core plan
- **Week 2**: Check data → fix friction points
- **Week 3**: Add flavor/pleasure layer or next macro target
- **Week 4**: Nutrient timing, supplements (only if appropriate), performance tweaks
- **Month 2+**: Cycle-based eating, refeeds, long-term periodization, restaurant hacking

DATA INTEGRATION – CRITICAL:
- **Automatically create & save everything** with pillar='nutrition'
- Never ask users to log meals or track anything themselves—you do it instantly
- Confirm instantly: "I've added 'High-Volume Lunch Formula' to your Nutrition pillar + three new recipes."

EXPANDED CAPABILITIES (all auto-saved):
1. **Macro Calculator** – instant personalized protein/fat/carb targets based on goal, activity, body comp
2. **Volume Eating Recipe Engine** – 800–1000 kcal meals under 600 kcal that feel huge
3. **Craving Decoder** – identify exact trigger (boredom, salt, creaminess, crunch) → instant swap recipe
4. **Restaurant Survival Scripts** – exact orders for 20+ chains that hit macros
5. **Travel & Social Eating Plans** – airport, hotel, weddings, holidays
6. **Reverse Diet / Refeed Planner** – for post-diet metabolism repair
7. **Cycle Sync Nutrition** – luteal-phase craving busters, follicular energy meals
8. **Supplement Decision Tree** – only evidence-based (creatine, protein powder, vitamin D, omega-3, caffeine timing)
9. **10-Minute Meal Matrix** – 50+ meals requiring ≤10 min active time
10. **Zero-Cook & Microwave-Only Plans**

ITEM CREATION EXAMPLES (pillar='nutrition'):
- LifePlan: "90-Day Fat Loss Without Suffering"
- SmartGoal: "Hit 140g protein daily for 30 days"
- Habit: "Protein-first at every meal" (daily)
- Recipe Pack: "5 High-Protein Indian Dinners Under 550 kcal"
- Craving Swap: "Salty & crunchy → roasted chickpeas 3 ways"
- Restaurant Hack: "Chipotle double-chicken bowl order (112g protein, 685 kcal)"

EXAMPLE OVERLAP REDIRECT:
User: "I have PCOS and need help with insulin resistance."
Chef Nourish: "PCOS nutrition requires medical oversight and often medication coordination. Let me connect you to Dr. Vitality or NorthStar so a human dietitian can take the lead. I'll stay here for taste, habits, and making the plan delicious once you have your medical framework."

EXAMPLE FLOWS (anti-repetitive):
First contact → "I want to lose 20 lbs but I love food too much."
→ "Perfect—let's make the food work for you. Quick question: how many meals do you eat out per week?"  
→ Build "Flavor-First Fat Loss Plan" with 40+ recipes that feel indulgent.

Second contact → "I'm losing weight but starving by 4pm."
→ "Classic protein/fiber gap. I'm adding the '4pm Volume Snack Pack' (three 150-kcal options that kill hunger). Try the cottage cheese + hot sauce bowl today."

Third contact → "Weight loss slowed—plateau?"
→ "Expected at week 6–8. Two options: (1) mini refeed weekend or (2) drop 100 kcal strategically. Which feels better right now?"

KEEP IT:
- Chef energy: playful, generous, zero judgment
- Instant solutions + instant tracking
- Deliciousness is non-negotiable
- Medical conditions → instant polite redirect
- Every single reply tastes new

You are now the most effective, beloved, boundary-respecting nutrition AI in the system. Welcome back, Chef Nourish.
`.trim();

/**
 * Run the Nutrition Agent (Chef Nourish)
 * 
 * @param {Object} params - Agent parameters
 * @param {import('./agentBase.js').AgentContext} params.context - User context with pillar='nutrition'
 * @param {string} params.userMessage - The user's current message
 * @param {Array<{role: string, content: string}>} [params.lastMessages] - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: {pillar: string}}>}
 */
export async function runNutritionAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'nutrition') {
    throw new Error('runNutritionAgent requires context with pillar="nutrition"');
  }

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runNutritionAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build complete message history with Chef Nourish's system prompt
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: nutritionSystemPrompt,
    lastMessages,
  });

  // Call the AI model router
  const modelResult = await runWithBestModel({
    taskType,
    systemPrompt,
    userMessage,
    conversationHistory,
  });

  // Return formatted response
  return {
    text: modelResult.text,
    model: modelResult.model,
    meta: {
      pillar: 'nutrition',
      agentName: 'Chef Nourish',
      taskType,
    },
  };
}

/**
 * Determine the appropriate task type based on user message content
 * 
 * For nutrition, we favor 'emotional_coaching' and 'mixed' by default,
 * only using 'deep_reasoning' for complex macro planning or multi-week periodization.
 * 
 * @param {string} userMessage - User's message
 * @returns {'deep_reasoning' | 'emotional_coaching' | 'mixed'}
 */
function determineTaskType(userMessage) {
  const messageLower = userMessage.toLowerCase();

  // Keywords indicating need for deep reasoning (complex planning only)
  const deepReasoningKeywords = [
    'macro',
    'macros',
    'macronutrient',
    'periodization',
    'bulking',
    'cutting',
    'bodybuilding',
    'calculate',
    'calorie deficit',
    'calorie surplus',
    'tdee',
    'bmr',
    'protein synthesis',
    'multi-week',
    'training cycle',
    'competition prep',
    'advanced plan',
    'detailed analysis',
  ];

  // Keywords indicating emotional coaching need (most common for nutrition)
  const emotionalCoachingKeywords = [
    'struggling',
    'craving',
    'binge',
    'guilt',
    'shame',
    'frustrated',
    'difficult',
    'hard time',
    'can\'t stop',
    'help me',
    'motivate',
    'encourage',
    'support',
    'stressed',
    'emotional eating',
    'comfort food',
    'feeling',
    'overwhelmed',
  ];

  // Check for deep reasoning indicators (strict - only complex planning)
  const needsDeepReasoning = deepReasoningKeywords.some(keyword => 
    messageLower.includes(keyword)
  );

  if (needsDeepReasoning) {
    return 'deep_reasoning';
  }

  // Check for emotional coaching indicators
  const needsEmotionalSupport = emotionalCoachingKeywords.some(keyword =>
    messageLower.includes(keyword)
  );

  if (needsEmotionalSupport) {
    return 'emotional_coaching';
  }

  // Default to mixed for general nutrition questions, meal planning, recipes, etc.
  return 'mixed';
}

/**
 * Helper: Generate personalized meal plan
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {Object} preferences - Meal plan preferences
 * @param {string} preferences.goal - Goal (weight loss, gain, maintenance, health)
 * @param {Array<string>} [preferences.dietaryRestrictions] - Any restrictions
 * @param {number} [preferences.mealsPerDay] - Number of meals (default 3)
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function generateMealPlan(context, preferences) {
  const { goal, dietaryRestrictions = [], mealsPerDay = 3 } = preferences;

  const restrictionsText = dietaryRestrictions.length > 0
    ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}`
    : 'No dietary restrictions';

  const planMessage = `Create a personalized meal plan for me:
- Goal: ${goal}
- ${restrictionsText}
- Meals per day: ${mealsPerDay}

Provide specific meal ideas with approximate portions. Make it practical and delicious.`;

  return runNutritionAgent({
    context,
    userMessage: planMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Get healthy recipe suggestions
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @param {Array<string>} [preferences] - Dietary preferences or ingredients
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function getRecipeSuggestions(context, mealType, preferences = []) {
  const preferencesText = preferences.length > 0
    ? `Preferences: ${preferences.join(', ')}`
    : '';

  const recipeMessage = `Suggest 3 healthy ${mealType} recipes. ${preferencesText}
Include ingredients and brief preparation steps. Make them practical for someone with a busy schedule.`;

  return runNutritionAgent({
    context,
    userMessage: recipeMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Analyze current eating habits
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function analyzeEatingHabits(context) {
  const analysisMessage = `Based on my recent food logs and eating patterns, provide:
1. An assessment of my current nutrition
2. 2-3 specific areas for improvement
3. One small change I can make this week

Be encouraging and practical.`;

  return runNutritionAgent({
    context,
    userMessage: analysisMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Handle food cravings
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {string} craving - What they're craving
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function handleCraving(context, craving) {
  const cravingMessage = `I'm really craving ${craving} right now. Help me understand what my body might need and suggest healthier alternatives or strategies.`;

  return runNutritionAgent({
    context,
    userMessage: cravingMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Macro calculation for specific goals
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {Object} params - Calculation parameters
 * @param {number} params.weight - Weight in lbs or kg
 * @param {string} params.weightUnit - 'lbs' or 'kg'
 * @param {string} params.goal - 'cut', 'bulk', 'maintain'
 * @param {string} params.activityLevel - 'sedentary', 'moderate', 'active', 'very_active'
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function calculateMacros(context, params) {
  const { weight, weightUnit, goal, activityLevel } = params;

  const macroMessage = `Calculate my macronutrient targets:
- Weight: ${weight} ${weightUnit}
- Goal: ${goal}
- Activity level: ${activityLevel}

Provide daily calorie target and macro breakdown (protein, carbs, fats in grams). Explain the rationale.`;

  return runNutritionAgent({
    context,
    userMessage: macroMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Meal prep guidance
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {number} daysToPrep - How many days to prep for (usually 3-7)
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function getMealPrepGuidance(context, daysToPrep = 5) {
  const prepMessage = `I want to meal prep for ${daysToPrep} days. Provide:
1. A simple meal prep strategy
2. 2-3 recipes that store and reheat well
3. Tips for keeping food fresh and interesting

Consider my dietary preferences and schedule.`;

  return runNutritionAgent({
    context,
    userMessage: prepMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Nutrition education on specific topic
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {string} topic - Nutrition topic to learn about
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function learnAboutNutrition(context, topic) {
  const educationMessage = `Teach me about ${topic} in nutrition. Explain it clearly with practical examples and how it applies to healthy eating.`;

  return runNutritionAgent({
    context,
    userMessage: educationMessage,
    lastMessages: [],
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// ============================================================================

export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'nutrition',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Chef Nourish' }
  });
}

export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'nutrition',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Chef Nourish' }
  });
}

export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'nutrition',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Chef Nourish' }
  });
}
