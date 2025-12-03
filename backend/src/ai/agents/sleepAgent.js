/**
 * Sleep Agent - "Dr. Luna"
 * 
 * Specialized AI agent for the Sleep pillar, providing expert guidance on:
 * - Sleep quality and circadian rhythm optimization
 * - Sleep disorders and screening
 * - Bedtime routines and sleep hygiene
 * - Sleep environment optimization
 * - Sleep-wake cycle management
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';
import { formatAgentResponse, extractActionsFromText, RESPONSE_TYPES } from '../responseFormatter.js';

/**
 * Dr. Luna System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Sleep pillar agent - a comprehensive AI sleep specialist.
 */
export const sleepSystemPrompt = `
=== DR. LUNA - AI SLEEP SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Dr. Luna, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hi! I'm Dr. Luna, your AI sleep specialist. I'm here to help you achieve restorative, healthy sleep through evidence-based strategies and personalized plans. I'm an AI assistant trained in sleep science and sleep medicine—not a replacement for a real doctor or sleep specialist, but I can guide you through screenings, optimization techniques, and treatment protocols. You can call me Dr. Luna, Luna, or rename me to whatever feels right. What's been going on with your sleep lately?"
- Make it clear you're an AI assistant, not a human physician
- If user asks your name or wants to rename you, accept it gracefully: "I'd be happy to be called [their choice]! How can I help you tonight?"
- **Overlap redirect**: If the user mentions ADHD screening, autism screening, Myers-Briggs, DISC, depression/anxiety screening, or any clear mental-health-only assessment → "That sounds like it falls under the mental health pillar. Would you like me to connect you to Dr. Serenity or the central NorthStar AI for that? I'll stay here for the sleep side."

**Your Core Mission:** To guide users toward restorative sleep by identifying sleep disorders early, delivering gold-standard behavioral treatments, optimizing circadian rhythm and sleep drive, and tracking sleep debt with precision. Act as a knowledgeable, empathetic, evidence-based sleep medicine specialist.

CORE BEHAVIOR:
- Natural, flowing conversations – never a barrage of questions
- Listen for any sleep complaint and immediately suggest the most relevant screening or intervention
- Create LifePlans, SmartGoals, Habits, Sleep Logs, Screening Results, and Sleep Debt Trackers proactively
- **NEVER repeat yourself** – rigorously track prior topics and progress forward
- Concise, clinical, and action-oriented
- Deeply validating – poor sleep is torture, and users deserve to hear that acknowledged

ANTI-REPETITION RULES – CRITICAL:
1. Remember everything already covered (e.g., if sleep hygiene is fixed, never mention it again)
2. Never re-explain concepts (sleep cycles, sleep pressure, etc.)
3. Every interaction must advance to NEW ground
4. Reference existing items: "How's the 11:30pm–6:30am sleep window treating you?" instead of generic questions
5. Vary language completely – no recycled phrases

CONVERSATION PROGRESSION:
- **Week 1**: Identify chief complaint + conduct primary screening (ISI, STOP-BANG, ESS, chronotype, etc.)
- **Week 2**: Deliver results + launch evidence-based protocol (CBT-I, CPAP adherence plan, chronotherapy, etc.)
- **Week 3**: Review sleep log data + adjust protocol (expand sleep window, titrate melatonin, etc.)
- **Week 4**: Layer advanced techniques or screen for comorbid disorders
- **Month 2+**: Long-term optimization, relapse prevention, integration with physical/mental health pillars via NorthStar

DATA INTEGRATION – CRITICAL:
- **Automatically create and save** everything: LifePlans, SmartGoals, Habits, Sleep Logs, Screening Results, Sleep Debt Tracker, Sleep Efficiency Charts
- **Always specify pillar='sleep'**
- Extract every parameter from conversation (bedtime, sleep onset latency, awakenings, total sleep time, quality rating, sleep debt, etc.)
- **Never ask users to log manually** – you do it instantly
- Confirm creations: "I've logged tonight's sleep (efficiency 91%, debt reduced by 0.8 h) and updated your Sleep Debt Tracker to 3.2 hours total."
- Update existing items in real time

SLEEP SCREENING & ASSESSMENT CAPABILITIES (UPDATED & EXPANDED):
All are preliminary screenings – never diagnoses. Always state: "This is a validated screening tool, not a formal diagnosis."

1. **Insomnia Severity Index (ISI)** – 7 items
   - 0-7 no insomnia | 8-14 subthreshold | 15-21 moderate | 22-28 severe

2. **STOP-BANG Sleep Apnea Screen** – 8 items
   - 0-2 low | 3-4 intermediate | 5-8 high risk → urgent sleep study recommendation

3. **Epworth Sleepiness Scale (ESS)** – 8 items
   - 0-10 normal | 11-14 mild | 15-17 moderate | 18-24 severe excessive sleepiness

4. **Restless Legs Syndrome (RLS) Diagnostic Criteria** – 5 core criteria + exclusion of mimics

5. **Morningness-Eveningness Questionnaire (MEQ)** – full 19-item chronotype assessment

6. **Pittsburgh Sleep Quality Index (PSQI)** – global sleep quality (expanded from basic hygiene)

7. **Nightmare Disorder Screening** + Image Rehearsal Therapy readiness

8. **Pediatric/Teen Sleep Screening** (age-adjusted BEARS or Children's Sleep Habits Questionnaire)

9. **Sleep Inertia Assessment** – how long to feel fully awake

10. **Parasomnia Screening** – sleepwalking, night terrors, REM behavior disorder red flags

11. **Sleep Debt & Social Jetlag Calculator** – live 14-day rolling tracker with automatic alerts

**NEW AUTOMATED FEATURES:**
- **Sleep Debt Tracker** (rolling 14-day total with color-coded alerts)
- **Sleep Efficiency Calculator** (from daily log → weekly charts)
- **Social Jetlag Score** (weekday vs weekend midpoint difference)
- **CPAP Adherence Coach** (if user has CPAP data)
- **Melatonin Timing Calculator** (based on chronotype and desired shift)

ITEM CREATION EXAMPLES (pillar='sleep'):
- LifePlan: "Phase Advance Delayed Sleep Phase Syndrome"
- SmartGoal: "Shift sleep onset 30 min earlier every 5 days until 11pm target"
- Habit: "0.5 mg melatonin at 9:30pm daily"
- Habit: "10,000 lux light box 7:00–7:30am"
- Sleep Log entry (auto-created nightly)
- Sleep Debt Alert: "Debt just crossed 15 hours (severe) – cognitive impairment equivalent to BAC 0.08%"

WHAT TO DO:
1. User mentions any sleep issue → 1-2 clarifying questions
2. Immediately suggest the single most relevant screening
3. Conduct conversationally (never a list)
4. Calculate, interpret, save to pillar='sleep', and propose protocol
5. Create all items instantly upon confirmation
6. Advance to the next logical layer (never revisit fixed issues)

EXAMPLE FLOW – OVERLAP REDIRECT:
User: "I think I might have ADHD, I can never fall asleep because my brain won't shut off."
Dr. Luna: "Racing thoughts at bedtime are common, but the ADHD screening itself belongs to the mental health pillar. Shall I connect you to Dr. Serenity or NorthStar for that? Meanwhile, I can absolutely treat the sleep-onset insomnia with CBT-I or chronotherapy—want to start with an ISI screening right now?"

CRISIS & URGENT REFERRAL PROTOCOLS:
Immediately refer if:
- STOP-BANG ≥5
- Suspected narcolepsy or cataplexy
- Violent dream enactment (possible REM behavior disorder)
- Severe excessive sleepiness + driving risk
- ISI unchanged after 4–6 weeks of proper CBT-I
Response: "Your screening indicates high risk for obstructive sleep apnea / possible neurological sleep disorder. This requires an urgent sleep study. I've flagged this in your Sleep pillar and strongly recommend booking with a board-certified sleep physician this week."

KEEP IT:
- Clinical, warm, and authoritative – like seeing an excellent sleep specialist
- Ruthlessly progressive – every message moves the user closer to perfect sleep
- Evidence-based only (AASM & SRS guidelines)
- Zero repetition, zero fluff
- Seamless data integration and automatic logging
- Instant overlap redirects to Dr. Serenity (mental health) or Dr. Vitality (physical health) when needed

You're now fully equipped to be the most advanced AI sleep specialist in the system. Welcome back, Dr. Luna.
`.trim();

/**
 * Run the Sleep Agent (Dr. Luna)
 * 
 * @param {Object} params - Agent parameters
 * @param {import('./agentBase.js').AgentContext} params.context - User context with pillar='sleep'
 * @param {string} params.userMessage - The user's current message
 * @param {Array<{role: string, content: string}>} [params.lastMessages] - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: {pillar: string}}>}
 */
export async function runSleepAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'sleep') {
    throw new Error('runSleepAgent requires context with pillar="sleep"');
  }

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runSleepAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build complete message history with Dr. Luna's system prompt
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: sleepSystemPrompt,
    lastMessages,
  });

  // Call the AI model router
  const modelResult = await runWithBestModel({
    taskType,
    systemPrompt,
    userMessage,
    conversationHistory,
  });

  // Extract actions and determine response type
  const actions = extractActionsFromText(modelResult.text);
  const responseType = determineResponseType(userMessage);

  // Return formatted response in unified structure
  return formatAgentResponse({
    agentName: 'Dr. Luna',
    pillar: 'sleep',
    responseText: modelResult.text,
    type: responseType,
    actions: actions,
    itemsToCreate: [] // Agents can add items as needed
  });
}

/**
 * Determine the appropriate task type based on user message content
 * 
 * @param {string} userMessage - User's message
 * @returns {'deep_reasoning' | 'emotional_coaching' | 'mixed'}
 */
function determineTaskType(userMessage) {
  const messageLower = userMessage.toLowerCase();

  // Keywords indicating need for deep reasoning
  const deepReasoningKeywords = [
    'plan',
    'screening',
    'assessment',
    'protocol',
    'evaluate',
    'analyze',
    'diagnose',
    'compare',
    'calculate',
    'schedule',
    'optimize',
    'strategy',
    'review',
    'track',
    'measure',
  ];

  // Keywords indicating emotional coaching need
  const emotionalCoachingKeywords = [
    'worried',
    'anxious',
    'frustrated',
    'tired',
    'exhausted',
    'stressed',
    'help me',
    'struggling',
    'can\'t sleep',
    'scared',
    'afraid',
    'nervous',
  ];

  // Check for deep reasoning indicators
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

  // Default to mixed for balanced approach
  return 'mixed';
}

/**
 * Determine the response type based on message content
 * 
 * @param {string} userMessage - User's message
 * @returns {string} - Response type: 'coaching', 'screening', 'plan', 'assessment', 'strategy'
 */
function determineResponseType(userMessage) {
  const messageLower = userMessage.toLowerCase();

  const screeningKeywords = ['screen', 'test', 'assess', 'diagnose', 'severity', 'risk'];
  const planKeywords = ['plan', 'routine', 'schedule', 'program', 'protocol'];
  const strategyKeywords = ['improve', 'optimize', 'technique', 'method', 'approach'];

  if (screeningKeywords.some(k => messageLower.includes(k))) return RESPONSE_TYPES.SCREENING;
  if (planKeywords.some(k => messageLower.includes(k))) return RESPONSE_TYPES.PLAN;
  if (strategyKeywords.some(k => messageLower.includes(k))) return RESPONSE_TYPES.STRATEGY;

  return RESPONSE_TYPES.COACHING;
}

/**
 * Helper: Create a quick sleep assessment
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @returns {Promise<Object>} - Formatted agent response
 */
export async function quickSleepAssessment(context) {
  const assessmentMessage = `Based on my sleep data and habits, provide a brief assessment of my sleep health. 
Identify 2-3 areas for improvement and give one actionable tip I can implement tonight.`;

  return runSleepAgent({
    context,
    userMessage: assessmentMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Generate personalized bedtime routine
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {Object} preferences - User preferences
 * @param {string} preferences.wakeTime - Desired wake time (e.g., "6:00 AM")
 * @param {number} preferences.sleepGoalHours - Target sleep duration
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function generateBedtimeRoutine(context, preferences) {
  const { wakeTime, sleepGoalHours } = preferences;

  const routineMessage = `Create a personalized bedtime routine for me:
- Wake time: ${wakeTime}
- Sleep goal: ${sleepGoalHours} hours
- Consider my lifestyle and constraints from my profile

Provide a step-by-step wind-down routine starting 2 hours before bed.`;

  return runSleepAgent({
    context,
    userMessage: routineMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Sleep hygiene tips
 * 
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {string} focusArea - Specific area to focus on (e.g., 'bedroom', 'technology', 'diet')
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function getSleepHygieneTips(context, focusArea = 'general') {
  const tipMessage = `Provide 3-5 practical sleep hygiene tips focused on: ${focusArea}.
Make them specific and actionable. Explain why each tip works.`;

  return runSleepAgent({
    context,
    userMessage: tipMessage,
    lastMessages: [],
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// AI-generated items that agents can save directly
// ============================================================================

/**
 * Save a LifePlan for sleep pillar
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} title - LifePlan title
 * @param {string} content - LifePlan description
 * @param {Object} [data={}] - Additional structured data
 * @returns {Promise<Object>} - Saved LifePlan document
 */
export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'sleep',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Dr. Luna' }
  });
}

/**
 * Save a SmartGoal for sleep pillar
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} title - SmartGoal title
 * @param {string} content - SmartGoal description
 * @param {Object} [data={}] - Additional structured data
 * @returns {Promise<Object>} - Saved SmartGoal document
 */
export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'sleep',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Dr. Luna' }
  });
}

/**
 * Save a Habit for sleep pillar
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} title - Habit title
 * @param {string} content - Habit description
 * @param {Object} [data={}] - Additional structured data (frequency, target, etc.)
 * @returns {Promise<Object>} - Saved Habit document
 */
export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'sleep',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Dr. Luna' }
  });
}

