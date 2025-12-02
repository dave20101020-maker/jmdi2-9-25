/**
 * Base Agent
 * 
 * Parent class for all specialized coaching agents.
 * Provides common functionality for AI interactions.
 */

import { routeCompletion, routeStreamingCompletion } from '../modelRouter.js';

export class BaseAgent {
  constructor({ name, specialty, model, systemPrompt }) {
    this.name = name;
    this.specialty = specialty;
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Process a user request
   */
  async process({ userMessage, context = {}, options = {} }) {
    const messages = this.buildMessages(userMessage, context);

    try {
      const response = await routeCompletion({
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        options: options.providerOptions || {},
      });

      return {
        agent: this.name,
        specialty: this.specialty,
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
      };
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      throw new Error(`${this.name} failed: ${error.message}`);
    }
  }

  /**
   * Process a streaming request
   */
  async* processStream({ userMessage, context = {}, options = {} }) {
    const messages = this.buildMessages(userMessage, context);

    try {
      for await (const chunk of routeStreamingCompletion({
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        options: options.providerOptions || {},
      })) {
        yield {
          agent: this.name,
          specialty: this.specialty,
          ...chunk,
        };
      }
    } catch (error) {
      console.error(`${this.name} streaming error:`, error.message);
      throw new Error(`${this.name} streaming failed: ${error.message}`);
    }
  }

  /**
   * Build message array with system prompt and context
   */
  buildMessages(userMessage, context) {
    const messages = [
      {
        role: 'system',
        content: this.enrichSystemPrompt(context),
      },
    ];

    // Add conversation history if provided
    if (context.history && Array.isArray(context.history)) {
      messages.push(...context.history);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: this.enrichUserMessage(userMessage, context),
    });

    return messages;
  }

  /**
   * Enrich system prompt with context
   */
  enrichSystemPrompt(context) {
    let prompt = this.systemPrompt;

    if (context.userProfile) {
      prompt += `\n\nUser Profile:\n`;
      prompt += `- Name: ${context.userProfile.name || 'User'}\n`;
      if (context.userProfile.goals) {
        prompt += `- Goals: ${context.userProfile.goals.join(', ')}\n`;
      }
      if (context.userProfile.preferences) {
        prompt += `- Preferences: ${JSON.stringify(context.userProfile.preferences)}\n`;
      }
    }

    if (context.currentScores) {
      prompt += `\n\nCurrent Pillar Scores:\n`;
      Object.entries(context.currentScores).forEach(([pillar, score]) => {
        prompt += `- ${pillar}: ${score}/100\n`;
      });
    }

    return prompt;
  }

  /**
   * Enrich user message with additional context
   */
  enrichUserMessage(message, context) {
    let enrichedMessage = message;

    if (context.recentEntries && context.recentEntries.length > 0) {
      enrichedMessage += `\n\nRecent journal entries:\n`;
      context.recentEntries.forEach((entry, i) => {
        enrichedMessage += `${i + 1}. [${entry.date}] ${entry.content.substring(0, 100)}...\n`;
      });
    }

    if (context.additionalInfo) {
      enrichedMessage += `\n\nAdditional context: ${context.additionalInfo}`;
    }

    return enrichedMessage;
  }
}
