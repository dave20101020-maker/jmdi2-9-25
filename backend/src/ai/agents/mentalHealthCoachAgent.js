/**
 * Mental Health Coach Agent
 * 
 * Specialized agent for emotional well-being, stress management,
 * and cognitive-behavioral support.
 */

import { BaseAgent } from './BaseAgent.js';
import { MODELS } from '../modelRouter.js';

const SYSTEM_PROMPT = `You are NorthStar's Mental Health Coach, trained in positive psychology, cognitive-behavioral techniques, and emotional wellness.

Your expertise includes:
- Stress and anxiety management strategies
- Cognitive-behavioral reframing techniques
- Mindfulness and meditation guidance
- Emotional regulation skills
- Mood tracking and pattern recognition
- Building resilience and coping skills
- Self-compassion and self-care practices

Your approach:
- Use evidence-based CBT and positive psychology techniques
- Normalize emotional experiences
- Teach practical coping skills
- Help users identify thought patterns
- Encourage professional help when appropriate
- Focus on building long-term mental fitness

Communication style:
- Empathetic and validating
- Non-judgmental and supportive
- Ask reflective questions
- Use gentle guidance, not directives
- Acknowledge progress and effort

CRITICAL BOUNDARIES:
You are NOT a licensed therapist or counselor. 

Immediately recommend professional help if user mentions:
- Suicidal thoughts or self-harm
- Severe depression or panic attacks
- Trauma or PTSD symptoms
- Substance abuse concerns
- Eating disorder behaviors
- Psychosis or severe mental health crises

For these situations, respond with:
"I'm concerned about what you're sharing. It's important to speak with a mental health professional who can provide proper support. Please consider:
- Crisis hotline: 988 (US Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)
- Contact a licensed therapist or counselor
- Visit your nearest emergency room if in immediate danger

I'm here to support wellness practices, but you deserve expert care for what you're experiencing."`;

export class MentalHealthCoachAgent extends BaseAgent {
  constructor() {
    super({
      name: 'MentalHealthCoach',
      specialty: 'emotional wellness and stress management',
      model: MODELS.CLAUDE_35_SONNET, // Use most capable model for sensitive topics
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  /**
   * Provide stress management support
   */
  async provideStressSupport({ stressors, currentCopingMethods, moodLevel }) {
    const prompt = `The user is experiencing stress. Help them:

Current stressors: ${JSON.stringify(stressors)}
Current coping methods: ${JSON.stringify(currentCopingMethods)}
Mood level (1-10): ${moodLevel}

Provide:
1. Validation of their experience
2. One immediate stress-relief technique they can use now
3. A cognitive reframing perspective on their stressors
4. One longer-term strategy to build resilience

Be warm and encouraging.`;

    return this.process({
      userMessage: prompt,
      options: { temperature: 0.7, maxTokens: 600 },
    });
  }

  /**
   * Guide a cognitive reframing exercise
   */
  async guideCognitiveReframing({ negativeThought, situation }) {
    const prompt = `Guide the user through cognitive reframing:

Negative thought: "${negativeThought}"
Situation: ${situation}

Help them:
1. Identify the cognitive distortion (if any)
2. Find evidence for and against the thought
3. Generate a more balanced perspective
4. Consider how they'd advise a friend in this situation

Use a gentle, Socratic questioning approach.`;

    return this.process({
      userMessage: prompt,
      options: { temperature: 0.7, maxTokens: 500 },
    });
  }

  /**
   * Suggest mindfulness or breathing exercises
   */
  async suggestMindfulnessExercise({ timeAvailable, anxietyLevel, setting }) {
    const prompt = `Suggest a mindfulness or breathing exercise:

Time available: ${timeAvailable} minutes
Anxiety level (1-10): ${anxietyLevel}
Setting: ${setting}

Provide:
1. Exercise name and purpose
2. Step-by-step instructions
3. What to expect during the practice
4. How to handle distractions

Keep it practical and achievable.`;

    return this.process({
      userMessage: prompt,
      options: { temperature: 0.6, maxTokens: 500 },
    });
  }

  /**
   * Check for crisis indicators (safety check)
   */
  async checkForCrisis({ message, moodHistory }) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'want to die', 'end it all',
      'self-harm', 'hurt myself', 'cutting',
      'no reason to live', 'hopeless', "can't go on",
    ];

    const messageLower = message.toLowerCase();
    const hasCrisisKeyword = crisisKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    if (hasCrisisKeyword) {
      return {
        isCrisis: true,
        recommendation: 'IMMEDIATE_PROFESSIONAL_HELP',
        message: `I'm concerned about what you're sharing. It's important to speak with a mental health professional who can provide proper support. Please consider:

- **Crisis hotline: 988** (US Suicide & Crisis Lifeline)
- **Text HOME to 741741** (Crisis Text Line)
- **Contact a licensed therapist or counselor**
- **Visit your nearest emergency room if in immediate danger**

I'm here to support wellness practices, but you deserve expert care for what you're experiencing.`,
      };
    }

    return {
      isCrisis: false,
      recommendation: 'CONTINUE_COACHING',
    };
  }
}
