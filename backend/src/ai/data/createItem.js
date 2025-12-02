/**
 * AI Item Creation Module
 * 
 * Universal data persistence for AI-generated content across all pillars.
 * Handles creation of LifePlans, SmartGoals, Habits, Logs, Screenings, etc.
 */

import mongoose from 'mongoose';

// Import existing models (adjust paths - models are in backend/models/)
import Habit from '../../../models/Habit.js';
import Entry from '../../../models/Entry.js';
import PillarScore from '../../../models/PillarScore.js';

/**
 * Create an AI-generated item
 * 
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.pillar - Pillar name (sleep, mental_health, nutrition, fitness, physical_health, finances, social, spirituality)
 * @param {string} params.type - Item type (lifeplan, smartgoal, habit, log, screening, reflection, milestone, challenge)
 * @param {string} params.title - Human-readable title
 * @param {string} params.content - Main text description
 * @param {Object} [params.data] - Optional structured data
 * @returns {Promise<Object>} - Saved document
 */
export async function createAIItem({ userId, pillar, type, title, content, data = {} }) {
  // Validate required parameters
  if (!userId) {
    throw new Error('createAIItem requires userId');
  }
  
  if (!pillar) {
    throw new Error('createAIItem requires pillar');
  }
  
  if (!type) {
    throw new Error('createAIItem requires type');
  }
  
  if (!title || !title.trim()) {
    throw new Error('createAIItem requires a non-empty title');
  }

  logAIUpdate(`Creating ${type} for pillar=${pillar}, userId=${userId}, title="${title}"`);

  try {
    let savedItem;

    switch (type) {
      case 'habit':
        savedItem = await createHabit({ userId, pillar, title, content, data });
        break;

      case 'log':
      case 'entry':
        savedItem = await createLogEntry({ userId, pillar, title, content, data });
        break;

      case 'screening':
        savedItem = await createScreening({ userId, pillar, title, content, data });
        break;

      case 'lifeplan':
      case 'smartgoal':
      case 'reflection':
      case 'milestone':
      case 'challenge':
        // These use the Entry model with type discrimination
        savedItem = await createGenericEntry({ userId, pillar, type, title, content, data });
        break;

      default:
        throw new Error(`Unknown item type: ${type}`);
    }

    logAIUpdate(`✓ Created ${type} with ID: ${savedItem._id}`);
    return savedItem;

  } catch (error) {
    logAIUpdate(`✗ Error creating ${type}: ${error.message}`);
    throw error;
  }
}

/**
 * Create a habit using the Habit model
 */
async function createHabit({ userId, pillar, title, content, data }) {
  const habit = new Habit({
    userId,
    pillar,
    name: title,
    description: content || '',
    frequency: data.frequency || 'daily',
    target: data.target || 1,
    streak: 0,
    longestStreak: 0,
    completedDates: [],
    isActive: true,
    createdBy: 'ai',
    aiMetadata: {
      generatedBy: data.agentName || 'NorthStar AI',
      context: data.context || {},
      timestamp: new Date()
    }
  });

  return await habit.save();
}

/**
 * Create a log entry using the Entry model
 */
async function createLogEntry({ userId, pillar, title, content, data }) {
  const entry = new Entry({
    userId,
    pillar,
    type: 'log',
    title,
    content: content || '',
    mood: data.mood || null,
    energy: data.energy || null,
    tags: data.tags || [],
    date: data.date || new Date(),
    metadata: {
      createdBy: 'ai',
      agentName: data.agentName || 'NorthStar AI',
      structured: data.structured || {}
    }
  });

  return await entry.save();
}

/**
 * Create a screening result
 */
async function createScreening({ userId, pillar, title, content, data }) {
  const entry = new Entry({
    userId,
    pillar,
    type: 'screening',
    title,
    content: content || '',
    date: new Date(),
    metadata: {
      createdBy: 'ai',
      screeningType: data.screeningType || 'general',
      score: data.score || null,
      interpretation: data.interpretation || '',
      recommendations: data.recommendations || [],
      rawData: data.rawData || {},
      agentName: data.agentName || 'NorthStar AI'
    }
  });

  return await entry.save();
}

/**
 * Create a generic entry (LifePlan, SmartGoal, Reflection, Milestone, Challenge)
 */
async function createGenericEntry({ userId, pillar, type, title, content, data }) {
  const entry = new Entry({
    userId,
    pillar,
    type,
    title,
    content: content || '',
    date: data.date || new Date(),
    metadata: {
      createdBy: 'ai',
      agentName: data.agentName || 'NorthStar AI',
      ...data
    }
  });

  return await entry.save();
}

/**
 * Log AI update activity
 * 
 * @param {string} message - Log message
 */
export function logAIUpdate(message) {
  const timestamp = new Date().toISOString();
  console.log(`[AI-DATA ${timestamp}] ${message}`);
}

/**
 * Get all AI-created items for a user and pillar
 * 
 * @param {string} userId - User ID
 * @param {string} pillar - Pillar name
 * @param {string} [type] - Optional type filter
 * @returns {Promise<Array>} - Array of items
 */
export async function getAIItems({ userId, pillar, type }) {
  const query = { userId, pillar };
  
  if (type === 'habit') {
    return await Habit.find({ ...query, createdBy: 'ai' }).sort({ createdAt: -1 });
  } else {
    const entryQuery = { ...query, 'metadata.createdBy': 'ai' };
    if (type) {
      entryQuery.type = type;
    }
    return await Entry.find(entryQuery).sort({ date: -1 });
  }
}

/**
 * Update an existing AI-created item
 * 
 * @param {string} itemId - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated document
 */
export async function updateAIItem(itemId, updates) {
  logAIUpdate(`Updating item ${itemId}`);
  
  // Try Habit model first
  let item = await Habit.findById(itemId);
  if (item) {
    Object.assign(item, updates);
    return await item.save();
  }
  
  // Try Entry model
  item = await Entry.findById(itemId);
  if (item) {
    Object.assign(item, updates);
    return await item.save();
  }
  
  throw new Error(`Item not found: ${itemId}`);
}

/**
 * Delete an AI-created item
 * 
 * @param {string} itemId - Item ID
 * @returns {Promise<boolean>} - True if deleted
 */
export async function deleteAIItem(itemId) {
  logAIUpdate(`Deleting item ${itemId}`);
  
  // Try both models
  let result = await Habit.findByIdAndDelete(itemId);
  if (result) return true;
  
  result = await Entry.findByIdAndDelete(itemId);
  if (result) return true;
  
  throw new Error(`Item not found: ${itemId}`);
}
