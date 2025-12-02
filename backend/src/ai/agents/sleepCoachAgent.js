/**
 * Sleep Coach Agent
 * 
 * Specialized agent for sleep optimization, circadian rhythm,
 * and rest-related wellness advice.
 */

import { BaseAgent } from './BaseAgent.js';
import { MODELS } from '../modelRouter.js';

const SYSTEM_PROMPT = `You are NorthStar's Sleep Coach, an expert in sleep science, circadian biology, and rest optimization.

Your expertise includes:
- Sleep hygiene and bedroom environment optimization
- Circadian rhythm alignment and light exposure
- Sleep disorders recognition (refer to professionals when needed)
- Nap strategies and sleep scheduling
- Stress and anxiety management for better sleep
- Technology use and its impact on sleep
- Nutrition's effect on sleep quality

Your approach:
- Base advice on sleep research and evidence
- Recognize individual differences in sleep needs
- Consider lifestyle constraints (shift work, parenting, etc.)
- Focus on gradual, sustainable improvements
- Address both sleep quality and quantity
- Connect sleep to other wellness pillars (exercise, diet, mental health)

Communication style:
- Calm and reassuring tone
- Use simple explanations of sleep science
- Provide specific, actionable tips
- Acknowledge that perfect sleep isn't always possible
- Celebrate small improvements

Red flags to escalate:
- Symptoms of sleep apnea, narcolepsy, or severe insomnia
- Sleeping pill dependency concerns
- Extreme fatigue affecting daily functioning
→ Recommend seeing a sleep specialist or doctor`;

export class SleepCoachAgent extends BaseAgent {
  constructor() {
    super({
      name: 'SleepCoach',
      specialty: 'sleep optimization and circadian health',
      model: MODELS.CLAUDE_3_SONNET,
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  /**
   * Analyze sleep patterns and provide recommendations
   */
  async analyzeSleepPattern({ sleepData, lifestyleFactors }) {
    const analysisPrompt = `Analyze the user's sleep pattern and provide:

1. Key observations about their sleep quality/duration
2. Potential factors affecting their sleep
3. Top 3 specific recommendations for improvement
4. One "quick win" they can implement tonight

Sleep data: ${JSON.stringify(sleepData)}
Lifestyle factors: ${JSON.stringify(lifestyleFactors)}`;

    return this.process({
      userMessage: analysisPrompt,
      options: { temperature: 0.6, maxTokens: 600 },
    });
  }

  /**
   * Generate personalized sleep hygiene tips
   */
  async generateSleepHygieneTips({ currentHabits, challenges }) {
    const prompt = `Based on the user's current habits and challenges, suggest 3-5 practical sleep hygiene improvements.

Current habits: ${JSON.stringify(currentHabits)}
Challenges: ${JSON.stringify(challenges)}

Format as a numbered list with brief explanations.`;

    return this.process({
      userMessage: prompt,
      options: { temperature: 0.7, maxTokens: 500 },
    });
  }

  /**
   * Create a personalized bedtime routine
   */
  async createBedtimeRoutine({ wakeUpTime, sleepGoal, constraints }) {
    const prompt = `Create a personalized bedtime routine for someone who:
- Wants to wake up at: ${wakeUpTime}
- Sleep goal: ${sleepGoal} hours
- Constraints: ${constraints}

Include:
1. Recommended bedtime
2. Hour-by-hour wind-down routine (2-3 hours before bed)
3. Morning routine to support healthy sleep cycle

Keep it realistic and flexible.`;

    return this.process({
      userMessage: prompt,
      options: { temperature: 0.7, maxTokens: 700 },
    });
  }
}
