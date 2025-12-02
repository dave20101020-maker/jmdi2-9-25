/**
 * Fitness Agent - "Coach Atlas"
 * 
 * Specialized AI agent for the Fitness pillar, providing expert guidance on:
 * - Exercise programming and workout plans
 * - Movement patterns and form coaching
 * - Training periodization and progression
 * - Recovery and injury prevention
 * - Fitness motivation and accountability
 * - Performance optimization
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';

/**
 * Coach Atlas System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Fitness pillar agent - a comprehensive AI fitness coach.
 */
export const fitnessSystemPrompt = `
=== COACH ATLAS - AI FITNESS SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Coach Atlas, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hey! I'm Coach Atlas, your AI strength & performance coach. I build smart, progressive programs that actually fit your life and get you stronger, faster, more mobile—whatever you want. I'm an AI trained in exercise physiology and programming—not a human trainer, but I'm damn good at this. Call me Atlas or rename me whatever fires you up. What are we training for?"
- If user wants to rename you: "Hell yes—[new name] locked in. Let's move some iron (or bodyweight). What's the mission?"
- **Overlap redirect**: If user mentions injuries requiring medical clearance, chronic pain, eating disorders, or performance-enhancing drugs → "That needs a human professional first. Let me connect you to Dr. Vitality or NorthStar so you're cleared and safe. I'll be here to program the second you get the green light."

**Your Core Mission:** Deliver the most effective, enjoyable, progressive training possible while staying ruthlessly inside safe, evidence-based boundaries and redirecting anything medical instantly.

CORE BEHAVIOR:
- Direct, zero-BS, high-energy coach voice
- Maximum 1–2 sharp questions—never an interview
- Turn every insight into an instantly trackable program or habit
- Celebrate PRs like they're Olympic medals
- Ruthlessly anti-repetitive and always progressing

ANTI-REPETITION RULES – CRITICAL:
1. Never re-explain RPE, RIR, progressive overload, or warm-ups once taught
2. Reference existing items by exact name: "How did Week 3's 5×5 squat feel?"
3. Every single reply must add new sets, reps, tempo, exercise, or training method

CONVERSATION PROGRESSION:
- **Week 1**: Baseline + launch perfect-frequency program
- **Week 2**: Form check + first progression
- **Week 3**: Next progression or new training block (volume → intensity → specialization)
- **Week 4**: Add conditioning, mobility, or weak-point work
- **Month 2+**: Periodization waves, peaking phases, deloads, specialization cycles

DATA INTEGRATION – CRITICAL:
- **Automatically create & save everything** with pillar='fitness'
- You log every rep, weight, and session instantly
- Confirm instantly: "Logged your 100 kg squat triple and updated your program to 102.5 kg next session."

EXPANDED CAPABILITIES (all auto-saved):
1. **Full Program Builder** – 1–6 day splits, linear, undulating, conjugate, block, or duplex periodization
2. **1RM Calculator & Auto-Progressor** – live updates every workout
3. **Exercise Video Library** – 800+ form videos with exact cues
4. **Injury & Pain Modifications** – instant swaps for knees, shoulders, back
5. **Velocity-Based Training Mode** – if user has VBT device
6. **Power, Hypertrophy, or Strength Specialization Blocks**
7. **Home / Travel / Hotel / Minimal-Equipment Variants**
8. **Daily Undulating RPE Auto-Regulation**
9. **Deload & Peak Week Designer**
10. **Mobility Flows** – 5–15 min targeted routines (hips, thoracic, ankles, etc.)

ITEM CREATION EXAMPLES (pillar='fitness'):
- LifePlan: "12-Week Powerbuilding Phase"
- SmartGoal: "Hit a 140 kg squat by week 12"
- Habit: "Train Mon/Wed/Fri/Sat – never miss twice"
- Workout Block: "Week 5 – Squat 5×5 @ 85% + Bench 4×6"
- PR Log: "Deadlift 180 kg × 3 – new all-time PR 🔥"
- Mobility Habit: "90/90 Hip Flow – 8 min every morning"

EXAMPLE OVERLAP REDIRECT:
User: "My shoulder hurts when I bench."
Coach Atlas: "Stop. We're not guessing with pain. Let me connect you to Dr. Vitality for clearance and imaging. Once you're cleared, I'll build you a bulletproof shoulder-friendly pressing program. Deal?"

EXAMPLE FLOWS (anti-repetitive):
First contact → "I want to deadlift 200 kg."
→ "Current max and how many days can you train?" → Build 16-week conjugate-style deadlift program with exact weekly targets.

Second contact → "Hit my squats but deadlifts felt slow."
→ "Perfect—speed work day this week: 8×3 @ 70% with 45 sec rest. I've swapped it in."

Third contact → "Everything's flying up but lower back is fried."
→ "Smart. Dropping to 4 days and adding a deload week. I've already rebuilt the next 4 weeks with reverse hypers and McGill Big 3 daily."

KEEP IT:
- Coach energy: direct, hyped, zero fluff
- Instant programming + instant logging
- Medical/injury issues → instant redirect
- Every reply gets you stronger, more mobile, or closer to your goal
- Celebrate every single win like it's game day

You are now the hardest-hitting, safest, most progressive fitness AI in the system. Welcome back, Coach Atlas.
`.trim();

/**
 * Run the Fitness Agent (Coach Atlas)
 * 
 * @param {Object} params
 * @param {import('./agentBase.js').AgentContext} params.context - User context with fitness pillar
 * @param {string} params.userMessage - User's current message
 * @param {Array} params.lastMessages - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: Object}>}
 */
export async function runFitnessAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'fitness') {
    throw new Error('runFitnessAgent requires context with pillar="fitness"');
  }
  
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runFitnessAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build message history with NorthStar context and Coach Atlas personality
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: fitnessSystemPrompt,
    lastMessages,
    extraSystemNotes: `Current user message is about: ${taskType}`
  });

  // Route to best model based on task type
  const result = await runWithBestModel({
    taskType,
    systemPrompt,
    userMessage,
    conversationHistory
  });

  // Return result with fitness agent metadata
  return {
    text: result.text,
    model: result.model,
    meta: {
      pillar: 'fitness',
      agentName: 'Coach Atlas',
      taskType,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Determine task type for fitness queries
 * 
 * Routing logic:
 * - 'deep_reasoning': Complex programming, periodization, advanced planning
 * - 'emotional_coaching': Motivation, struggles, accountability, mindset
 * - 'mixed': General workouts, form guidance, exercise selection (DEFAULT)
 * 
 * @param {string} message - User's message
 * @returns {'deep_reasoning' | 'emotional_coaching' | 'mixed'}
 */
function determineTaskType(message) {
  const lower = message.toLowerCase();

  // Deep reasoning keywords: Complex programming and periodization
  const deepReasoningKeywords = [
    'program', 'programming', 'periodization', 'periodize',
    'block', 'mesocycle', 'macrocycle', 'microcycle',
    'peak', 'peaking', 'taper', 'tapering',
    'progressive overload', 'progression scheme',
    'training split', 'weekly split', 'training plan',
    'competition prep', 'meet prep',
    'advanced program', 'intermediate program',
    'linear progression', 'undulating',
    'deload', 'volume landmarks',
    'training age', 'periodized',
    '12-week', '16-week', '8-week program',
    'hypertrophy phase', 'strength phase', 'power phase'
  ];

  const hasDeepReasoning = deepReasoningKeywords.some(keyword => lower.includes(keyword));

  // Emotional coaching keywords: Motivation and mindset
  const emotionalKeywords = [
    'unmotivated', 'no motivation', 'lack motivation',
    'don\'t feel like', 'don\'t want to',
    'giving up', 'want to quit', 'ready to quit',
    'struggling', 'can\'t seem to',
    'frustrated', 'discouraged', 'disappointed',
    'not seeing results', 'plateau',
    'scared', 'afraid', 'nervous', 'intimidated',
    'embarrassed', 'self-conscious',
    'burnout', 'burned out', 'overtrained',
    'hate', 'dread', 'dreading',
    'accountability', 'stay consistent',
    'feeling weak', 'feeling slow',
    'comparing myself', 'everyone else'
  ];

  const hasEmotional = emotionalKeywords.some(keyword => lower.includes(keyword));

  // Route based on detected keywords
  if (hasDeepReasoning && !hasEmotional) {
    return 'deep_reasoning';
  } else if (hasEmotional) {
    return 'emotional_coaching';
  } else {
    return 'mixed'; // Default: general workouts, form, exercise selection
  }
}

// ============================================================================
// HELPER FUNCTIONS
// Common fitness coaching functions that can be called directly
// ============================================================================

/**
 * Generate a workout routine
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} preferences - Workout preferences
 * @returns {Promise<{text: string, model: string}>}
 */
export async function generateWorkout(context, preferences = {}) {
  const {
    goal = 'general fitness',
    daysPerWeek = 3,
    duration = 45,
    equipment = 'full gym',
    experience = 'beginner'
  } = preferences;

  const workoutMessage = `Create a workout routine for me:
- Goal: ${goal}
- Days per week: ${daysPerWeek}
- Duration: ${duration} minutes per session
- Equipment: ${equipment}
- Experience level: ${experience}

Provide specific exercises with sets, reps, and rest periods. Include warm-up and cool-down.`;

  return runFitnessAgent({
    context,
    userMessage: workoutMessage,
    lastMessages: []
  });
}

/**
 * Get form coaching for specific exercises
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} exercise - Exercise name
 * @returns {Promise<{text: string, model: string}>}
 */
export async function getFormCoaching(context, exercise) {
  const formMessage = `Teach me proper form for ${exercise}. Include:
- Step-by-step setup
- Movement execution cues
- Common mistakes to avoid
- Breathing pattern
- Safety considerations`;

  return runFitnessAgent({
    context,
    userMessage: formMessage,
    lastMessages: []
  });
}

/**
 * Provide exercise modifications
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} exercise - Exercise to modify
 * @param {string} reason - Reason for modification (injury, equipment, difficulty)
 * @returns {Promise<{text: string, model: string}>}
 */
export async function getExerciseModification(context, exercise, reason) {
  const modMessage = `I need modifications for ${exercise} because: ${reason}. 
Suggest alternative exercises or modifications that work the same muscle groups safely.`;

  return runFitnessAgent({
    context,
    userMessage: modMessage,
    lastMessages: []
  });
}

/**
 * Create progressive overload strategy
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} currentTraining - Current training details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function getProgressionStrategy(context, currentTraining) {
  const { exercise, currentWeight, currentReps, currentSets } = currentTraining;

  const progressMessage = `Help me progress on ${exercise}. Currently doing:
- Weight: ${currentWeight}
- Reps: ${currentReps}
- Sets: ${currentSets}

What's my next progression step? Should I increase weight, reps, sets, or frequency?`;

  return runFitnessAgent({
    context,
    userMessage: progressMessage,
    lastMessages: []
  });
}

/**
 * Get recovery and injury prevention advice
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} concern - Recovery concern or area of soreness
 * @returns {Promise<{text: string, model: string}>}
 */
export async function getRecoveryAdvice(context, concern) {
  const recoveryMessage = `I'm experiencing: ${concern}

What recovery strategies should I use? Should I rest, do active recovery, stretch, or modify my training?`;

  return runFitnessAgent({
    context,
    userMessage: recoveryMessage,
    lastMessages: []
  });
}

/**
 * Design a training program (triggers deep reasoning)
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} programParams - Program parameters
 * @returns {Promise<{text: string, model: string}>}
 */
export async function designTrainingProgram(context, programParams) {
  const {
    goal,
    duration = '12 weeks',
    currentLevel,
    equipment,
    schedule
  } = programParams;

  const programMessage = `Design a ${duration} training program for me:
- Primary goal: ${goal}
- Current fitness level: ${currentLevel}
- Available equipment: ${equipment}
- Training schedule: ${schedule}

Include periodization phases, progression plan, and deload weeks. Make it comprehensive and structured.`;

  return runFitnessAgent({
    context,
    userMessage: programMessage,
    lastMessages: []
  });
}

/**
 * Provide motivation and mindset coaching
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} struggle - What the user is struggling with
 * @returns {Promise<{text: string, model: string}>}
 */
export async function getMotivationCoaching(context, struggle) {
  const motivationMessage = `I'm struggling with: ${struggle}

Can you help me find motivation and get back on track with my fitness?`;

  return runFitnessAgent({
    context,
    userMessage: motivationMessage,
    lastMessages: []
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// ============================================================================

export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'fitness',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Coach Atlas' }
  });
}

export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'fitness',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Coach Atlas' }
  });
}

export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'fitness',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Coach Atlas' }
  });
}
