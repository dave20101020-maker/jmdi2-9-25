/**
 * Agent Response Formatter
 * 
 * Standardizes all agent responses into a uniform JSON structure:
 * {
 *   agent: string,
 *   pillar: string,
 *   type: string,
 *   content: string,
 *   actions: Array<{title, description, priority}>,
 *   itemsToCreate: Array<{type, title, content, data}>
 * }
 */

/**
 * Format agent response into standardized structure
 * 
 * @param {Object} params
 * @param {string} params.agentName - Agent name (e.g., "Dr. Luna")
 * @param {string} params.pillar - Pillar name
 * @param {string} params.responseText - Agent's text response
 * @param {string} [params.type='coaching'] - Response type: 'coaching', 'screening', 'plan', 'assessment'
 * @param {Array} [params.actions] - Recommended actions
 * @param {Array} [params.itemsToCreate] - Items to save to database
 * @returns {Object} - Formatted response
 */
export function formatAgentResponse({
  agentName,
  pillar,
  responseText,
  type = 'coaching',
  actions = [],
  itemsToCreate = []
}) {
  // Validate required fields
  if (!agentName) throw new Error('agentName is required');
  if (!pillar) throw new Error('pillar is required');
  if (!responseText) throw new Error('responseText is required');

  return {
    agent: agentName,
    pillar: pillar,
    type: type,
    content: responseText,
    actions: actions.map(action => ({
      title: action.title || '',
      description: action.description || '',
      priority: action.priority || 'medium'
    })),
    itemsToCreate: itemsToCreate.map(item => ({
      type: item.type || 'log',
      title: item.title || '',
      content: item.content || '',
      data: item.data || {}
    }))
  };
}

/**
 * Extract actions from agent response text
 * Looks for bullet points, numbered lists, or common action keywords
 * 
 * @param {string} text - Response text
 * @returns {Array<{title, description, priority}>}
 */
export function extractActionsFromText(text) {
  const actions = [];
  
  // Pattern 1: Bullet points (- or •)
  const bulletPattern = /^[\s]*[-•]\s+(.+?)(?:\n|$)/gm;
  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    const fullText = match[1];
    const [title, ...descParts] = fullText.split(':');
    actions.push({
      title: title.trim(),
      description: descParts.join(':').trim(),
      priority: 'medium'
    });
  }

  // Pattern 2: Numbered lists (1., 2., etc.)
  const numberPattern = /^\s*(\d+)\.\s+(.+?)(?:\n|$)/gm;
  while ((match = numberPattern.exec(text)) !== null) {
    const [, num, text] = match;
    const [title, ...descParts] = text.split(':');
    actions.push({
      title: title.trim(),
      description: descParts.join(':').trim(),
      priority: parseInt(num) === 1 ? 'high' : 'medium'
    });
  }

  return actions.slice(0, 5); // Return top 5 actions
}

/**
 * Build items to create from agent context
 * Agents can suggest what should be saved
 * 
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.pillar - Pillar name
 * @param {string} [params.agentName] - Agent name
 * @param {Array} [params.suggestedItems] - Pre-built items
 * @returns {Array<{type, title, content, data}>}
 */
export function buildItemsToCreate({
  userId,
  pillar,
  agentName = 'Unknown Agent',
  suggestedItems = []
}) {
  return suggestedItems.map(item => ({
    type: item.type,
    title: item.title,
    content: item.content,
    data: {
      ...item.data,
      userId,
      pillar,
      agentName,
      createdByAgent: true,
      timestamp: new Date().toISOString()
    }
  }));
}

/**
 * Response type constants
 */
export const RESPONSE_TYPES = {
  COACHING: 'coaching',
  SCREENING: 'screening',
  PLAN: 'plan',
  ASSESSMENT: 'assessment',
  REFLECTION: 'reflection',
  STRATEGY: 'strategy'
};

/**
 * Priority levels for actions
 */
export const ACTION_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

export default {
  formatAgentResponse,
  extractActionsFromText,
  buildItemsToCreate,
  RESPONSE_TYPES,
  ACTION_PRIORITIES
};
