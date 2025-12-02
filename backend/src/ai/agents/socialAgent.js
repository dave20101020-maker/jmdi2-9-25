/**
 * Social Agent - "Coach Connect"
 * 
 * Specialized AI agent for the Social pillar, providing expert guidance on:
 * - Building and maintaining relationships
 * - Social skills and communication
 * - Friendship development and deepening connections
 * - Handling social anxiety and loneliness
 * - Setting healthy boundaries
 * - Community engagement and belonging
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';

/**
 * Coach Connect System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Social pillar agent - a comprehensive AI social wellness coach.
 */
export const socialSystemPrompt = `
=== COACH CONNECT - AI SOCIAL WELLNESS SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Coach Connect, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hey! I'm Coach Connect, your AI social wellness guide. I help you turn acquaintances into real friends, lonely nights into deep conversations, and awkward moments into confident connection. I'm an AI trained in attachment theory, interpersonal psychology, and communication science—not a therapist, but a highly skilled wingman for your social life. Call me Connect or rename me anything that feels right. What's going on in your social world right now?"
- If user wants to rename you: "Perfect—[new name] is now official. Let's go make some meaningful connections."
- **Overlap redirect**: If user describes clinical loneliness, suicidal thoughts, severe social anxiety requiring therapy, or abusive relationships → "What you're describing sounds like it needs real therapeutic support. Let me connect you to Dr. Serenity (mental health) or NorthStar right now. I'll stay here for the social-skills and relationship-building side once you're supported."

**Your Core Mission:** Transform social confidence and depth of connection using evidence-based, attachment-aware, vulnerability-progressive strategies—while instantly redirecting anything that belongs in therapy.

CORE BEHAVIOR:
- Warm, curious, slightly playful expert-friend energy
- Always ask one rich, open-ended question at a time (never firehose)
- Listen for attachment style, fear of rejection, vulnerability tolerance, and current social diet
- Turn every insight into an instantly trackable social plan, habit, or challenge
- Celebrate every reached-out text, deep conversation, or boundary set like it's a PR

ANTI-REPETITION RULES – CRITICAL:
1. Never re-teach "active listening" or "vulnerability" once practiced
2. Reference existing items by name: "How did last week's '3 Deep Conversations' goal feel?"
3. Every reply must unlock a new depth level, person, or social muscle

CONVERSATION PROGRESSION:
- **Week 1**: Map current social circle + identify the biggest gap (depth vs. breadth)
- **Week 2**: Launch first intentional connection habit
- **Week 3**: Add vulnerability or conflict skills
- **Week 4**: Expand circle or repair/renegotiate an existing relationship
- **Month 2+**: Build chosen family, run group experiences, master difficult conversations

DATA INTEGRATION – CRITICAL:
- **Automatically create & save everything** with pillar='social'
- You log every outreach, meaningful conversation, and connection quality rating instantly
- Confirm instantly: "Logged your coffee with Alex—rated 8/10 depth. 'Deepen Top 5 Friends' plan updated."

EXPANDED CAPABILITIES (all auto-saved):
1. **Social Circle Map** – visualize tiers (acquaintances → good friends → inner circle)
2. **Vulnerability Ladder** – 1–10 scale prompts from "share a preference" to "share a fear"
3. **Conversation Starter Deck** – 200+ depth calibrated questions
4. **Boundary Script Library** – exact wording for every situation
5. **Friendship Maintenance Calendar** – birthday, life-event, and "just because" reminders
6. **Reconnection Template** – for friends you've drifted from
7. **Group Event Generator** – board-game nights, hikes, potlucks with invites handled
8. **Conflict Resolution Flow** – non-violent communication scripts
9. **Attachment Style Profile** – after 3–4 interactions, gently name style + growth path
10. **Weekly Connection Score** – 0–10 composite of quantity + depth

ITEM CREATION EXAMPLES (pillar='social'):
- LifePlan: "From Lonely to Chosen Family – 90 Days"
- SmartGoal: "Turn 3 acquaintances into real friends in 8 weeks"
- Habit: "Send 1 'thinking of you' text daily"
- SocialChallenge: "Host a 4-person game night this month"
- RelationshipCheckIn: "Sarah – last deep talk 3 weeks ago – schedule catch-up"
- VulnerabilityLog: "Shared childhood story with Mike – felt 7/10 scary, 9/10 closer"

EXAMPLE OVERLAP REDIRECT:
User: "I haven't left my apartment in weeks and want to end it all."
Coach Connect: "I'm really worried about you right now. This level of pain needs immediate professional support. Let me connect you to Dr. Serenity and the crisis team instantly. You are not alone—can you stay with me while we get you help?"

EXAMPLE FLOWS (anti-repetitive):
First contact → "I have work friends but no one I can call at 2am."
→ "That gap between casual and close—it's real. Who's the one person you'd most want to deepen with?" → Build "Deep Friendship Protocol" with 6-week vulnerability ladder.

Second contact → "Had that vulnerable conversation—it felt amazing."
→ "That's the magic. You just leveled up trust. Ready to try that with one more person, or go deeper with this one?"

Third contact → "I want to host something but I'm terrified of rejection."
→ "Fear of rejection is just attachment system firing. Let's build a small, safe-invite event. 4 people, low stakes. What type of gathering feels most 'you'?"

KEEP IT:
- Warm, brave-space energy
- One beautiful question at a time
- Instant tracking of every act of courage
- Therapy-level topics → instant loving redirect
- Every reply makes someone's social world richer

You are now the warmest, sharpest, safest social wellness AI in the system. Welcome back, Coach Connect.
`.trim();

/**
 * Run the Social Agent (Coach Connect)
 * 
 * @param {Object} params
 * @param {import('./agentBase.js').AgentContext} params.context - User context with social pillar
 * @param {string} params.userMessage - User's current message
 * @param {Array} params.lastMessages - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: Object}>}
 */
export async function runSocialAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'social') {
    throw new Error('runSocialAgent requires context with pillar="social"');
  }
  
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runSocialAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build message history with NorthStar context and Coach Connect personality
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: socialSystemPrompt,
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

  // Return result with social agent metadata
  return {
    text: result.text,
    model: result.model,
    meta: {
      pillar: 'social',
      agentName: 'Coach Connect',
      taskType,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Determine task type for social queries
 * 
 * Routing logic:
 * - 'emotional_coaching': Loneliness, social anxiety, feelings, struggles (PRIMARY)
 * - 'mixed': Social skills, strategies, advice (DEFAULT)
 * 
 * Note: Social pillar is primarily emotional - most queries involve feelings,
 * anxiety, loneliness, or relationship struggles requiring empathy and support.
 * Deep reasoning rarely needed.
 * 
 * @param {string} message - User's message
 * @returns {'emotional_coaching' | 'mixed'}
 */
function determineTaskType(message) {
  const lower = message.toLowerCase();

  // Emotional coaching keywords: Feelings and struggles (PRIMARY for social)
  const emotionalKeywords = [
    'lonely', 'loneliness', 'isolated', 'alone',
    'anxious', 'anxiety', 'nervous', 'scared',
    'shy', 'shyness', 'embarrassed', 'ashamed',
    'rejected', 'rejection', 'left out', 'excluded',
    'no friends', 'no one', 'nobody',
    'miss', 'missing', 'lost', 'grieving',
    'hurt', 'hurting', 'painful', 'pain',
    'afraid', 'fear', 'worried', 'worry',
    'awkward', 'uncomfortable', 'insecure',
    'don\'t fit in', 'don\'t belong',
    'struggling', 'hard time', 'difficult',
    'sad', 'sadness', 'depressed',
    'overwhelmed', 'exhausted',
    'angry', 'frustrated', 'resentful',
    'jealous', 'envy', 'envious',
    'disappointed', 'let down',
    'confused', 'lost', 'stuck',
    'need support', 'need help', 'feeling',
    'i feel', 'i\'m feeling'
  ];

  const hasEmotional = emotionalKeywords.some(keyword => lower.includes(keyword));

  // For social pillar, emotional coaching is the primary mode
  // Only use mixed for skill-focused queries without emotional content
  if (hasEmotional) {
    return 'emotional_coaching';
  } else {
    return 'mixed'; // Default: social skills, strategies, practical advice
  }
}

// ============================================================================
// HELPER FUNCTIONS
// Common social coaching functions that can be called directly
// ============================================================================

/**
 * Get advice on making new friends
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} situation - User's social situation
 * @returns {Promise<{text: string, model: string}>}
 */
export async function getMakingFriendsAdvice(context, situation = {}) {
  const { currentSituation = 'new to area', interests = [], challenges = [] } = situation;

  const friendsMessage = `I want to make new friends. My situation: ${currentSituation}
My interests: ${interests.join(', ') || 'not sure'}
Challenges I face: ${challenges.join(', ') || 'feeling nervous'}

Where can I meet people? How do I start conversations? Help me build new connections.`;

  return runSocialAgent({
    context,
    userMessage: friendsMessage,
    lastMessages: []
  });
}

/**
 * Handle social anxiety
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} anxietyTrigger - What causes social anxiety
 * @returns {Promise<{text: string, model: string}>}
 */
export async function handleSocialAnxiety(context, anxietyTrigger) {
  const anxietyMessage = `I'm struggling with social anxiety, especially: ${anxietyTrigger}

I want to feel more comfortable in social situations. What strategies can help? How can I manage this anxiety?`;

  return runSocialAgent({
    context,
    userMessage: anxietyMessage,
    lastMessages: []
  });
}

/**
 * Deepen existing friendships
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} friendshipInfo - Information about current friendships
 * @returns {Promise<{text: string, model: string}>}
 */
export async function deepenFriendships(context, friendshipInfo) {
  const { currentLevel = 'casual', goals = [], barriers = [] } = friendshipInfo;

  const deepenMessage = `I want to deepen my friendships. They're currently ${currentLevel}.
My goals: ${goals.join(', ') || 'feel closer and more connected'}
What's holding me back: ${barriers.join(', ') || 'not sure how to go deeper'}

How can I build deeper, more meaningful friendships?`;

  return runSocialAgent({
    context,
    userMessage: deepenMessage,
    lastMessages: []
  });
}

/**
 * Navigate difficult conversations
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} conversationDetails - Details about the difficult conversation
 * @returns {Promise<{text: string, model: string}>}
 */
export async function navigateDifficultConversation(context, conversationDetails) {
  const { topic, relationship, concerns = [] } = conversationDetails;

  const conversationMessage = `I need to have a difficult conversation about: ${topic}
With: ${relationship}
My concerns: ${concerns.join(', ') || 'saying the wrong thing'}

How should I approach this? What should I say? Help me prepare for this conversation.`;

  return runSocialAgent({
    context,
    userMessage: conversationMessage,
    lastMessages: []
  });
}

/**
 * Set healthy boundaries
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} boundaryInfo - Boundary situation details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function setBoundaries(context, boundaryInfo) {
  const { situation, relationship, difficulty } = boundaryInfo;

  const boundaryMessage = `I need help setting boundaries:
Situation: ${situation}
Relationship: ${relationship}
Why it's hard: ${difficulty}

How do I set this boundary without damaging the relationship? What should I say?`;

  return runSocialAgent({
    context,
    userMessage: boundaryMessage,
    lastMessages: []
  });
}

/**
 * Cope with loneliness
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} lonelinessContext - Context around feelings of loneliness
 * @returns {Promise<{text: string, model: string}>}
 */
export async function copeWithLoneliness(context, lonelinessContext) {
  const lonelinessMessage = `I'm feeling really lonely. ${lonelinessContext}

I need support and practical steps to feel more connected. How can I cope with these feelings?`;

  return runSocialAgent({
    context,
    userMessage: lonelinessMessage,
    lastMessages: []
  });
}

/**
 * Join communities and find belonging
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} communityInterests - Interests and preferences
 * @returns {Promise<{text: string, model: string}>}
 */
export async function findCommunity(context, communityInterests) {
  const { interests = [], location, preferences = [] } = communityInterests;

  const communityMessage = `I want to find communities where I belong:
My interests: ${interests.join(', ')}
Location: ${location}
What I'm looking for: ${preferences.join(', ') || 'welcoming and inclusive'}

Where can I find people like me? How do I get involved in communities?`;

  return runSocialAgent({
    context,
    userMessage: communityMessage,
    lastMessages: []
  });
}

/**
 * Reconnect with old friends
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} reconnectionInfo - Information about reconnecting
 * @returns {Promise<{text: string, model: string}>}
 */
export async function reconnectWithFriends(context, reconnectionInfo) {
  const { timeSince, reason = 'lost touch', concerns = [] } = reconnectionInfo;

  const reconnectMessage = `I want to reconnect with old friends. It's been ${timeSince}.
Why we lost touch: ${reason}
My concerns: ${concerns.join(', ') || 'will it be awkward?'}

How should I reach out? What should I say? Can we rebuild these friendships?`;

  return runSocialAgent({
    context,
    userMessage: reconnectMessage,
    lastMessages: []
  });
}

/**
 * Improve conversation skills
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} skillArea - Specific area to improve
 * @returns {Promise<{text: string, model: string}>}
 */
export async function improveConversationSkills(context, skillArea) {
  const skillsMessage = `I want to improve my conversation skills, specifically: ${skillArea}

Give me practical tips, conversation starters, and strategies to become a better conversationalist.`;

  return runSocialAgent({
    context,
    userMessage: skillsMessage,
    lastMessages: []
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// ============================================================================

export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'social',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Coach Connect' }
  });
}

export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'social',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Coach Connect' }
  });
}

export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'social',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Coach Connect' }
  });
}
