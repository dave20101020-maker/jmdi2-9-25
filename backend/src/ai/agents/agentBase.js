/**
 * Agent Base - Shared Utilities for All AI Agents
 * 
 * This file provides common types and utilities that all specialized
 * coaching agents can use to build consistent, context-aware interactions.
 */

/**
 * @typedef {Object} AgentContext
 * @property {string} userId - The ID of the user being coached
 * @property {string} pillar - The wellness pillar (e.g., 'sleep', 'mental_health', 'nutrition', 'exercise', 'finances', 'social', 'spirituality', 'physical_health')
 * @property {any} [memory] - Placeholder for stored user data (preferences, past interactions, insights)
 * @property {any} [appItems] - Existing user data (LifePlans, Habits, Goals, Entries, etc.)
 */

/**
 * Build a complete message history for an AI agent interaction
 * 
 * This function combines:
 * 1. A brief system wrapper about NorthStar and the wellness pillar
 * 2. The agent's specific system prompt (passed as parameter)
 * 3. Recent conversation history (last 5 messages)
 * 4. Any additional context notes
 * 
 * @param {Object} params - Parameters for building message history
 * @param {AgentContext} params.context - User context (userId, pillar, memory, appItems)
 * @param {string} params.agentSystemPrompt - The agent's specific system instructions
 * @param {Array<{role: string, content: string}>} [params.lastMessages] - Recent conversation messages (last 5 recommended)
 * @param {string} [params.extraSystemNotes] - Optional additional context to append to system prompt
 * @returns {{systemPrompt: string, conversationHistory: Array<{role: string, content: string}>}}
 */
export function buildMessageHistory({
  context,
  agentSystemPrompt,
  lastMessages = [],
  extraSystemNotes = '',
}) {
  // Validate required parameters
  if (!context || !context.userId || !context.pillar) {
    throw new Error('buildMessageHistory requires context with userId and pillar');
  }

  if (!agentSystemPrompt || typeof agentSystemPrompt !== 'string') {
    throw new Error('buildMessageHistory requires agentSystemPrompt as a non-empty string');
  }

  // Build the comprehensive system prompt
  const systemPromptParts = [];

  // 1. NorthStar application context
  systemPromptParts.push(
    '=== NORTHSTAR WELLNESS COACHING SYSTEM ===',
    '',
    'You are an AI coach within NorthStar, a holistic wellness application that helps users',
    'improve their lives across 8 core pillars:',
    '- Sleep: Rest quality, circadian rhythm, sleep hygiene',
    '- Mental Health: Stress, anxiety, mood, emotional wellness',
    '- Nutrition: Diet, meal planning, healthy eating habits',
    '- Exercise: Physical activity, movement, fitness goals',
    '- Physical Health: Medical checkups, body care, preventive health',
    '- Finances: Budgeting, financial planning, money wellness',
    '- Social: Relationships, connections, community',
    '- Spirituality: Purpose, meaning, values, mindfulness',
    '',
    `CURRENT FOCUS: ${context.pillar.toUpperCase()} pillar`,
    `USER ID: ${context.userId}`,
    ''
  );

  // 2. Add memory context if available
  if (context.memory) {
    systemPromptParts.push(
      '=== USER MEMORY ===',
      typeof context.memory === 'string' 
        ? context.memory 
        : JSON.stringify(context.memory, null, 2),
      ''
    );
  }

  // 3. Add app items context if available
  if (context.appItems) {
    systemPromptParts.push(
      '=== USER DATA ===',
      typeof context.appItems === 'string'
        ? context.appItems
        : JSON.stringify(context.appItems, null, 2),
      ''
    );
  }

  // 4. Add the agent-specific system prompt
  systemPromptParts.push(
    '=== YOUR ROLE AND INSTRUCTIONS ===',
    '',
    agentSystemPrompt
  );

  // 5. Add any extra system notes
  if (extraSystemNotes && extraSystemNotes.trim()) {
    systemPromptParts.push(
      '',
      '=== ADDITIONAL CONTEXT ===',
      '',
      extraSystemNotes
    );
  }

  // Combine all parts into final system prompt
  const systemPrompt = systemPromptParts.join('\n');

  // Prepare conversation history (limit to last 5 messages)
  const conversationHistory = lastMessages && Array.isArray(lastMessages)
    ? lastMessages.slice(-5).filter(msg => {
        // Filter out system messages from conversation history
        // (system context is already in systemPrompt)
        return msg && msg.role && msg.role !== 'system' && msg.content;
      })
    : [];

  return {
    systemPrompt,
    conversationHistory,
  };
}

/**
 * Get a friendly display name for a wellness pillar
 * 
 * @param {string} pillar - The pillar identifier
 * @returns {string} Human-readable pillar name
 */
export function getPillarDisplayName(pillar) {
  const displayNames = {
    sleep: 'Sleep & Rest',
    mental_health: 'Mental Health',
    nutrition: 'Nutrition & Diet',
    exercise: 'Exercise & Fitness',
    physical_health: 'Physical Health',
    finances: 'Financial Wellness',
    social: 'Social Connections',
    spirituality: 'Spirituality & Purpose',
  };

  return displayNames[pillar] || pillar;
}

/**
 * Validate that a context object has required fields
 * 
 * @param {AgentContext} context - Context to validate
 * @throws {Error} If context is invalid
 */
export function validateAgentContext(context) {
  if (!context || typeof context !== 'object') {
    throw new Error('Context must be an object');
  }

  if (!context.userId || typeof context.userId !== 'string') {
    throw new Error('Context must include a valid userId string');
  }

  if (!context.pillar || typeof context.pillar !== 'string') {
    throw new Error('Context must include a valid pillar string');
  }

  const validPillars = [
    'sleep',
    'mental_health',
    'nutrition',
    'exercise',
    'physical_health',
    'finances',
    'social',
    'spirituality',
  ];

  if (!validPillars.includes(context.pillar)) {
    throw new Error(
      `Invalid pillar: ${context.pillar}. Must be one of: ${validPillars.join(', ')}`
    );
  }
}

/**
 * Create a minimal context object for testing or simple use cases
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Wellness pillar
 * @returns {AgentContext}
 */
export function createMinimalContext(userId, pillar) {
  validateAgentContext({ userId, pillar });
  
  return {
    userId,
    pillar,
    memory: null,
    appItems: null,
  };
}
