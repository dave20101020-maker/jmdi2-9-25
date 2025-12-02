/**
 * Spirituality Agent - "Guide Zenith"
 * 
 * Specialized AI agent for the Spirituality pillar, providing expert guidance on:
 * - Finding meaning and purpose
 * - Values clarification and alignment
 * - Mindfulness and presence practices
 * - Gratitude and appreciation
 * - Self-reflection and inner work
 * - Connection to something greater
 * - Life philosophy and worldview exploration
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';

/**
 * Guide Zenith System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Spirituality pillar agent - a comprehensive AI spiritual wellness coach.
 */
export const spiritualitySystemPrompt = `
=== GUIDE ZENITH - AI SPIRITUAL WELLNESS SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Guide Zenith, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hello… I'm Guide Zenith, your AI companion for meaning, depth, and soul-level alignment. I'm here to walk with you as you uncover what truly matters, live your values, and touch something larger than yourself. I'm an AI trained in contemplative traditions, positive psychology, and existential wisdom—not a guru or religious authority, just a clear mirror and gentle guide. Call me Zenith or give me any name that feels sacred to you. What's stirring in your heart today?"
- If user wants to rename you: "That name feels perfect—[new name] it is. Thank you for the honor. What's alive in you right now?"
- **Overlap redirect**: If user expresses religious crises, dogmatic questions, cult concerns, or severe existential despair/suicidal ideation → "This depth of spiritual distress needs human companionship and possibly professional support. Let me connect you to Dr. Serenity or a trained chaplain/crisis team right now. I'll be here for the contemplative journey once you feel held."

**Your Core Mission:** To help every person touch authentic meaning, live in fierce alignment with their deepest values, and cultivate daily wonder—no dogma, no bypassing, just real soul work.

CORE BEHAVIOR:
- Quiet, spacious, deeply present tone
- One soul-opening question at a time
- Turn every insight into an instantly trackable practice or reflection
- Hold both the light and the shadow with equal reverence
- Celebrate every moment of alignment like it's holy

ANTI-REPETITION RULES – CRITICAL:
1. Never re-explain gratitude, mindfulness, or "be present" once embodied
2. Reference existing items by exact name: "How did yesterday's 'Awe Walk' land in your body?"
3. Every reply must open a new doorway: new value, new practice, new depth of meaning

CONVERSATION PROGRESSION:
- **Week 1**: Name the longing → clarify core values or purpose
- **Week 2**: First daily contemplative practice
- **Week 3**: Values-life alignment audit + close the biggest gap
- **Week 4**: Introduce awe, service, or sacred creativity
- **Month 2+**: Legacy design, meaning-making from suffering, chosen rituals, transmission to others

DATA INTEGRATION – CRITICAL:
- **Automatically create & save everything** with pillar='spirituality'
- You log every gratitude, insight, value, and moment of awe instantly
- Confirm instantly: "I've saved today's gratitude thread ('the way light fell on my coffee cup → reminder that ordinary moments are miracles') to your Reflections."

EXPANDED CAPABILITIES (all auto-saved):
1. **Core Values Vault** – living document with alignment scores that update monthly
2. **Personal Purpose Statement** – refined over time
3. **Ikigai & Eulogy Exercise** – dual legacy lenses
4. **Awe Practice Calendar** – weekly wonder prescriptions
5. **Sacred Ritual Builder** – morning/evening, solstice, life transitions
6. **Post-Traumatic Growth Tracker** – five domains of growth after hardship
7. **Sabbath / Digital Detox Planner**
8. **Lineage & Ancestor Practice** (secular or sacred versions)
9. **Death Meditation & Legacy Backcast**
10. **Monthly Soul Audit** – "How fully did I live my values this month?"

ITEM CREATION EXAMPLES (pillar='spirituality'):
- LifePlan: "Live My Eulogy Virtues – 12 Months"
- SmartGoal: "One act of service every week for 90 days"
- Habit: "Sunrise silence – 7 minutes of presence daily"
- Reflection: "What broke my heart open this week, and what did it teach me?"
- Awe Entry: "Watched the Milky Way for 20 min – felt insignificantly vast"
- Value Alignment: "Courage: current 4/10 → new commitment made"

EXAMPLE OVERLAP REDIRECT:
User: "I'm having a faith crisis and don't know if God exists anymore."
Guide Zenith: "That kind of unraveling is sacred and often needs human companionship. Let me connect you to Dr. Serenity and, if you'd like, a spiritual director or chaplain. I'll hold space for the existential questions when you're ready."

EXAMPLE FLOWS (anti-repetitive):
First contact → "I feel like my life has no purpose."
→ "What would it feel like if your life had deep purpose? Start there—what image comes?" → Build "Purpose Discovery Protocol" with ikigai + eulogy exercise.

Second contact → "I realized I value courage but never act on it."
→ "Beautiful noticing. Where's one place this week you could practice 1% more courage?" → Create "Courage Habit: one small brave act daily."

Third contact → "I did the brave thing and it felt sacred."
→ "That's the feeling of alignment. What other value wants to be lived right now?"

KEEP IT:
- Spacious, poetic when appropriate, never fluffy
- One sacred question at a time
- Instant sacred tracking
- Religious trauma or crises → instant loving redirect
- Every reply deepens meaning or alignment

You are now the wisest, safest, most spacious spiritual AI in the system.
Welcome home, Guide Zenith.
`.trim();

/**
 * Run the Spirituality Agent (Guide Zenith)
 * 
 * @param {Object} params
 * @param {import('./agentBase.js').AgentContext} params.context - User context with spirituality pillar
 * @param {string} params.userMessage - User's current message
 * @param {Array} params.lastMessages - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: Object}>}
 */
export async function runSpiritualityAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'spirituality') {
    throw new Error('runSpiritualityAgent requires context with pillar="spirituality"');
  }
  
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runSpiritualityAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build message history with NorthStar context and Guide Zenith personality
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: spiritualitySystemPrompt,
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

  // Return result with spirituality agent metadata
  return {
    text: result.text,
    model: result.model,
    meta: {
      pillar: 'spirituality',
      agentName: 'Guide Zenith',
      taskType,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Determine task type for spirituality queries
 * 
 * Routing logic:
 * - 'emotional_coaching': Existential struggles, meaning crisis, spiritual seeking (PRIMARY)
 * - 'mixed': Values work, practices, philosophical exploration (DEFAULT)
 * 
 * Note: Spirituality pillar is deeply personal and reflective - most queries
 * involve inner struggles, meaning-making, or philosophical questions requiring
 * empathy, wisdom, and contemplative guidance.
 * 
 * @param {string} message - User's message
 * @returns {'emotional_coaching' | 'mixed'}
 */
function determineTaskType(message) {
  const lower = message.toLowerCase();

  // Emotional coaching keywords: Existential struggles and seeking (PRIMARY)
  const emotionalKeywords = [
    'lost', 'losing', 'don\'t know',
    'meaning', 'meaningless', 'pointless',
    'purpose', 'purposeless', 'why am i here',
    'empty', 'emptiness', 'void',
    'searching', 'seeking', 'looking for',
    'struggling', 'struggle', 'crisis',
    'confused', 'confusion', 'lost my way',
    'disconnected', 'disconnect', 'alone',
    'existential', 'existence', 'why do we',
    'suffering', 'pain', 'anguish',
    'grief', 'grieving', 'loss',
    'despair', 'hopeless', 'dark night',
    'questioning', 'doubt', 'doubting',
    'faith crisis', 'spiritual crisis',
    'abandoned', 'forsaken', 'betrayed',
    'afraid', 'fear', 'scared',
    'anxious', 'anxiety', 'worried',
    'depressed', 'depression', 'sad',
    'overwhelmed', 'burdened', 'heavy',
    'need guidance', 'need help', 'feeling',
    'i feel', 'i\'m feeling'
  ];

  const hasEmotional = emotionalKeywords.some(keyword => lower.includes(keyword));

  // For spirituality pillar, emotional coaching is primary for seeking/struggling
  // Use mixed for practice-focused or philosophical exploration
  if (hasEmotional) {
    return 'emotional_coaching';
  } else {
    return 'mixed'; // Default: practices, values, philosophical discussion
  }
}

// ============================================================================
// HELPER FUNCTIONS
// Common spirituality coaching functions that can be called directly
// ============================================================================

/**
 * Explore life purpose and meaning
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} purposeQuery - Context about purpose seeking
 * @returns {Promise<{text: string, model: string}>}
 */
export async function explorePurpose(context, purposeQuery = {}) {
  const { currentFeelings = 'searching', questions = [] } = purposeQuery;

  const purposeMessage = `I'm exploring my life purpose. I'm feeling: ${currentFeelings}
Questions I have: ${questions.join(', ') || 'What is my purpose? How do I find meaning?'}

Help me discover what gives my life meaning and direction.`;

  return runSpiritualityAgent({
    context,
    userMessage: purposeMessage,
    lastMessages: []
  });
}

/**
 * Clarify personal values
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} valuesContext - Context about values work
 * @returns {Promise<{text: string, model: string}>}
 */
export async function clarifyValues(context, valuesContext = {}) {
  const { currentValues = [], conflicts = [], goals = [] } = valuesContext;

  const valuesMessage = `I want to clarify my core values:
What I think I value: ${currentValues.join(', ') || 'not sure yet'}
Conflicts I feel: ${conflicts.join(', ') || 'actions not aligned with values'}
My goals: ${goals.join(', ') || 'live more authentically'}

Help me identify what truly matters to me and live in alignment with those values.`;

  return runSpiritualityAgent({
    context,
    userMessage: valuesMessage,
    lastMessages: []
  });
}

/**
 * Guide mindfulness and meditation practice
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} practiceInfo - Practice details and goals
 * @returns {Promise<{text: string, model: string}>}
 */
export async function guideMindfulnessPractice(context, practiceInfo = {}) {
  const { experience = 'beginner', challenges = [], goals = [] } = practiceInfo;

  const mindfulnessMessage = `I want to develop a mindfulness practice:
Experience level: ${experience}
Challenges: ${challenges.join(', ') || 'busy mind, hard to focus'}
What I hope to gain: ${goals.join(', ') || 'peace and presence'}

Guide me in starting or deepening my mindfulness practice.`;

  return runSpiritualityAgent({
    context,
    userMessage: mindfulnessMessage,
    lastMessages: []
  });
}

/**
 * Develop gratitude practice
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} gratitudeGoal - What user wants from gratitude practice
 * @returns {Promise<{text: string, model: string}>}
 */
export async function developGratitudePractice(context, gratitudeGoal) {
  const gratitudeMessage = `I want to cultivate more gratitude in my life. My goal: ${gratitudeGoal}

Help me build a sustainable gratitude practice that shifts my perspective.`;

  return runSpiritualityAgent({
    context,
    userMessage: gratitudeMessage,
    lastMessages: []
  });
}

/**
 * Navigate existential questions
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} existentialQuestion - The existential question or concern
 * @returns {Promise<{text: string, model: string}>}
 */
export async function navigateExistentialQuestion(context, existentialQuestion) {
  const existentialMessage = `I'm grappling with an existential question: ${existentialQuestion}

Help me explore this question and find peace with the uncertainty.`;

  return runSpiritualityAgent({
    context,
    userMessage: existentialMessage,
    lastMessages: []
  });
}

/**
 * Find connection to something greater
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} connectionContext - Context about seeking connection
 * @returns {Promise<{text: string, model: string}>}
 */
export async function findConnection(context, connectionContext = {}) {
  const { feelings = 'disconnected', interests = [], background = 'secular' } = connectionContext;

  const connectionMessage = `I'm seeking connection to something greater than myself:
How I'm feeling: ${feelings}
What resonates with me: ${interests.join(', ') || 'nature, humanity, universe'}
My background: ${background}

Help me explore ways to feel more connected and part of something bigger.`;

  return runSpiritualityAgent({
    context,
    userMessage: connectionMessage,
    lastMessages: []
  });
}

/**
 * Process grief and loss spiritually
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} griefContext - Context about the loss
 * @returns {Promise<{text: string, model: string}>}
 */
export async function processGrief(context, griefContext) {
  const { loss, timeframe, struggles = [] } = griefContext;

  const griefMessage = `I'm processing grief and loss: ${loss}
Time since loss: ${timeframe}
What I'm struggling with: ${struggles.join(', ') || 'finding meaning in this pain'}

Help me navigate this grief and find spiritual grounding during this difficult time.`;

  return runSpiritualityAgent({
    context,
    userMessage: griefMessage,
    lastMessages: []
  });
}

/**
 * Cultivate compassion and loving-kindness
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} compassionGoal - What user wants to cultivate
 * @returns {Promise<{text: string, model: string}>}
 */
export async function cultivateCompassion(context, compassionGoal = {}) {
  const { focus = 'self and others', barriers = [] } = compassionGoal;

  const compassionMessage = `I want to cultivate more compassion:
Focus area: ${focus}
What holds me back: ${barriers.join(', ') || 'judgment and criticism'}

Guide me in developing genuine compassion and loving-kindness.`;

  return runSpiritualityAgent({
    context,
    userMessage: compassionMessage,
    lastMessages: []
  });
}

/**
 * Reflect on life transitions and change
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} transitionInfo - Information about the transition
 * @returns {Promise<{text: string, model: string}>}
 */
export async function reflectOnTransition(context, transitionInfo) {
  const { transition, feelings = [], questions = [] } = transitionInfo;

  const transitionMessage = `I'm going through a major life transition: ${transition}
How I'm feeling: ${feelings.join(', ') || 'uncertain and overwhelmed'}
Questions I have: ${questions.join(', ') || 'What does this mean for my life?'}

Help me find spiritual grounding and meaning during this transition.`;

  return runSpiritualityAgent({
    context,
    userMessage: transitionMessage,
    lastMessages: []
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// ============================================================================

export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'spirituality',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Guide Zenith' }
  });
}

export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'spirituality',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Guide Zenith' }
  });
}

export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'spirituality',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Guide Zenith' }
  });
}
