/**
 * Memory Model
 * 
 * Persistent storage for user AI interaction history and context
 * Stores per-pillar memory, conversation history, screening results, etc.
 */

import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'User ID (from authentication)'
    },

    pillarMemories: {
      type: Map,
      of: new mongoose.Schema(
        {
          // Stores per-pillar memory data
          lastDiscussedTopics: [String], // Recent topics covered
          preferences: mongoose.Schema.Types.Mixed, // User preferences (e.g., dietary restrictions, fitness level)
          goals: [mongoose.Schema.Types.Mixed], // User-set goals for this pillar
          progressMarkers: [mongoose.Schema.Types.Mixed], // Progress tracking data
          notes: String // Agent notes about this pillar
        },
        { _id: false }
      ),
      default: new Map(),
      description: 'Per-pillar memory storage'
    },

    contextHistory: {
      type: Map,
      of: new mongoose.Schema(
        {
          // Stores last 10 conversation turns per pillar for context
          messages: [
            {
              role: String, // 'user' or 'assistant'
              content: String,
              timestamp: {
                type: Date,
                default: Date.now
              }
            }
          ],
          maxTurns: {
            type: Number,
            default: 10
          }
        },
        { _id: false }
      ),
      default: new Map(),
      description: 'Recent conversation history per pillar'
    },

    screeningHistory: {
      type: Map,
      of: [
        {
          screeningType: String, // 'sleep_quality', 'mental_health', 'fitness_level', etc.
          date: {
            type: Date,
            default: Date.now
          },
          results: mongoose.Schema.Types.Mixed, // Screening results data
          notes: String
        }
      ],
      default: new Map(),
      description: 'Historical screening results per pillar'
    },

    aiItems: {
      type: Map,
      of: [
        {
          itemId: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true
          },
          type: {
            type: String,
            enum: ['lifeplan', 'smartgoal', 'habit', 'log', 'screening', 'reflection', 'milestone', 'challenge'],
            required: true
          },
          title: String,
          content: mongoose.Schema.Types.Mixed,
          createdAt: {
            type: Date,
            default: Date.now
          },
          completedAt: Date,
          status: {
            type: String,
            enum: ['active', 'completed', 'archived'],
            default: 'active'
          }
        }
      ],
      default: new Map(),
      description: 'AI-generated items (goals, habits, etc.) per pillar'
    },

    antiRepetitionTracker: {
      type: Map,
      of: [
        {
          topic: String,
          firstMentioned: Date,
          lastMentioned: {
            type: Date,
            default: Date.now
          },
          frequency: {
            type: Number,
            default: 1
          }
        }
      ],
      default: new Map(),
      description: 'Tracks covered topics to prevent repetition (30-day sliding window)'
    },

    userMetadata: {
      preferredAgent: String, // Most interacted agent
      interactionCount: {
        type: Number,
        default: 0
      },
      lastActiveAgent: String,
      timeZone: String, // User timezone for scheduling
      language: {
        type: String,
        default: 'en'
      }
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
      description: 'Last memory update timestamp'
    },

    createdAt: {
      type: Date,
      default: Date.now,
      description: 'Memory creation timestamp'
    }
  },
  {
    timestamps: true,
    collection: 'ai_memories'
  }
);

// Indexes for performance
memorySchema.index({ userId: 1, lastUpdated: -1 });
memorySchema.index({ createdAt: -1 });

/**
 * Methods
 */

/**
 * Get memory for a specific pillar
 * 
 * @param {string} pillar - Pillar name
 * @returns {Object} - Pillar memory or empty object
 */
memorySchema.methods.getPillarMemory = function(pillar) {
  return this.pillarMemories.get(pillar) || {};
};

/**
 * Update memory for a specific pillar
 * 
 * @param {string} pillar - Pillar name
 * @param {Object} data - Data to merge with existing pillar memory
 */
memorySchema.methods.updatePillarMemory = function(pillar, data) {
  const existing = this.pillarMemories.get(pillar) || {};
  this.pillarMemories.set(pillar, { ...existing, ...data });
  this.lastUpdated = new Date();
};

/**
 * Get conversation history for a pillar
 * 
 * @param {string} pillar - Pillar name
 * @param {number} limit - Max number of messages to return
 * @returns {Array} - Conversation messages
 */
memorySchema.methods.getContextHistory = function(pillar, limit = 10) {
  const history = this.contextHistory.get(pillar);
  if (!history || !history.messages) return [];
  return history.messages.slice(-limit);
};

/**
 * Add message to conversation history
 * 
 * @param {string} pillar - Pillar name
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 */
memorySchema.methods.addToContextHistory = function(pillar, role, content) {
  let history = this.contextHistory.get(pillar);
  if (!history) {
    history = { messages: [], maxTurns: 10 };
  }

  history.messages.push({
    role,
    content,
    timestamp: new Date()
  });

  // Keep only last maxTurns messages
  if (history.messages.length > history.maxTurns) {
    history.messages = history.messages.slice(-history.maxTurns);
  }

  this.contextHistory.set(pillar, history);
  this.lastUpdated = new Date();
};

/**
 * Add screening result
 * 
 * @param {string} pillar - Pillar name
 * @param {string} screeningType - Type of screening
 * @param {Object} results - Screening results
 */
memorySchema.methods.addScreeningResult = function(pillar, screeningType, results) {
  let screenings = this.screeningHistory.get(pillar) || [];
  
  screenings.push({
    screeningType,
    date: new Date(),
    results
  });

  // Keep only last 10 screenings per pillar
  if (screenings.length > 10) {
    screenings = screenings.slice(-10);
  }

  this.screeningHistory.set(pillar, screenings);
  this.lastUpdated = new Date();
};

/**
 * Add AI-generated item
 * 
 * @param {string} pillar - Pillar name
 * @param {string} type - Item type (lifeplan, smartgoal, habit, etc.)
 * @param {Object} itemData - Item data
 */
memorySchema.methods.addAIItem = function(pillar, type, itemData) {
  let items = this.aiItems.get(pillar) || [];
  
  items.push({
    type,
    title: itemData.title,
    content: itemData.content,
    createdAt: new Date(),
    status: 'active',
    ...itemData
  });

  this.aiItems.set(pillar, items);
  this.lastUpdated = new Date();
};

/**
 * Mark topic as covered (anti-repetition)
 * 
 * @param {string} pillar - Pillar name
 * @param {string} topic - Topic name
 */
memorySchema.methods.markTopicCovered = function(pillar, topic) {
  let covered = this.antiRepetitionTracker.get(pillar) || [];
  
  const existing = covered.find(t => t.topic === topic);
  if (existing) {
    existing.lastMentioned = new Date();
    existing.frequency += 1;
  } else {
    covered.push({
      topic,
      firstMentioned: new Date(),
      lastMentioned: new Date(),
      frequency: 1
    });
  }

  // Clean up old topics (>30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  covered = covered.filter(t => t.lastMentioned > thirtyDaysAgo);

  this.antiRepetitionTracker.set(pillar, covered);
  this.lastUpdated = new Date();
};

/**
 * Check if topic was recently covered
 * 
 * @param {string} pillar - Pillar name
 * @param {string} topic - Topic name
 * @returns {boolean} - True if covered within 30 days
 */
memorySchema.methods.isTopicCovered = function(pillar, topic) {
  const covered = this.antiRepetitionTracker.get(pillar) || [];
  return covered.some(t => t.topic === topic);
};

/**
 * Clear all memory for a pillar
 * 
 * @param {string} pillar - Pillar name
 */
memorySchema.methods.clearPillarMemory = function(pillar) {
  this.pillarMemories.delete(pillar);
  this.contextHistory.delete(pillar);
  this.screeningHistory.delete(pillar);
  this.aiItems.delete(pillar);
  this.antiRepetitionTracker.delete(pillar);
  this.lastUpdated = new Date();
};

/**
 * Clear all memory
 */
memorySchema.methods.clearAllMemory = function() {
  this.pillarMemories.clear();
  this.contextHistory.clear();
  this.screeningHistory.clear();
  this.aiItems.clear();
  this.antiRepetitionTracker.clear();
  this.lastUpdated = new Date();
};

/**
 * Get memory stats
 * 
 * @returns {Object} - Memory statistics
 */
memorySchema.methods.getStats = function() {
  return {
    userId: this.userId,
    totalPillars: this.pillarMemories.size,
    totalAIItems: Array.from(this.aiItems.values()).reduce((sum, items) => sum + items.length, 0),
    totalScreenings: Array.from(this.screeningHistory.values()).reduce((sum, screenings) => sum + screenings.length, 0),
    interactionCount: this.userMetadata.interactionCount,
    createdAt: this.createdAt,
    lastUpdated: this.lastUpdated
  };
};

/**
 * Statics
 */

/**
 * Find or create memory for user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Document>} - Memory document
 */
memorySchema.statics.findOrCreate = async function(userId) {
  let memory = await this.findOne({ userId });
  
  if (!memory) {
    memory = new this({ userId });
    await memory.save();
  }
  
  return memory;
};

const Memory = mongoose.model('Memory', memorySchema);

export default Memory;
