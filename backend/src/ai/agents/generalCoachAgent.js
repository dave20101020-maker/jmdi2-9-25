/**
 * General Coach Agent
 * 
 * Handles general wellness coaching, cross-pillar advice,
 * and initial user interactions.
 */

import { BaseAgent } from './BaseAgent.js';
import { MODELS } from '../modelRouter.js';

const SYSTEM_PROMPT = `You are NorthStar's General Wellness Coach, an empathetic and knowledgeable AI guide focused on holistic well-being.

Your role:
- Provide balanced advice across all 8 wellness pillars: Sleep, Diet, Exercise, Physical Health, Mental Health, Finances, Social, and Spirituality
- Help users identify their most pressing needs and priorities
- Offer evidence-based recommendations
- Be supportive, non-judgmental, and encouraging
- Ask clarifying questions when needed
- Connect insights across multiple pillars when relevant

Your communication style:
- Warm and personable, but professional
- Use conversational language
- Keep responses concise (2-3 paragraphs typically)
- Ask one follow-up question when appropriate
- Celebrate progress and acknowledge challenges

Important guidelines:
- You are NOT a licensed therapist, doctor, or financial advisor
- Recommend professional help for serious medical, mental health, or financial issues
- Focus on actionable, practical advice
- Respect user privacy and boundaries
- Encourage sustainable changes, not quick fixes`;

export class GeneralCoachAgent extends BaseAgent {
  constructor() {
    super({
      name: 'GeneralCoach',
      specialty: 'general wellness and cross-pillar coaching',
      model: MODELS.CLAUDE_3_SONNET,
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  /**
   * Analyze user's overall wellness and suggest priorities
   */
  async analyzeWellness({ currentScores, recentEntries, userProfile }) {
    const analysisPrompt = `Based on the user's current pillar scores and recent journal entries, provide:

1. A brief assessment of their overall wellness (1-2 sentences)
2. The top 2-3 pillars that need attention
3. One specific, actionable recommendation they can start today
4. An encouraging message

Keep the response concise and actionable.`;

    return this.process({
      userMessage: analysisPrompt,
      context: { currentScores, recentEntries, userProfile },
      options: { temperature: 0.7, maxTokens: 500 },
    });
  }

  /**
   * Generate a daily check-in message
   */
  async generateDailyCheckIn({ dayOfWeek, currentScores, recentActivity }) {
    const checkInPrompt = `Generate a brief, encouraging daily check-in message for ${dayOfWeek}. 
    
Consider:
- The user's recent activity and progress
- Current pillar scores
- Make it feel personal and timely
- Include one small challenge or reflection prompt

Keep it to 2-3 sentences.`;

    return this.process({
      userMessage: checkInPrompt,
      context: { currentScores, additionalInfo: recentActivity },
      options: { temperature: 0.8, maxTokens: 200 },
    });
  }
}
