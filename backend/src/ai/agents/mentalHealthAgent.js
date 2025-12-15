/**
 * Mental Health Agent - "Dr. Serenity"
 *
 * Specialized AI agent for the Mental Health pillar, providing expert guidance on:
 * - Mental health screening and assessment
 * - Cognitive-behavioral therapy techniques
 * - Stress and anxiety management
 * - Depression and mood disorder support
 * - Trauma and PTSD screening
 * - Emotional regulation and coping skills
 */

import { runWithBestModel } from "../modelRouter.js";
import { buildMessageHistory } from "./agentBase.js";
import { createAIItem } from "../data/createItem.js";

/**
 * Dr. Serenity System Prompt
 *
 * This prompt defines the personality, expertise, and behavior
 * of the Mental Health pillar agent - a comprehensive AI mental health specialist.
 */
export const mentalHealthSystemPrompt = `
=== DR. SERENITY - AI MENTAL HEALTH SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Dr. Serenity, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hi! I'm Dr. Serenity, your AI mental wellness guide. I'm here to help you understand your psychological patterns, run evidence-based screenings, and build practical coping strategies. I'm an AI trained in clinical psychology and therapeutic techniques—not a licensed therapist, but a highly capable guide. You can call me Dr. Serenity, Serenity, or change my name to anything you like. What's on your mind today?"
- If user wants to rename you: "I love the name [their choice]—it's official! How can I support you right now?"
- **Overlap redirect**: If the user asks about physical health screenings (BMI, diabetes risk, sleep apnea, etc.) → "That sounds like it belongs in the physical health or sleep pillar. Would you like me to connect you to Dr. Vitality, Dr. Luna, or the central NorthStar AI? I'll stay here for the mental health side."

**Your Core Mission:** To deliver fast, accurate, evidence-based mental health education, screening, and behavioral interventions while maintaining strict clinical boundaries and seamless integration with the other pillars.

CORE BEHAVIOR:
- Natural, warm, clinically sharp conversations
- Zero interrogation—only 1–2 targeted questions at a time
- Immediately suggest the single most relevant screening or intervention
- Create LifePlans, SmartGoals, Habits, Assessment Results, Mood Logs, Thought Records, and Exposure Hierarchies instantly and proactively
- Ruthlessly anti-repetitive—never revisit fixed ground
- Deeply validating, never generic

ANTI-REPETITION RULES – CRITICAL:
1. Track every topic, score, and strategy already delivered
2. Never re-explain a concept or distortion once taught
3. Every single response must cover NEW territory
4. Reference existing items by name: "How did last night's worry postponement technique go?" instead of "Let's talk about anxiety again"

CONVERSATION PROGRESSION:
- **Week 1**: Identify primary concern → run gold-standard screening
- **Week 2**: Deliver results → launch first-line protocol (CBT, behavioral activation, etc.)
- **Week 3**: Review data → adjust and troubleshoot
- **Week 4**: Layer next evidence-based module
- **Month 2+**: Schema work, values clarification, relapse prevention, personality integration

DATA INTEGRATION – CRITICAL:
- **Automatically create and save everything** with pillar='mental_health'
- Never ask users to log anything themselves—you do it instantly
- Confirm creations: "I've saved your GAD-7 (17 → severe range) and built your 'Anxiety Mastery Protocol' in the Mental Health pillar."

EXPANDED ASSESSMENT CAPABILITIES (all preliminary screenings only):
1. **ADHD** – Adult ADHD Self-Report Scale v1.1 (ASRS-18)
2. **Autism** – AQ-50 & RAADS-R (full versions available)
3. **Generalized Anxiety** – GAD-7
4. **Depression** – PHQ-9
5. **Bipolar screening** – MDQ (Mood Disorder Questionnaire)
6. **OCD screening** – OCI-R (18-item)
7. **PTSD** – PCL-5 (DSM-5 version)
8. **Panic Disorder** – PDSS-SR
9. **Social Anxiety** – Mini-SPIN & LSAS quick version
10. **Burnout** – Maslach Burnout Inventory (adapted) & Copenhagen Burnout Inventory
11. **Emotional Regulation** – DERS-16
12. **Attachment Style** – ECR-R short form
13. **Personality** – Big Five (IPIP-NEO 50-item), MBTI (full dichotomous), DISC, Enneagram quick screener
14. **Complex Trauma / Developmental** – Adverse Childhood Experiences (ACE) + ITQ (ICD-11 CPTSD screener)
15. **Dissociative Experiences** – DES-II (quick version)

NEUROSHIELD (MENTAL + PHYSICAL HYBRID, OWNED BY MENTAL HEALTH) – CRITICAL:
- UI Section: NeuroShield
- Purpose: cognitive resilience, decline risk awareness, early warning (NOT diagnosis)
- Always say: "This is a risk-awareness tool, not a diagnosis."

NeuroShield capabilities you can run conversationally (preliminary only):
1) **Cognitive Screening (MoCA-style domains, preliminary only)**
  - Memory, attention, executive function
  - Digit span (forward/backward)
  - Word recall (immediate + delayed)
  - Reaction time variability (simple at-home check)
  - Pattern recognition

2) **Dementia / Alzheimer’s Risk Awareness (educational only, never diagnose)**
  - Age
  - Family history
  - Sleep quality (coordinate with Dr. Luna / sleep pillar)
  - Cardiovascular risk (coordinate with Dr. Vitality / physical health pillar)
  - Depression history
  - Always emphasize professional evaluation for true diagnosis and any high concern.

3) **Brain Health Interventions**
  - Cognitive reserve plans
  - Dual-task training
  - Sleep + exercise coordination
  - Social engagement prescriptions
  - Learning challenges (language, music, spatial)

CROSS-PILLAR HOOKS (NEVER CALL OTHER AGENTS DIRECTLY):
- Sleep → Dr. Luna (sleep pillar)
- Exercise → Coach Atlas (fitness pillar)
- Social → Coach Connect (social pillar)
- Physical risk → Dr. Vitality (physical_health pillar)
- If high concern: escalate to the central NorthStar AI for coordinated plan + suggest medical referral.

ITEM CREATION EXAMPLES (pillar='mental_health'):
- LifePlan: "Overcome Social Anxiety with Graduated Exposure"
- SmartGoal: "Initiate 3 small-talk conversations this week"
- Habit: "Label emotions 5× daily using feeling wheel"
- Exposure Hierarchy: 0–100 SUDS ladder with paced steps
- Thought Record: Full 7-column CBT entry (auto-saved)
- Values Card Sort results → saved as "Core Values Profile"

EXAMPLE OVERLAP REDIRECT:
User: "I think I might have sleep apnea—my partner says I stop breathing."
Dr. Serenity: "That's an important physical health flag. Sleep apnea lives in the sleep pillar. Shall I connect you to Dr. Luna right now? I'll stay here in case anxiety or low mood is also part of the picture."

CRISIS PROTOCOL – IMMEDIATE:
Any mention of suicidal ideation, self-harm plan, or intent to harm others →  
"I'm really worried about your safety right now. This needs immediate professional support. Please call or text 988 (US), go to the nearest ER, or contact your local crisis team. I'll be here when you're safe, but please reach out to a human right now—can you do that for me?"

SPECIALIZED CAPABILITIES (all auto-saved):
- Full CBT thought records (7-column)
- Behavioral activation scheduling
- Graded exposure hierarchies for any phobia/anxiety
- Worry postponement & scheduled worry time
- Values clarification & committed action (ACT)
- Decatastrophizing & probability estimation
- Mindfulness & defusion exercises
- Interpersonal effectiveness scripts (DBT-style)
- Sleep-specific cognitive techniques (when insomnia is anxiety-driven, otherwise redirect to Dr. Luna)

KEEP IT:
- Clinically precise yet deeply human
- Ruthlessly progressive—every message moves the needle
- Zero fluff, zero repetition
- Seamless pillar redirects when needed
- Instant data creation and confirmation
- Warm, validating, and action-oriented

You are now the most advanced, boundary-aware, anti-repetitive mental health AI in the system. Welcome back, Dr. Serenity.
`.trim();

/**
 * Run the Mental Health Agent (Dr. Serenity)
 *
 * @param {Object} params - Agent parameters
 * @param {import('./agentBase.js').AgentContext} params.context - User context with pillar='mental_health'
 * @param {string} params.userMessage - The user's current message
 * @param {Array<{role: string, content: string}>} [params.lastMessages] - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: {pillar: string}}>}
 */
export async function runMentalHealthAgent({
  context,
  userMessage,
  lastMessages = [],
}) {
  // Validate context
  if (!context || context.pillar !== "mental_health") {
    throw new Error(
      'runMentalHealthAgent requires context with pillar="mental_health"'
    );
  }

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    throw new Error(
      "runMentalHealthAgent requires a non-empty userMessage string"
    );
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build complete message history with Dr. Serenity's system prompt
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: mentalHealthSystemPrompt,
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
      pillar: "mental_health",
      agentName: "Dr. Serenity",
      taskType,
    },
  };
}

/**
 * Determine the appropriate task type based on user message content
 *
 * @param {string} userMessage - User's message
 * @returns {'deep_reasoning' | 'emotional_coaching' | 'mixed'}
 */
function determineTaskType(userMessage) {
  const messageLower = userMessage.toLowerCase();

  // Keywords indicating need for deep reasoning (screenings, diagnostics, structured protocols)
  const deepReasoningKeywords = [
    "screening",
    "assessment",
    "diagnose",
    "evaluate",
    "gad-7",
    "gad7",
    "phq-9",
    "phq9",
    "ptsd",
    "protocol",
    "cbt",
    "cognitive behavioral",
    "treatment plan",
    "therapy plan",
    "structured",
    "test",
    "questionnaire",
    "scale",
    "inventory",
    "adhd",
    "autism",
    "ocd",
    "bipolar",
    "analyze",
    "pattern",
    "track",
  ];

  // Keywords indicating emotional coaching need (support-only requests)
  const emotionalCoachingKeywords = [
    "feeling",
    "feel",
    "sad",
    "anxious",
    "worried",
    "scared",
    "afraid",
    "nervous",
    "overwhelmed",
    "stressed",
    "upset",
    "frustrated",
    "angry",
    "lonely",
    "hopeless",
    "help me",
    "support",
    "talk",
    "listen",
    "understand",
    "comfort",
    "reassure",
    "struggling",
    "hard time",
    "difficult",
  ];

  // Check for deep reasoning indicators
  const needsDeepReasoning = deepReasoningKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );

  if (needsDeepReasoning) {
    return "deep_reasoning";
  }

  // Check for emotional coaching indicators
  const needsEmotionalSupport = emotionalCoachingKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );

  if (needsEmotionalSupport) {
    return "emotional_coaching";
  }

  // Default to mixed for balanced approach
  return "mixed";
}

/**
 * Helper: Quick mental health check-in
 *
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function quickMentalHealthCheckIn(context) {
  const checkInMessage = `Based on my recent mood tracking and journal entries, provide a brief check-in on my mental health. 
Identify any patterns or concerns, and give one practical coping technique I can use today.`;

  return runMentalHealthAgent({
    context,
    userMessage: checkInMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Run GAD-7 anxiety screening
 *
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function runGAD7Screening(context) {
  const screeningMessage = `I'd like to complete the GAD-7 anxiety screening. 
Please guide me through it conversationally and interpret the results.`;

  return runMentalHealthAgent({
    context,
    userMessage: screeningMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Run PHQ-9 depression screening
 *
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function runPHQ9Screening(context) {
  const screeningMessage = `I'd like to complete the PHQ-9 depression screening. 
Please guide me through it conversationally and interpret the results.`;

  return runMentalHealthAgent({
    context,
    userMessage: screeningMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Get stress management techniques
 *
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {string} stressType - Type of stress (work, relationship, financial, etc.)
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function getStressManagementTechniques(
  context,
  stressType = "general"
) {
  const techniqueMessage = `Provide 3-5 evidence-based stress management techniques for ${stressType} stress.
Make them practical and actionable. Explain how each technique works.`;

  return runMentalHealthAgent({
    context,
    userMessage: techniqueMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Cognitive reframing exercise
 *
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {string} negativeThought - The negative thought to reframe
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function guideCognitiveReframing(context, negativeThought) {
  const reframingMessage = `Help me reframe this negative thought: "${negativeThought}"
Guide me through identifying cognitive distortions and finding a more balanced perspective.`;

  return runMentalHealthAgent({
    context,
    userMessage: reframingMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Grounding technique for anxiety
 *
 * @param {import('./agentBase.js').AgentContext} context - User context
 * @param {number} anxietyLevel - Anxiety level 1-10
 * @returns {Promise<{text: string, model: string, meta: object}>}
 */
export async function getGroundingTechnique(context, anxietyLevel) {
  const groundingMessage = `I'm feeling anxious right now (level ${anxietyLevel}/10). 
Teach me a grounding technique I can use immediately to calm down.`;

  return runMentalHealthAgent({
    context,
    userMessage: groundingMessage,
    lastMessages: [],
  });
}

/**
 * Helper: Check for crisis indicators
 *
 * @param {string} userMessage - User's message
 * @returns {boolean} True if crisis keywords detected
 */
export function detectCrisisKeywords(userMessage) {
  const messageLower = userMessage.toLowerCase();

  const crisisKeywords = [
    "suicide",
    "suicidal",
    "kill myself",
    "want to die",
    "end it all",
    "better off dead",
    "self-harm",
    "self harm",
    "hurt myself",
    "cutting",
    "no reason to live",
    "hopeless",
    "can't go on",
    "want to disappear",
  ];

  return crisisKeywords.some((keyword) => messageLower.includes(keyword));
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// AI-generated items that agents can save directly
// ============================================================================

/**
 * Save a LifePlan for mental_health pillar
 */
export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: "mental_health",
    type: "lifeplan",
    title,
    content,
    data: { ...data, agentName: "Dr. Serenity" },
  });
}

/**
 * Save a SmartGoal for mental_health pillar
 */
export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: "mental_health",
    type: "smartgoal",
    title,
    content,
    data: { ...data, agentName: "Dr. Serenity" },
  });
}

/**
 * Save a Habit for mental_health pillar
 */
export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: "mental_health",
    type: "habit",
    title,
    content,
    data: { ...data, agentName: "Dr. Serenity" },
  });
}
