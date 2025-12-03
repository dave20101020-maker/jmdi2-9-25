/**
 * Agent Classification System
 * 
 * Uses GPT to intelligently classify user messages and route them
 * to the most appropriate wellness pillar agent.
 * 
 * Pillars: sleep, fitness, mental-health, nutrition, finances, physical-health, social, spirituality
 */

import logger from '../../utils/logger.js';

const PILLARS = {
  sleep: { name: 'Sleep & Rest', keywords: ['sleep', 'insomnia', 'tired', 'rest', 'fatigue', 'dreams', 'bed'] },
  fitness: { name: 'Fitness & Exercise', keywords: ['exercise', 'workout', 'fitness', 'training', 'run', 'gym', 'sport', 'strength'] },
  'mental-health': { name: 'Mental Health', keywords: ['anxiety', 'depression', 'stress', 'mental', 'mood', 'emotion', 'feelings'] },
  nutrition: { name: 'Nutrition & Diet', keywords: ['eat', 'food', 'diet', 'nutrition', 'healthy eating', 'weight', 'meal'] },
  finances: { name: 'Finances & Money', keywords: ['money', 'budget', 'finance', 'savings', 'debt', 'income', 'spending'] },
  'physical-health': { name: 'Physical Health', keywords: ['health', 'sick', 'illness', 'pain', 'disease', 'medical', 'doctor'] },
  social: { name: 'Social & Relationships', keywords: ['relationship', 'friend', 'family', 'social', 'connect', 'love', 'dating', 'lonely'] },
  spirituality: { name: 'Spirituality & Purpose', keywords: ['spiritual', 'purpose', 'meaning', 'faith', 'religion', 'meditation', 'values'] }
};

/**
 * Classify a message and return the most appropriate pillar
 * 
 * Uses multi-level classification:
 * 1. Keyword matching (fast)
 * 2. GPT classification (accurate)
 * 3. Fallback to most likely pillar
 * 
 * @param {string} message - User message to classify
 * @param {Object} memory - User memory/context (optional)
 * @param {string} lastPillar - Previously used pillar (optional)
 * @returns {Promise<{pillar: string, confidence: number, reason: string}>}
 */
export async function classifyMessage(message, memory = null, lastPillar = null) {
  try {
    // Step 1: Quick keyword matching
    const keywordResult = classifyByKeywords(message);
    if (keywordResult && keywordResult.confidence > 0.8) {
      return {
        ...keywordResult,
        method: 'keyword'
      };
    }

    // Step 2: Use GPT for classification (fallback if available)
    if (process.env.OPENAI_API_KEY) {
      const gptResult = await classifyByGPT(message, memory);
      return {
        ...gptResult,
        method: 'gpt'
      };
    }

    // Step 3: Fallback to keyword result or use conversation history
    if (keywordResult) {
      return {
        ...keywordResult,
        method: 'keyword-fallback'
      };
    }

    // Step 4: Use last pillar if available (context continuity)
    if (lastPillar) {
      return {
        pillar: lastPillar,
        confidence: 0.5,
        reason: 'Using previous pillar for context continuity',
        method: 'history'
      };
    }

    // Step 5: Default to mental health (most general)
    return {
      pillar: 'mental-health',
      confidence: 0.4,
      reason: 'Using mental health as default pillar',
      method: 'default'
    };
  } catch (error) {
    logger.error(`Classification error: ${error.message}`);
    return {
      pillar: 'mental-health',
      confidence: 0.3,
      reason: 'Error during classification, using default',
      method: 'error-fallback',
      error: error.message
    };
  }
}

/**
 * Fast keyword-based classification
 * 
 * @param {string} message - Message to classify
 * @returns {Object|null} - Classification result or null
 */
function classifyByKeywords(message) {
  const lowerMessage = message.toLowerCase();
  const scores = {};

  // Score each pillar based on keyword matches
  for (const [pillarKey, pillarData] of Object.entries(PILLARS)) {
    let score = 0;
    for (const keyword of pillarData.keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
      }
    }
    scores[pillarKey] = score;
  }

  // Find pillar with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return null;
  }

  const topPillar = Object.keys(scores).find(key => scores[key] === maxScore);
  const confidence = Math.min(0.95, 0.5 + (maxScore * 0.15)); // Scale confidence

  return {
    pillar: topPillar,
    confidence,
    reason: `Detected ${maxScore} keyword match(es)`
  };
}

/**
 * GPT-based classification for complex messages
 * 
 * @param {string} message - Message to classify
 * @param {Object} memory - User memory/context
 * @returns {Promise<Object>} - Classification result
 */
async function classifyByGPT(message, memory = null) {
  try {
    // Dynamically import OpenAI client
    const { OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const pillarList = Object.entries(PILLARS)
      .map(([key, data]) => `- ${key}: ${data.name}`)
      .join('\n');

    const memoryContext = memory 
      ? `User's active pillars: ${Object.keys(memory.pillars || {}).join(', ')}`
      : '';

    const systemPrompt = `You are a wellness message classifier. Classify the user's message into ONE of these wellness pillars:

${pillarList}

Available pillars context:
${memoryContext}

Respond with ONLY a JSON object with this exact format:
{"pillar": "pillar-key", "confidence": 0.0-1.0, "reason": "brief explanation"}

Be strict about classification. Use high confidence only when clearly relevant.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const content = response.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    // Validate pillar exists
    if (!PILLARS[parsed.pillar]) {
      throw new Error(`Invalid pillar: ${parsed.pillar}`);
    }

    return {
      pillar: parsed.pillar,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      reason: parsed.reason || 'GPT classification'
    };
  } catch (error) {
    logger.error(`GPT classification failed: ${error.message}`);
    return null;
  }
}

/**
 * Get all available pillars
 * 
 * @returns {Object} - Pillar definitions
 */
export function getPillars() {
  return PILLARS;
}

/**
 * Get pillar info by key
 * 
 * @param {string} pillarKey - Pillar key
 * @returns {Object|null} - Pillar info or null
 */
export function getPillarInfo(pillarKey) {
  return PILLARS[pillarKey] || null;
}

/**
 * Validate pillar exists
 * 
 * @param {string} pillar - Pillar to validate
 * @returns {boolean} - True if pillar exists
 */
export function isValidPillar(pillar) {
  return pillar in PILLARS;
}

export default {
  classifyMessage,
  getPillars,
  getPillarInfo,
  isValidPillar
};
