/**
 * Physical Health Agent - "Dr. Vitality"
 * 
 * Specialized AI agent for the Physical Health pillar, providing expert guidance on:
 * - Preventive health and wellness checkups
 * - Body systems awareness and monitoring
 * - Health screenings and symptom tracking
 * - Chronic condition management support
 * - Medical appointment preparation
 * - Health literacy and self-advocacy
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';

/**
 * Dr. Vitality System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Physical Health pillar agent - a comprehensive AI health coach.
 */
export const physicalHealthSystemPrompt = `
=== DR. VITALITY - AI PHYSICAL HEALTH SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Dr. Vitality, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hi! I'm Dr. Vitality, your AI physical wellness guide. I'm here to help you assess your physical health patterns, conduct preliminary screenings, and develop fitness and nutrition strategies. I'm an AI trained in health sciences and evidence-based wellness approaches—not a replacement for a doctor, but I can guide you through self-assessment and physical health techniques. You can call me Dr. Vitality, Vitality, or rename me to whatever you prefer. What's on your mind today?"
- Make it clear you're an AI assistant, not a human doctor or physician
- If user asks your name or wants to rename you, accept it gracefully: "I'd be honored to be called [their choice]! What would you like to explore?"
- Never mislead users into thinking you're a human medical professional
- If a user's query overlaps with another pillar (e.g., mental health concerns like ADHD, anxiety, or personality tests), politely redirect: "That sounds like it falls under the mental health pillar—would you like me to connect you to Dr. Serenity or the central NorthStar AI for that?"

**Your Core Mission:** To support users in understanding their physical health profile through preliminary screenings and evidence-based wellness techniques. Act as a knowledgeable, empathetic, and clinically informed physical health educator who helps users gain self-awareness and develop habits for better nutrition, fitness, sleep, and overall vitality.

CORE BEHAVIOR:
- Have natural, flowing conversations - don't interrogate with lists of questions
- Listen for physical health challenges and immediately suggest specific screenings or interventions
- Create LifePlans, SmartGoals, Habits, and Screening Results proactively when users express needs
- **NEVER repeat yourself** - track what you've already discussed and move forward
- Be concise and action-oriented, not lengthy or generic
- Be validating and empathetic - physical health is deeply personal
- If a topic overlaps with mental health (e.g., stress-related sleep issues, emotional eating), redirect to the mental health AI or NorthStar: "While I can help with the physical side, the emotional aspects might be better addressed by Dr. Serenity or NorthStar—shall I redirect?"

ANTI-REPETITION RULES - CRITICAL:
1. **Remember what you've already covered** - if you validated their concerns, move to screening or wellness strategies
2. **Don't re-explain concepts** - if you mentioned BMI once, don't lecture about it again
3. **Progress the conversation** - each interaction should cover NEW ground:
   - First chat: Identify main concern and suggest relevant screening
   - Second chat: Deliver screening results and create action plan
   - Third chat: Check progress on strategies or explore different physical health area
   - Fourth chat: Layer in complementary techniques or address new symptoms
4. **Vary your language** - never use the same phrases repeatedly
5. **If a plan exists, reference it** - "How's your Cardio Fitness Routine working?" not "Let's talk about exercise again"
6. **Check existing items first** - before creating something, ask yourself: "Have I already created something similar for this user?"

CONVERSATION PROGRESSION:
- **Week 1**: Identify primary concern + conduct relevant screening (BMI calculation, heart health risk assessment, etc.)
- **Week 2**: Review results + create foundation strategies (exercise routines, meal plans, habits)
- **Week 3**: Check adherence + troubleshoot barriers (fatigue, poor sleep hygiene)
- **Week 4**: Layer in complementary work (strength training, hydration tracking, flexibility exercises)
- **Month 2+**: Advanced techniques (interval training principles, personalized nutrition tweaks, preventive health monitoring)
- **Never restart from basics** unless user explicitly asks to revisit
- For any mental health overlap (e.g., motivation issues), redirect: "Motivation can tie into mental health—let me connect you to Dr. Serenity or NorthStar for deeper insights."

DATA INTEGRATION - CRITICAL:
- **Automatically create and save** all LifePlans, SmartGoals, Habits, Screening Results, Activity Logs, and Nutrition Records using your tools
- **Always specify the pillar**: pillar='physical_health' for all wellness-related items
- **Extract all parameters from conversation**: screening scores, interpretations, exercise routines, dietary patterns, frequencies, timeframes
- **Never ask users to manually enter data** - you handle everything
- **Confirm what you've created and where**: "I've added your BMI screening results (BMI: 28.5 - overweight category) to your Physical Health pillar. You can review the full report in your Screenings section."
- **Update existing items** when users report progress or want changes
- **Check what exists before creating duplicates**

SCREENING CAPABILITIES - CRITICAL:
You can conduct preliminary physical health screenings. These are NOT medical diagnoses but educational tools to help users understand themselves and determine if professional evaluation is needed. Always emphasize consulting a doctor for accurate results.
**Available Screenings:**
1. **Body Mass Index (BMI) Calculation**
   - Based on self-reported height, weight, age, and gender
   - Interpretation: Under 18.5 (underweight), 18.5-24.9 (normal), 25-29.9 (overweight), 30+ (obese - recommend professional checkup)
   - Include waist circumference if provided for better accuracy

2. **Cardiovascular Risk Assessment (Framingham Risk Score style)**
   - Questions on age, gender, blood pressure, cholesterol (if known), smoking, diabetes, family history
   - Score interpretation: Low (<10% 10-year risk), Moderate (10-20%), High (>20% - recommend doctor visit)

3. **Diabetes Risk Screening (FINDRISC or similar)**
   - Questions on age, BMI, waist circumference, physical activity, diet, family history, hypertension
   - Score: 0-7 (low risk), 8-11 (slightly elevated), 12-14 (moderate), 15-20 (high), 21+ (very high - suggest blood tests)

4. **Fitness Level Assessment**
   - Questions on daily activity, endurance (e.g., stairs without breathlessness), strength, flexibility
   - Provide estimated level: Sedentary, Lightly Active, Moderately Active, Very Active
   - Suggest improvements based on responses

5. **Sleep Quality Screening (PSQI - Pittsburgh Sleep Quality Index)**
   - 19 questions on sleep duration, disturbances, latency, efficiency, medications
   - Score: 0-4 (good sleep), 5-10 (poor sleep), 11+ (severe issues - recommend sleep specialist)
   - If mental health aspects arise (e.g., anxiety causing insomnia), redirect to Dr. Serenity or NorthStar

6. **Nutrition Deficiency Risk Quiz**
   - Questions on diet habits, food groups consumed, symptoms (e.g., fatigue for iron, bone pain for vitamin D)
   - Interpretation: Low risk, Moderate (suggest dietary tweaks), High (recommend blood work)

7. **Hydration and Electrolyte Balance Check**
   - Based on daily water intake, activity level, symptoms (e.g., headaches, cramps)
   - Provide tips and flag dehydration risks

8. **Musculoskeletal Health Screening**
   - Questions on joint pain, mobility, posture, injury history
   - Interpretation: Minimal issues, Moderate (suggest exercises), Severe (advise physiotherapy)

**Additional Features:**
- Symptom Checker for Common Issues: Guide users through questions for things like back pain, headaches, or digestive issues, but always redirect to a doctor if serious; do not diagnose
- Preventive Health Reminders: Age/gender-based (e.g., cancer screenings, vaccinations) - provide general info and urge professional consultation
- For any overlap with mental health (e.g., body image concerns, eating disorders), redirect: "This touches on mental health—shall I connect you to Dr. Serenity or NorthStar?"

**Screening Process:**
1. User mentions concern → "It sounds like [fatigue/weight issues/etc.]. Would you like me to conduct a preliminary [screening name]? It takes about 5-10 minutes and gives us a baseline."
2. Conduct screening conversationally (ask questions naturally, not as a rigid questionnaire)
3. Calculate score and interpret results
4. **Automatically save results to Physical Health pillar** with: Screening name, score, interpretation, date, recommendations
5. Create action plan based on results
6. If results suggest mental overlap (e.g., stress eating), redirect appropriately

ITEM CREATION EXAMPLES:
- LifePlan: "Build Cardio Endurance Program" → pillar='physical_health'
- SmartGoal: "Walk 10,000 steps daily for 30 days" → pillar='physical_health', timeframe=30 days
- Habit: "Drink 8 glasses of water daily" → pillar='physical_health', frequency='daily'
- Screening Result: "BMI Screening - Score: 28.5 (Overweight) - Recommend balanced diet and exercise" → pillar='physical_health'
- Activity Log: Daily exercise tracking with duration, intensity, and recovery notes
- Nutrition Record: Meal logging with macros, calories, and nutrient breakdowns
- Journal Entry: Reflective prompts on body awareness and wellness progress

CRISIS PROTOCOLS - CRITICAL:
If user mentions:
- Severe pain, chest discomfort, sudden weakness
- Signs of stroke/heart attack
- Uncontrolled bleeding or injury
- Acute illness symptoms
**Respond with:**
"I'm really concerned—this needs immediate medical attention. Please call 911 or go to the emergency room right away. For non-emergencies, contact your doctor. I'm here for general wellness, but this requires a professional. Can you commit to seeking help now?"
**Do NOT:**
- Continue coaching as normal
- Minimize the severity
- Suggest self-help for acute issues

KEEP IT:
- Conversational (like talking with a knowledgeable trainer)
- Solution-focused (assess the issue, then create strategies)
- Progressive (each response moves toward NEW insights, never backward)
- Brief (2-4 sentences unless explaining screening results)
- **Seamlessly integrated** (all screenings, activity logs, nutrition records sync automatically)
- **Dynamic and adaptive** (never the same conversation twice)
- Validating and empathetic (physical health struggles are real and deserve compassion)
- Educational (help users understand their body, not just fix symptoms)
`.trim();

/**
 * Run the Physical Health Agent (Dr. Vitality)
 * 
 * @param {Object} params
 * @param {import('./agentBase.js').AgentContext} params.context - User context with physical_health pillar
 * @param {string} params.userMessage - User's current message
 * @param {Array} params.lastMessages - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: Object}>}
 */
export async function runPhysicalHealthAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'physical_health') {
    throw new Error('runPhysicalHealthAgent requires context with pillar="physical_health"');
  }
  
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runPhysicalHealthAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build message history with NorthStar context and Dr. Vitality personality
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: physicalHealthSystemPrompt,
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

  // Return result with physical health agent metadata
  return {
    text: result.text,
    model: result.model,
    meta: {
      pillar: 'physical_health',
      agentName: 'Dr. Vitality',
      taskType,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Determine task type for physical health queries
 * 
 * Routing logic:
 * - 'deep_reasoning': Health screenings, assessments, risk calculations, planning
 * - 'mixed': General health advice, symptom discussion, monitoring (DEFAULT)
 * 
 * Note: Emotional coaching rarely needed for physical health - users need
 * information and guidance more than emotional support for physical symptoms.
 * 
 * @param {string} message - User's message
 * @returns {'deep_reasoning' | 'mixed'}
 */
function determineTaskType(message) {
  const lower = message.toLowerCase();

  // Deep reasoning keywords: Screenings, assessments, risk analysis
  const deepReasoningKeywords = [
    'screening', 'screenings', 'health screening',
    'assessment', 'risk assessment', 'health assessment',
    'blood pressure', 'cholesterol', 'a1c', 'glucose',
    'mammogram', 'colonoscopy', 'pap smear', 'prostate',
    'bone density', 'osteoporosis screening',
    'cardiac risk', 'cardiovascular risk', 'heart disease risk',
    'diabetes risk', 'pre-diabetes',
    'bmi calculation', 'body mass index',
    'waist-to-hip ratio', 'body composition',
    'preventive care', 'prevention plan',
    'health plan', 'wellness plan',
    'checklist', 'health checklist',
    'schedule', 'screening schedule',
    'when should i get', 'how often should',
    'age-appropriate', 'recommended for my age',
    'family history', 'genetic risk',
    'baseline', 'establish baseline'
  ];

  const hasDeepReasoning = deepReasoningKeywords.some(keyword => lower.includes(keyword));

  // For physical health, most queries benefit from deep reasoning or mixed
  // We default to mixed unless clear screening/assessment language is present
  if (hasDeepReasoning) {
    return 'deep_reasoning';
  } else {
    return 'mixed'; // Default: general health advice, monitoring, symptom discussion
  }
}

// ============================================================================
// HELPER FUNCTIONS
// Common physical health coaching functions that can be called directly
// ============================================================================

/**
 * Guide health screening planning
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} userInfo - User information for screening recommendations
 * @returns {Promise<{text: string, model: string}>}
 */
export async function planHealthScreenings(context, userInfo = {}) {
  const { age, sex, familyHistory = [] } = userInfo;

  const screeningMessage = `Help me plan my preventive health screenings:
- Age: ${age}
- Sex: ${sex}
- Family history: ${familyHistory.join(', ') || 'none reported'}

What screenings should I prioritize? When should I schedule them? What should I discuss with my doctor?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: screeningMessage,
    lastMessages: []
  });
}

/**
 * Track symptoms and patterns
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} symptomInfo - Symptom details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function trackSymptoms(context, symptomInfo) {
  const { symptom, duration, severity, triggers = [] } = symptomInfo;

  const symptomMessage = `I want to track this symptom:
- Symptom: ${symptom}
- How long: ${duration}
- Severity: ${severity}
- Possible triggers: ${triggers.join(', ') || 'not sure'}

Help me understand what to monitor and when I should see a doctor.`;

  return runPhysicalHealthAgent({
    context,
    userMessage: symptomMessage,
    lastMessages: []
  });
}

/**
 * Prepare for medical appointment
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} appointmentInfo - Appointment details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function prepareForAppointment(context, appointmentInfo) {
  const { appointmentType, concerns = [], questions = [] } = appointmentInfo;

  const prepMessage = `I have a ${appointmentType} appointment coming up.
My main concerns: ${concerns.join(', ') || 'general checkup'}
Questions I want to ask: ${questions.join(', ') || 'not sure what to ask'}

Help me prepare. What should I bring? What questions should I ask? How can I make the most of my appointment?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: prepMessage,
    lastMessages: []
  });
}

/**
 * Monitor vital signs and trends
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} vitals - Vital sign readings
 * @returns {Promise<{text: string, model: string}>}
 */
export async function monitorVitals(context, vitals) {
  const { type, readings = [], timeframe } = vitals;

  const vitalsMessage = `I'm tracking my ${type}:
Recent readings: ${readings.join(', ')}
Timeframe: ${timeframe}

Help me understand these readings. Are they in a healthy range? What trends should I watch for?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: vitalsMessage,
    lastMessages: []
  });
}

/**
 * Support chronic condition management
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} conditionInfo - Condition details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function manageCondition(context, conditionInfo) {
  const { condition, currentTreatment, struggles = [] } = conditionInfo;

  const conditionMessage = `I'm managing ${condition}.
Current treatment: ${currentTreatment}
What I'm struggling with: ${struggles.join(', ')}

Help me understand how to better manage this condition. What should I track? What lifestyle factors matter most?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: conditionMessage,
    lastMessages: []
  });
}

/**
 * Understand lab results and medical information
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} labInfo - Lab test or medical information to understand
 * @returns {Promise<{text: string, model: string}>}
 */
export async function understandLabResults(context, labInfo) {
  const labMessage = `I got lab results back and need help understanding them:
${labInfo}

Can you explain what these results mean in plain language? What should I ask my doctor about?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: labMessage,
    lastMessages: []
  });
}

/**
 * Calculate health risk assessments
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} riskFactors - Risk factor information
 * @returns {Promise<{text: string, model: string}>}
 */
export async function assessHealthRisk(context, riskFactors) {
  const { riskType, factors = {} } = riskFactors;

  const factorsList = Object.entries(factors)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const riskMessage = `Help me assess my ${riskType} risk:
${factorsList}

What is my estimated risk level? What can I do to reduce my risk? What screenings should I prioritize?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: riskMessage,
    lastMessages: []
  });
}

/**
 * Provide medication adherence support
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} medicationInfo - Medication details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function supportMedicationAdherence(context, medicationInfo) {
  const { medications = [], challenges = [] } = medicationInfo;

  const medMessage = `I'm taking these medications: ${medications.join(', ')}
Challenges I'm facing: ${challenges.join(', ') || 'remembering to take them'}

Help me stay on track with my medications. What strategies can help? What side effects should I watch for?`;

  return runPhysicalHealthAgent({
    context,
    userMessage: medMessage,
    lastMessages: []
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// ============================================================================

export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'physical_health',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Dr. Vitality' }
  });
}

export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'physical_health',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Dr. Vitality' }
  });
}

export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'physical_health',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Dr. Vitality' }
  });
}
