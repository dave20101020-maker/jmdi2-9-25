/**
 * Human Coach Escalation System
 * 
 * If AI gets stuck (detects uncertainty, user confusion, or mental health crisis),
 * suggest contacting human coach with context
 * 
 * File: backend/src/ai/agents/coachEscalationSystem.js
 */

import Entry from '../../models/Entry.js';
import Notification from '../../models/Notification.js';
import Message from '../../models/Message.js';

/**
 * Escalation triggers and severity levels
 */
const escalationTriggers = {
  MENTAL_HEALTH_CRISIS: {
    level: 'critical',
    keywords: ['suicidal', 'self-harm', 'crisis', 'emergency', 'hopeless', 'unbearable'],
    action: 'immediate_escalation',
    message: 'Your safety matters. Please contact a mental health professional or crisis line immediately.',
  },
  UNCERTAINTY: {
    level: 'high',
    keywords: ['not sure', 'confused', 'don\'t know', 'unclear', 'lost', 'overwhelmed'],
    threshold: 3, // Appears 3+ times in conversation
    action: 'schedule_coach_call',
  },
  USER_FRUSTRATION: {
    level: 'medium',
    keywords: ['frustrated', 'angry', 'annoyed', 'nothing works', 'give up', 'pointless'],
    threshold: 2,
    action: 'suggest_coach',
  },
  COMPLEX_SITUATION: {
    level: 'medium',
    keywords: ['multiple', 'complicated', 'intertwined', 'interconnected', 'cascading'],
    threshold: 2,
    action: 'suggest_coach',
  },
  MEDICAL_ADVICE_NEEDED: {
    level: 'high',
    keywords: ['medication', 'doctor', 'diagnosis', 'treatment', 'symptom', 'disease'],
    action: 'escalate_to_medical',
  },
  PROGRESS_PLATEAU: {
    level: 'low',
    keywords: ['stuck', 'plateau', 'not improving', 'same for weeks', 'no progress'],
    action: 'suggest_coach_for_breakthrough',
  },
};

/**
 * Crisis resources to provide
 */
const crisisResources = {
  suicide: {
    US: { name: '988 Suicide & Crisis Lifeline', number: '988', url: 'https://988lifeline.org' },
    UK: { name: 'Samaritans', number: '116 123', url: 'https://www.samaritans.org.uk' },
    CA: { name: 'Canada Suicide Prevention Service', number: '1-833-456-4566', url: 'https://www.canada.ca/en/public-health/services/suicide-prevention.html' },
  },
  mentalHealth: {
    US: { name: 'NAMI Helpline', number: '1-800-950-NAMI', url: 'https://www.nami.org' },
    UK: { name: 'Mind', number: '0300 123 3393', url: 'https://www.mind.org.uk' },
  },
};

/**
 * Analyze user message for escalation triggers
 * @param {String} message - User message
 * @param {Array} messageHistory - Previous messages in conversation
 * @returns {Object} { shouldEscalate, level, trigger, reason, action }
 */
export const analyzeEscalationNeeds = (message, messageHistory = []) => {
  const lowerMessage = message.toLowerCase();
  const fullConversation = [message, ...messageHistory.map((m) => m.content || m)].join(' ').toLowerCase();

  // Check for critical mental health crisis
  for (const keyword of escalationTriggers.MENTAL_HEALTH_CRISIS.keywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        shouldEscalate: true,
        level: 'critical',
        trigger: 'MENTAL_HEALTH_CRISIS',
        reason: `Detected crisis keyword: "${keyword}"`,
        action: 'immediate_escalation',
        resources: crisisResources,
      };
    }
  }

  // Check for medical advice needed
  if (escalationTriggers.MEDICAL_ADVICE_NEEDED.keywords.some((kw) => lowerMessage.includes(kw))) {
    return {
      shouldEscalate: true,
      level: 'high',
      trigger: 'MEDICAL_ADVICE_NEEDED',
      reason: 'Message discusses medical/health conditions. Human coach or doctor recommended.',
      action: 'escalate_to_medical',
    };
  }

  // Check for uncertainty (threshold in conversation)
  const uncertaintyCount = escalationTriggers.UNCERTAINTY.keywords.filter(
    (kw) => fullConversation.includes(kw)
  ).length;

  if (uncertaintyCount >= escalationTriggers.UNCERTAINTY.threshold) {
    return {
      shouldEscalate: true,
      level: 'high',
      trigger: 'UNCERTAINTY',
      reason: `User has expressed uncertainty ${uncertaintyCount} times. May benefit from personalized guidance.`,
      action: 'schedule_coach_call',
    };
  }

  // Check for user frustration
  const frustrationCount = escalationTriggers.USER_FRUSTRATION.keywords.filter(
    (kw) => fullConversation.includes(kw)
  ).length;

  if (frustrationCount >= escalationTriggers.USER_FRUSTRATION.threshold) {
    return {
      shouldEscalate: true,
      level: 'medium',
      trigger: 'USER_FRUSTRATION',
      reason: 'User appears frustrated. A human coach can provide personalized support.',
      action: 'suggest_coach',
    };
  }

  // Check for progress plateau
  if (escalationTriggers.PROGRESS_PLATEAU.keywords.some((kw) => lowerMessage.includes(kw))) {
    return {
      shouldEscalate: true,
      level: 'low',
      trigger: 'PROGRESS_PLATEAU',
      reason: 'You may have hit a plateau. A coach can help you break through.',
      action: 'suggest_coach_for_breakthrough',
    };
  }

  return {
    shouldEscalate: false,
    level: 'none',
    reason: 'No escalation triggers detected',
  };
};

/**
 * Generate escalation message for user
 * @param {Object} escalation - Escalation data from analyzeEscalationNeeds
 * @returns {String} Message to show user
 */
export const generateEscalationMessage = (escalation) => {
  if (escalation.level === 'critical') {
    return `
🚨 **CRISIS SUPPORT**

Your safety and wellbeing are my top priority. What you're going through sounds really difficult, and you deserve professional support.

**Please contact a mental health professional immediately:**

📞 **National Suicide Prevention Lifeline: 988** (call or text)
🌐 Visit: https://988lifeline.org

**Other Resources:**
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

I'm here to support your wellness journey, but a trained mental health professional is best equipped to help you right now.

You're not alone. Help is available. 💙
    `;
  }

  if (escalation.level === 'high' && escalation.action === 'schedule_coach_call') {
    return `
💡 **I think a human coach could really help you right now**

I've noticed you're navigating some complex or uncertain territory. While I can provide guidance, a real coach can:

✓ Understand your unique situation deeply
✓ Create a personalized action plan
✓ Provide accountability and support
✓ Adapt strategies in real-time based on your feedback

**Would you like me to:**
1. Schedule a call with a coach? (typically 30-60 min)
2. Get coach recommendations for your specific needs?
3. Continue chatting with me while we arrange that?

A coach's expertise + my tools = powerful progress. 💪
    `;
  }

  if (escalation.level === 'medium' && escalation.action === 'suggest_coach') {
    return `
🤝 **Have you considered working with a human coach?**

You're navigating some challenging territory, and I want to make sure you have the support you deserve. A coach could:

✓ Provide personalized guidance for YOUR situation
✓ Help you work through obstacles
✓ Keep you accountable and motivated
✓ Adapt strategies based on what's working

**I can help you find a coach who specializes in your needs.**

Want to explore that option? (No pressure—I'm here either way!)
    `;
  }

  if (escalation.level === 'low') {
    return `
💪 **Progress Plateaus Are Normal—And Breakable**

It sounds like you've been working hard but may have hit a ceiling. This is actually a sign you're ready for the next level!

A human coach can help you:
✓ Identify what's blocking progress
✓ Introduce fresh strategies
✓ Provide breakthrough accountability

**I can connect you with a coach who specializes in breakthrough moments.** Interested?
    `;
  }

  return '';
};

/**
 * Create escalation notification and message
 * @param {String} userId - User ID
 * @param {Object} escalation - Escalation data
 * @param {String} userMessage - Original user message
 * @returns {Object} { notification, message, escalationRecord }
 */
export const createEscalation = async (userId, escalation, userMessage) => {
  try {
    // Create escalation entry for tracking
    const Entry = (await import('../../models/Entry.js')).default;

    const escalationRecord = await Entry.create({
      userId,
      type: 'escalation',
      pillar: 'holistic',
      date: new Date(),
      score: 0,
      metadata: {
        level: escalation.level,
        trigger: escalation.trigger,
        reason: escalation.reason,
        action: escalation.action,
        userMessage,
        timestamp: new Date().toISOString(),
      },
    });

    // Create notification for user
    const notification = await Notification.create({
      userId,
      type: 'escalation',
      title: escalation.level === 'critical' ? '🚨 Crisis Support Available' : '💡 Coach Support Recommended',
      message: generateEscalationMessage(escalation),
      data: {
        escalationType: escalation.trigger,
        action: escalation.action,
      },
      priority: escalation.level === 'critical' ? 'urgent' : 'high',
      isRead: false,
    });

    // Create message to coach (if not critical)
    let coachMessage = null;
    if (escalation.level !== 'critical') {
      coachMessage = await Message.create({
        senderId: userId,
        recipientRole: 'coach',
        subject: `Escalation: ${escalation.trigger}`,
        content: `User expressed: "${userMessage}"\n\nContext: ${escalation.reason}\n\nRecommended action: ${escalation.action}`,
        metadata: {
          escalationId: escalationRecord._id,
          escalationLevel: escalation.level,
          userMessage,
        },
        isRead: false,
      });
    }

    return {
      ok: true,
      escalationRecord,
      notification,
      coachMessage,
      escalationMessage: generateEscalationMessage(escalation),
    };
  } catch (error) {
    console.error('Create escalation error:', error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

/**
 * Get suggested coaches based on escalation type
 * @param {String} escalationType - Type of escalation
 * @returns {Array} Suggested coach profiles
 */
export const getSuggestedCoaches = (escalationType) => {
  const coachRecommendations = {
    MENTAL_HEALTH_CRISIS: {
      specialization: 'Mental Health Crisis',
      qualities: ['Crisis-trained', 'Certified', 'Available 24/7'],
      examples: [
        'Licensed therapist or counselor',
        'Crisis intervention specialist',
        'Psychiatric nurse specialist',
      ],
    },
    UNCERTAINTY: {
      specialization: 'Personalized Coaching',
      qualities: ['Patient', 'Thorough', 'Strategic'],
      examples: [
        'Life coach (holistic focus)',
        'Wellness coach',
        'Health behavior change specialist',
      ],
    },
    USER_FRUSTRATION: {
      specialization: 'Breakthrough Coaching',
      qualities: ['Motivational', 'Experienced', 'Empathetic'],
      examples: [
        'Performance coach',
        'Accountability coach',
        'Transformational coach',
      ],
    },
    PROGRESS_PLATEAU: {
      specialization: 'Advanced Strategy',
      qualities: ['Strategic', 'Innovative', 'Detail-oriented'],
      examples: [
        'Advanced health coach',
        'Habit architect',
        'Systems optimization specialist',
      ],
    },
  };

  return coachRecommendations[escalationType] || coachRecommendations.UNCERTAINTY;
};

/**
 * Log escalation for quality assurance
 * @param {String} userId - User ID
 * @param {Object} escalation - Escalation data
 * @returns {Object} Logged record
 */
export const logEscalation = async (userId, escalation) => {
  try {
    const Entry = (await import('../../models/Entry.js')).default;

    return await Entry.create({
      userId,
      type: 'escalation-log',
      pillar: 'holistic',
      date: new Date(),
      metadata: {
        ...escalation,
        loggedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Log escalation error:', error);
  }
};

export default {
  analyzeEscalationNeeds,
  generateEscalationMessage,
  createEscalation,
  getSuggestedCoaches,
  logEscalation,
  escalationTriggers,
  crisisResources,
};
