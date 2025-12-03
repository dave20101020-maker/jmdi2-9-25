/**
 * AI Items Service
 * 
 * Unified service for creating and managing AI-generated items:
 * - Life Plans
 * - Smart Goals
 * - Habits
 * - Logs/Entries
 * - Screenings
 * - Reflections
 * - Milestones
 * - Challenges
 * 
 * Connects to both AI Memory model and existing app models
 */

import Memory from '../models/Memory.js';
import Habit from '../models/Habit.js';
import Entry from '../models/Entry.js';
import logger from '../utils/logger.js';

/**
 * Save a life plan
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} data - Life plan data
 * @param {string} data.title - Life plan title
 * @param {string} data.content - Life plan content
 * @param {Array} [data.pillars] - Relevant pillars
 * @param {string} [data.timeframe] - Time frame (e.g., '1 year', '5 years')
 * @returns {Promise<Object>} - Created item
 */
export async function saveLifePlan(userId, pillar, data) {
  try {
    // Validate inputs
    if (!userId || !pillar) {
      throw new Error('userId and pillar are required');
    }

    if (!data.title || !data.content) {
      throw new Error('Life plan requires title and content');
    }

    // Get or create memory document
    const memory = await Memory.findOrCreate(userId);

    // Add to memory
    const itemData = {
      title: data.title,
      content: data.content,
      type: 'lifeplan',
      pillars: data.pillars || [pillar],
      timeframe: data.timeframe || '1 year',
      createdAt: new Date()
    };

    memory.addAIItem(pillar, 'lifeplan', itemData);
    await memory.save();

    logger.info(`Life plan saved for user ${userId} in pillar ${pillar}`);

    return {
      ok: true,
      itemId: memory._id,
      item: itemData,
      message: 'Life plan saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save life plan: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Save a smart goal
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} data - Goal data
 * @param {string} data.title - Goal title
 * @param {string} data.description - Goal description
 * @param {Object} data.criteria - SMART criteria
 * @param {Date} [data.deadline] - Goal deadline
 * @param {number} [data.priority] - Priority (1-5)
 * @returns {Promise<Object>} - Created goal
 */
export async function saveGoal(userId, pillar, data) {
  try {
    // Validate inputs
    if (!userId || !pillar) {
      throw new Error('userId and pillar are required');
    }

    if (!data.title || !data.description) {
      throw new Error('Goal requires title and description');
    }

    // Get or create memory
    const memory = await Memory.findOrCreate(userId);

    const goalData = {
      title: data.title,
      description: data.description,
      type: 'smartgoal',
      criteria: data.criteria || {}, // SMART criteria
      deadline: data.deadline,
      priority: data.priority || 3,
      status: 'active',
      createdAt: new Date(),
      progress: 0
    };

    memory.addAIItem(pillar, 'smartgoal', goalData);
    await memory.save();

    logger.info(`Smart goal saved for user ${userId} in pillar ${pillar}`);

    return {
      ok: true,
      itemId: memory._id,
      item: goalData,
      message: 'Goal saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save goal: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Save a habit
 * 
 * Saves to both AI Memory (for agent context) and Habit model (for tracking)
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} data - Habit data
 * @param {string} data.title - Habit name
 * @param {string} data.description - Habit description
 * @param {string} data.frequency - Frequency (daily, weekly, monthly)
 * @param {number} [data.targetCount] - Target repetitions
 * @param {string} [data.timeOfDay] - Preferred time
 * @returns {Promise<Object>} - Created habit
 */
export async function saveHabit(userId, pillar, data) {
  try {
    // Validate inputs
    if (!userId || !pillar) {
      throw new Error('userId and pillar are required');
    }

    if (!data.title) {
      throw new Error('Habit requires a title');
    }

    // Save to AI Memory first
    const memory = await Memory.findOrCreate(userId);

    const habitData = {
      title: data.title,
      description: data.description || '',
      type: 'habit',
      frequency: data.frequency || 'daily',
      targetCount: data.targetCount || 1,
      timeOfDay: data.timeOfDay,
      createdAt: new Date(),
      status: 'active'
    };

    memory.addAIItem(pillar, 'habit', habitData);
    await memory.save();

    // Also save to Habit model for tracking
    const habit = new Habit({
      userId,
      title: data.title,
      description: data.description,
      frequency: data.frequency || 'daily',
      targetCount: data.targetCount || 1,
      currentStreak: 0,
      pillar,
      aiGenerated: true,
      timeOfDay: data.timeOfDay
    });

    await habit.save();

    logger.info(`Habit saved for user ${userId} in pillar ${pillar}`);

    return {
      ok: true,
      itemId: habit._id,
      item: habitData,
      habitModelId: habit._id,
      message: 'Habit saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save habit: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Save a log entry
 * 
 * Saves to both AI Memory (for agent context) and Entry model (for history)
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} data - Log data
 * @param {string} data.title - Entry title
 * @param {string} data.content - Entry content
 * @param {string} [data.type] - Entry type (reflection, screening, milestone, etc.)
 * @param {Object} [data.metrics] - Associated metrics
 * @returns {Promise<Object>} - Created entry
 */
export async function saveLog(userId, pillar, data) {
  try {
    // Validate inputs
    if (!userId || !pillar) {
      throw new Error('userId and pillar are required');
    }

    if (!data.title || !data.content) {
      throw new Error('Log entry requires title and content');
    }

    // Save to AI Memory
    const memory = await Memory.findOrCreate(userId);

    const logData = {
      title: data.title,
      content: data.content,
      type: data.type || 'log',
      metrics: data.metrics || {},
      createdAt: new Date()
    };

    memory.addAIItem(pillar, 'log', logData);
    await memory.save();

    // Also save to Entry model for history/tracking
    const entry = new Entry({
      userId,
      pillar,
      title: data.title,
      content: data.content,
      type: data.type || 'reflection',
      aiGenerated: true,
      metrics: data.metrics
    });

    await entry.save();

    logger.info(`Log entry saved for user ${userId} in pillar ${pillar}`);

    return {
      ok: true,
      itemId: entry._id,
      item: logData,
      entryModelId: entry._id,
      message: 'Log entry saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save log: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Save a screening result
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {string} screeningType - Type of screening
 * @param {Object} results - Screening results
 * @param {string} [results.score] - Overall score
 * @param {Object} [results.details] - Detailed results
 * @param {string} [results.interpretation] - AI interpretation
 * @returns {Promise<Object>} - Saved screening
 */
export async function saveScreening(userId, pillar, screeningType, results) {
  try {
    if (!userId || !pillar || !screeningType) {
      throw new Error('userId, pillar, and screeningType are required');
    }

    const memory = await Memory.findOrCreate(userId);

    const screeningData = {
      screeningType,
      date: new Date(),
      results,
      score: results.score,
      interpretation: results.interpretation
    };

    memory.addScreeningResult(pillar, screeningType, results);
    await memory.save();

    logger.info(`Screening saved for user ${userId}: ${screeningType}`);

    return {
      ok: true,
      screening: screeningData,
      message: 'Screening saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save screening: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Save a reflection
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} data - Reflection data
 * @param {string} data.title - Reflection title
 * @param {string} data.content - Reflection content
 * @param {Array} [data.insights] - Key insights
 * @returns {Promise<Object>} - Saved reflection
 */
export async function saveReflection(userId, pillar, data) {
  try {
    if (!userId || !pillar) {
      throw new Error('userId and pillar are required');
    }

    if (!data.title || !data.content) {
      throw new Error('Reflection requires title and content');
    }

    const memory = await Memory.findOrCreate(userId);

    const reflectionData = {
      title: data.title,
      content: data.content,
      type: 'reflection',
      insights: data.insights || [],
      createdAt: new Date()
    };

    memory.addAIItem(pillar, 'reflection', reflectionData);
    await memory.save();

    logger.info(`Reflection saved for user ${userId} in pillar ${pillar}`);

    return {
      ok: true,
      item: reflectionData,
      message: 'Reflection saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save reflection: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Save a milestone
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} data - Milestone data
 * @param {string} data.title - Milestone title
 * @param {string} data.description - Milestone description
 * @param {string} [data.category] - Milestone category
 * @returns {Promise<Object>} - Saved milestone
 */
export async function saveMilestone(userId, pillar, data) {
  try {
    if (!userId || !pillar) {
      throw new Error('userId and pillar are required');
    }

    if (!data.title) {
      throw new Error('Milestone requires a title');
    }

    const memory = await Memory.findOrCreate(userId);

    const milestoneData = {
      title: data.title,
      description: data.description || '',
      type: 'milestone',
      category: data.category,
      achievedAt: new Date()
    };

    memory.addAIItem(pillar, 'milestone', milestoneData);
    await memory.save();

    logger.info(`Milestone saved for user ${userId} in pillar ${pillar}`);

    return {
      ok: true,
      item: milestoneData,
      message: 'Milestone saved successfully'
    };
  } catch (error) {
    logger.error(`Failed to save milestone: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Get all AI items for a user and pillar
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {Object} [filter] - Filter options
 * @param {string} [filter.type] - Item type
 * @param {string} [filter.status] - Item status
 * @returns {Promise<Object>} - User's AI items
 */
export async function getAIItems(userId, pillar, filter = {}) {
  try {
    const memory = await Memory.findOne({ userId });
    
    if (!memory) {
      return {
        ok: true,
        items: [],
        message: 'No memory found'
      };
    }

    const items = memory.aiItems.get(pillar) || [];

    // Apply filters
    let filtered = items;
    if (filter.type) {
      filtered = filtered.filter(item => item.type === filter.type);
    }
    if (filter.status) {
      filtered = filtered.filter(item => item.status === filter.status);
    }

    return {
      ok: true,
      items: filtered,
      count: filtered.length
    };
  } catch (error) {
    logger.error(`Failed to get AI items: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Update an AI item
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {string} itemId - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated item
 */
export async function updateAIItem(userId, pillar, itemId, updates) {
  try {
    const memory = await Memory.findOne({ userId });
    
    if (!memory) {
      throw new Error('Memory not found');
    }

    const items = memory.aiItems.get(pillar) || [];
    const item = items.find(i => i.itemId.toString() === itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    // Update item
    Object.assign(item, updates);
    memory.markModified('aiItems');
    await memory.save();

    logger.info(`AI item updated for user ${userId}`);

    return {
      ok: true,
      item,
      message: 'Item updated successfully'
    };
  } catch (error) {
    logger.error(`Failed to update AI item: ${error.message}`);
    return {
      ok: false,
      error: error.message
    };
  }
}

export default {
  saveLifePlan,
  saveGoal,
  saveHabit,
  saveLog,
  saveScreening,
  saveReflection,
  saveMilestone,
  getAIItems,
  updateAIItem
};
