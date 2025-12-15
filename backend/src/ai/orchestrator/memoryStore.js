/**
 * Memory Store for NorthStar AI System
 *
 * Manages persistent memory for each user's AI interactions.
 * Stores conversation history, preferences, screening results, and anti-repetition markers.
 *
 * Memory Structure:
 * {
 *   userId: string,
 *   lastUpdated: Date,
 *   pillars: {
 *     sleep: { lastMessages: [], lastScreening: {}, preferences: {}, items: [] },
 *     mental_health: { lastMessages: [], lastProtocol: {}, preferences: {}, items: [] },
 *     nutrition: { lastMessages: [], lastMacroTarget: {}, preferences: {}, items: [] },
 *     fitness: { lastMessages: [], lastProgram: {}, preferences: {}, items: [] },
 *     physical_health: { lastMessages: [], lastScreening: {}, preferences: {}, items: [] },
 *     finances: { lastMessages: [], lastBudget: {}, preferences: {}, items: [] },
 *     social: { lastMessages: [], lastGoal: {}, preferences: {}, items: [] },
 *     spirituality: { lastMessages: [], lastPractice: {}, preferences: {}, items: [] }
 *   },
 *   preferences: {}, // Global user preferences
 *   antiRepetition: {} // Track covered topics across all pillars
 * }
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memory storage path (fallback to JSON files if MongoDB not available)
const MEMORY_DIR = path.join(__dirname, "../../../data/memory");

/**
 * Initialize memory directory if it doesn't exist
 */
async function ensureMemoryDir() {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create memory directory:", error);
  }
}

/**
 * Get memory file path for a user
 * @param {string} userId - User ID
 * @returns {string} - File path
 */
function getMemoryPath(userId) {
  return path.join(MEMORY_DIR, `${userId}.json`);
}

/**
 * Create empty memory structure for a user
 * @param {string} userId - User ID
 * @returns {Object} - Empty memory object
 */
function createEmptyMemory(userId) {
  return {
    userId,
    lastUpdated: new Date().toISOString(),
    psychologyProfile: null,
    global: {
      lastMessages: [],
      preferences: {},
      themes: [],
    },
    pillars: {
      sleep: {
        lastMessages: [],
        lastScreening: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      mental_health: {
        lastMessages: [],
        lastProtocol: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      nutrition: {
        lastMessages: [],
        lastMacroTarget: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      fitness: {
        lastMessages: [],
        lastProgram: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      physical_health: {
        lastMessages: [],
        lastScreening: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      finances: {
        lastMessages: [],
        lastBudget: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      social: {
        lastMessages: [],
        lastGoal: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
      spirituality: {
        lastMessages: [],
        lastPractice: null,
        preferences: {},
        items: [],
        coveredTopics: [],
      },
    },
    preferences: {},
    antiRepetition: {},
  };
}

/**
 * Update GLOBAL conversation history (cross-pillar)
 * Keeps only the last 50 messages (25 turns)
 */
export function updateGlobalConversationHistory(
  memory,
  userMessage,
  assistantMessage
) {
  if (!memory.global) {
    memory.global = { lastMessages: [], preferences: {}, themes: [] };
  }
  if (!Array.isArray(memory.global.lastMessages)) {
    memory.global.lastMessages = [];
  }

  memory.global.lastMessages.push(
    { role: "user", content: userMessage, timestamp: new Date().toISOString() },
    {
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    }
  );

  if (memory.global.lastMessages.length > 50) {
    memory.global.lastMessages = memory.global.lastMessages.slice(-50);
  }

  return memory;
}

/**
 * Get GLOBAL conversation history
 */
export function getGlobalConversationHistory(memory, limit = 50) {
  const arr = memory?.global?.lastMessages;
  if (!Array.isArray(arr)) return [];
  return arr.slice(-limit);
}

/**
 * Load memory for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User's memory object
 */
export async function loadMemory(userId) {
  if (!userId) {
    throw new Error("loadMemory requires userId");
  }

  try {
    await ensureMemoryDir();
    const memoryPath = getMemoryPath(userId);

    // Try to read existing memory file
    try {
      const data = await fs.readFile(memoryPath, "utf-8");
      const memory = JSON.parse(data);
      return memory;
    } catch (error) {
      // File doesn't exist or is invalid - create new memory
      if (error.code === "ENOENT" || error instanceof SyntaxError) {
        return createEmptyMemory(userId);
      }
      throw error;
    }
  } catch (error) {
    console.error(`Failed to load memory for user ${userId}:`, error);
    // Return empty memory on any error
    return createEmptyMemory(userId);
  }
}

/**
 * Save memory for a user
 *
 * @param {string} userId - User ID
 * @param {Object} memory - Memory object to save
 * @returns {Promise<void>}
 */
export async function saveMemory(userId, memory) {
  if (!userId) {
    throw new Error("saveMemory requires userId");
  }

  if (!memory || typeof memory !== "object") {
    throw new Error("saveMemory requires a valid memory object");
  }

  try {
    await ensureMemoryDir();
    const memoryPath = getMemoryPath(userId);

    // Update timestamp
    memory.lastUpdated = new Date().toISOString();

    // Write to file
    await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2), "utf-8");
  } catch (error) {
    console.error(`Failed to save memory for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update conversation history for a specific pillar
 * Keeps only the last 10 messages per pillar
 *
 * @param {Object} memory - Memory object
 * @param {string} pillar - Pillar name
 * @param {string} userMessage - User's message
 * @param {string} assistantMessage - Assistant's response
 * @returns {Object} - Updated memory
 */
export function updateConversationHistory(
  memory,
  pillar,
  userMessage,
  assistantMessage
) {
  // Ensure pillar structure exists
  if (!memory.pillars[pillar]) {
    memory.pillars[pillar] = {
      lastMessages: [],
      preferences: {},
      items: [],
      coveredTopics: [],
    };
  }

  // Add new messages
  memory.pillars[pillar].lastMessages.push(
    { role: "user", content: userMessage, timestamp: new Date().toISOString() },
    {
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    }
  );

  // Keep only last 10 messages (20 turns = 10 user + 10 assistant)
  if (memory.pillars[pillar].lastMessages.length > 20) {
    memory.pillars[pillar].lastMessages =
      memory.pillars[pillar].lastMessages.slice(-20);
  }

  return memory;
}

/**
 * Add an item reference to memory (habit, goal, plan, screening)
 *
 * @param {Object} memory - Memory object
 * @param {string} pillar - Pillar name
 * @param {Object} item - Item to track
 * @returns {Object} - Updated memory
 */
export function addItemToMemory(memory, pillar, item) {
  if (!memory.pillars[pillar]) {
    memory.pillars[pillar] = {
      lastMessages: [],
      preferences: {},
      items: [],
      coveredTopics: [],
    };
  }

  // Add item with timestamp
  memory.pillars[pillar].items.push({
    ...item,
    addedAt: new Date().toISOString(),
  });

  // Keep only last 20 items per pillar
  if (memory.pillars[pillar].items.length > 20) {
    memory.pillars[pillar].items = memory.pillars[pillar].items.slice(-20);
  }

  return memory;
}

/**
 * Mark a topic as covered (anti-repetition)
 *
 * @param {Object} memory - Memory object
 * @param {string} pillar - Pillar name
 * @param {string} topic - Topic that was covered
 * @returns {Object} - Updated memory
 */
export function markTopicCovered(memory, pillar, topic) {
  if (!memory.pillars[pillar]) {
    memory.pillars[pillar] = {
      lastMessages: [],
      preferences: {},
      items: [],
      coveredTopics: [],
    };
  }

  // Add topic with timestamp if not already covered
  if (!memory.pillars[pillar].coveredTopics.some((t) => t.topic === topic)) {
    memory.pillars[pillar].coveredTopics.push({
      topic,
      coveredAt: new Date().toISOString(),
    });

    // Keep only last 50 topics per pillar
    if (memory.pillars[pillar].coveredTopics.length > 50) {
      memory.pillars[pillar].coveredTopics =
        memory.pillars[pillar].coveredTopics.slice(-50);
    }
  }

  return memory;
}

/**
 * Check if a topic has been covered recently
 *
 * @param {Object} memory - Memory object
 * @param {string} pillar - Pillar name
 * @param {string} topic - Topic to check
 * @returns {boolean} - True if topic was covered in last 30 days
 */
export function isTopicCovered(memory, pillar, topic) {
  if (!memory.pillars[pillar] || !memory.pillars[pillar].coveredTopics) {
    return false;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return memory.pillars[pillar].coveredTopics.some((t) => {
    return t.topic === topic && new Date(t.coveredAt) > thirtyDaysAgo;
  });
}

/**
 * Get conversation history for a specific pillar
 * Returns last N messages (default 10)
 *
 * @param {Object} memory - Memory object
 * @param {string} pillar - Pillar name
 * @param {number} limit - Maximum number of messages to return
 * @returns {Array} - Array of message objects
 */
export function getConversationHistory(memory, pillar, limit = 20) {
  if (!memory.pillars[pillar] || !memory.pillars[pillar].lastMessages) {
    return [];
  }

  return memory.pillars[pillar].lastMessages.slice(-limit);
}

/**
 * Update pillar-specific data (screening, protocol, program, etc.)
 *
 * @param {Object} memory - Memory object
 * @param {string} pillar - Pillar name
 * @param {string} key - Data key (e.g., 'lastScreening', 'lastProtocol')
 * @param {*} value - Data value
 * @returns {Object} - Updated memory
 */
export function updatePillarData(memory, pillar, key, value) {
  if (!memory.pillars[pillar]) {
    memory.pillars[pillar] = {
      lastMessages: [],
      preferences: {},
      items: [],
      coveredTopics: [],
    };
  }

  memory.pillars[pillar][key] = value;
  return memory;
}

/**
 * Clear old memory data (for testing or privacy)
 *
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function clearMemory(userId) {
  if (!userId) {
    throw new Error("clearMemory requires userId");
  }

  try {
    const memoryPath = getMemoryPath(userId);
    await fs.unlink(memoryPath);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== "ENOENT") {
      console.error(`Failed to clear memory for user ${userId}:`, error);
    }
  }
}

/**
 * Memory Store object - aggregate of all memory functions
 */
export const memoryStore = {
  loadMemory,
  saveMemory,
  updateGlobalConversationHistory,
  getGlobalConversationHistory,
  updateConversationHistory,
  addItemToMemory,
  markTopicCovered,
  isTopicCovered,
  getConversationHistory,
  updatePillarData,
  clearMemory,
};
