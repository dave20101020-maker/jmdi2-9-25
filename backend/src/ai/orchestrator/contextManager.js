/**
 * Context Manager
 * 
 * Manages conversation context, user history, and state
 * for multi-turn AI interactions.
 */

import User from '../../models/User.js';
import Entry from '../../models/Entry.js';
import Habit from '../../models/Habit.js';
import PillarScore from '../../models/PillarScore.js';

/**
 * Build comprehensive context for an AI request
 */
export async function buildUserContext(userId, options = {}) {
  try {
    const context = {};

    // Get user profile
    if (options.includeProfile !== false) {
      const user = await User.findById(userId).select('-password');
      if (user) {
        context.userProfile = {
          name: user.name,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          allowedPillars: user.allowedPillars,
          goals: user.goals || [],
          preferences: user.preferences || {},
        };
      }
    }

    // Get current pillar scores
    if (options.includeScores !== false) {
      const scores = await PillarScore.findOne({ userId })
        .sort({ createdAt: -1 })
        .lean();

      if (scores) {
        context.currentScores = {
          sleep: scores.sleep || 0,
          diet: scores.diet || 0,
          exercise: scores.exercise || 0,
          physical_health: scores.physical_health || 0,
          mental_health: scores.mental_health || 0,
          finances: scores.finances || 0,
          social: scores.social || 0,
          spirituality: scores.spirituality || 0,
        };
      }
    }

    // Get recent journal entries
    if (options.includeEntries) {
      const limit = options.entriesLimit || 5;
      const entries = await Entry.find({ userId })
        .sort({ date: -1 })
        .limit(limit)
        .select('date content mood pillar')
        .lean();

      context.recentEntries = entries.map(e => ({
        date: e.date,
        content: e.content,
        mood: e.mood,
        pillar: e.pillar,
      }));
    }

    // Get active habits
    if (options.includeHabits) {
      const habits = await Habit.find({ 
        userId, 
        isActive: true 
      })
        .select('name description pillar frequency currentStreak')
        .lean();

      context.activeHabits = habits.map(h => ({
        name: h.name,
        description: h.description,
        pillar: h.pillar,
        frequency: h.frequency,
        streak: h.currentStreak || 0,
      }));
    }

    // Get conversation history
    if (options.conversationId) {
      context.history = await getConversationHistory(options.conversationId, {
        limit: options.historyLimit || 10,
      });
    }

    // Add timestamp
    context.timestamp = new Date().toISOString();

    return context;
  } catch (error) {
    console.error('Error building user context:', error);
    return {};
  }
}

/**
 * Get conversation history for context
 */
export async function getConversationHistory(conversationId, options = {}) {
  // TODO: Implement conversation storage
  // For now, return empty array
  // In production, fetch from a Conversation model or cache
  return [];
}

/**
 * Save conversation turn
 */
export async function saveConversationTurn({
  conversationId,
  userId,
  userMessage,
  agentResponse,
  agentType,
  metadata = {},
}) {
  // TODO: Implement conversation storage
  // Store in database or cache for context in future turns
  // Include: timestamp, tokens used, agent used, user satisfaction, etc.
  
  console.log('Conversation turn:', {
    conversationId,
    userId,
    agentType,
    timestamp: new Date(),
  });
}

/**
 * Create a new conversation
 */
export async function createConversation(userId, initialMessage) {
  // TODO: Implement conversation creation
  // Generate conversationId, store initial state
  
  const conversationId = `conv_${userId}_${Date.now()}`;
  return { conversationId };
}

/**
 * Enrich context with real-time data
 */
export async function enrichContextWithRealtimeData(context, options = {}) {
  // Add time-based context
  const now = new Date();
  context.temporal = {
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
    timeOfDay: getTimeOfDay(now),
    hour: now.getHours(),
    date: now.toISOString().split('T')[0],
  };

  // Add seasonal context
  const month = now.getMonth();
  if (month >= 11 || month <= 1) {
    context.temporal.season = 'winter';
  } else if (month >= 2 && month <= 4) {
    context.temporal.season = 'spring';
  } else if (month >= 5 && month <= 7) {
    context.temporal.season = 'summer';
  } else {
    context.temporal.season = 'fall';
  }

  return context;
}

/**
 * Get time of day classification
 */
function getTimeOfDay(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Analyze recent mood trends
 */
export async function analyzeMoodTrends(userId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await Entry.find({
      userId,
      date: { $gte: startDate },
      mood: { $exists: true },
    })
      .sort({ date: -1 })
      .select('date mood')
      .lean();

    if (entries.length === 0) {
      return null;
    }

    const moods = entries.map(e => e.mood);
    const avgMood = moods.reduce((sum, m) => sum + m, 0) / moods.length;
    const recentMood = moods.slice(0, 3);
    const trend = recentMood.length >= 2 
      ? (recentMood[0] - recentMood[recentMood.length - 1]) > 0 ? 'improving' : 'declining'
      : 'stable';

    return {
      averageMood: Math.round(avgMood * 10) / 10,
      trend,
      dataPoints: entries.length,
      recentMoods: recentMood,
    };
  } catch (error) {
    console.error('Error analyzing mood trends:', error);
    return null;
  }
}

/**
 * Get pillar-specific recent activity
 */
export async function getPillarActivity(userId, pillar, days = 14) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [entries, habits] = await Promise.all([
      Entry.find({
        userId,
        pillar,
        date: { $gte: startDate },
      })
        .sort({ date: -1 })
        .limit(10)
        .select('date content mood')
        .lean(),
      
      Habit.find({
        userId,
        pillar,
        isActive: true,
      })
        .select('name currentStreak completions')
        .lean(),
    ]);

    return {
      pillar,
      recentEntries: entries,
      activeHabits: habits,
      entryCount: entries.length,
      totalHabits: habits.length,
    };
  } catch (error) {
    console.error('Error getting pillar activity:', error);
    return null;
  }
}
