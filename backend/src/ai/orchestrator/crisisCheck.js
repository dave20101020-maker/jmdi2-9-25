/**
 * Crisis Safety Check System
 *
 * Detects crisis indicators in user messages before routing to AI agents.
 * If crisis detected, returns crisis resources immediately without calling agents.
 *
 * Indicators: suicidal ideation, self-harm, severe mental health crisis, etc.
 * Returns: Crisis message + hotline info + emergency resources
 */

import logger from "../../utils/logger.js";

// Crisis indicator patterns
const CRISIS_PATTERNS = {
  suicide: {
    keywords: [
      "suicide",
      "suicidal",
      "kill myself",
      "end my life",
      "not worth living",
      "die",
      "death wish",
    ],
    severity: "critical",
    hotline: "National Suicide Prevention Lifeline",
  },
  self_harm: {
    keywords: [
      "self-harm",
      "self harm",
      "cutting",
      "cut myself",
      "hurt myself",
      "injure myself",
      "blood",
      "scars",
    ],
    severity: "high",
    hotline: "Crisis Text Line",
  },
  severe_crisis: {
    keywords: [
      "crisis",
      "emergency",
      "severe",
      "urgent",
      "can't handle",
      "falling apart",
      "breaking down",
      "panic attack",
    ],
    severity: "high",
    hotline: "National Crisis Line",
  },
  abuse: {
    keywords: [
      "abuse",
      "hit me",
      "hurt me",
      "assault",
      "violence",
      "dangerous",
      "threat",
    ],
    severity: "critical",
    hotline: "National Domestic Violence Hotline",
  },
  substance: {
    keywords: [
      "overdose",
      "poison",
      "drugs",
      "alcohol",
      "intoxicated",
      "substance abuse",
    ],
    severity: "critical",
    hotline: "SAMHSA National Helpline",
  },
};

// Global crisis resources
const CRISIS_RESOURCES = {
  us: {
    "National Suicide Prevention Lifeline": {
      number: "988",
      url: "https://988lifeline.org",
      description: "Free, confidential support 24/7",
    },
    "Crisis Text Line": {
      number: "Text HOME to 741741",
      url: "https://www.crisistextline.org",
      description: "Text-based crisis support",
    },
    "National Crisis Line": {
      number: "1-800-784-2433",
      url: "https://www.samhsa.gov",
      description: "SAMHSA National Helpline",
    },
    "National Domestic Violence Hotline": {
      number: "1-800-799-7233",
      url: "https://www.thehotline.org",
      description: "Support for domestic violence",
    },
    "Emergency Services": {
      number: "911",
      url: "https://911.gov",
      description: "Call if in immediate danger",
    },
  },
};

/**
 * Perform crisis safety check on user message
 *
 * @param {string} message - User message to check
 * @param {string} country - Country code (default: 'us')
 * @returns {Promise<{isCrisis: boolean, severity: string, type: string, message: string, resources: Array}>}
 */
export async function performCrisisCheck(message, country = "us") {
  try {
    if (!message || typeof message !== "string") {
      return {
        isCrisis: false,
        severity: "none",
        type: null,
        message: null,
        resources: [],
      };
    }

    // Step 1: Pattern matching (fast)
    const patternMatch = checkCrisisPatterns(message);
    if (patternMatch.isCrisis) {
      return {
        ...patternMatch,
        resources: getCrisisResources(patternMatch.type, country),
      };
    }

    // Step 2: GPT-based detection (if available)
    if (process.env.OPENAI_API_KEY) {
      const gptCheck = await checkCrisisWithGPT(message);
      if (gptCheck.isCrisis) {
        return {
          ...gptCheck,
          resources: getCrisisResources(gptCheck.type, country),
        };
      }
    }

    // No crisis detected
    return {
      isCrisis: false,
      severity: "none",
      type: null,
      message: null,
      resources: [],
    };
  } catch (error) {
    logger.error(`Crisis check error: ${error.message}`);
    // Err on side of caution - return crisis info on error
    return {
      isCrisis: false,
      severity: "none",
      type: "error",
      message: "Unable to perform safety check",
      resources: getCrisisResources(null, country),
    };
  }
}

/**
 * Check message against crisis patterns
 *
 * @param {string} message - Message to check
 * @returns {Object} - Crisis detection result
 */
function checkCrisisPatterns(message) {
  const lowerMessage = message.toLowerCase();
  let highestSeverity = null;
  let matchedType = null;

  for (const [type, pattern] of Object.entries(CRISIS_PATTERNS)) {
    for (const keyword of pattern.keywords) {
      // Exact or partial match
      if (lowerMessage.includes(keyword)) {
        // Weight higher severity matches
        if (
          !highestSeverity ||
          (pattern.severity === "critical" && highestSeverity !== "critical")
        ) {
          highestSeverity = pattern.severity;
          matchedType = type;
        }
        break;
      }
    }
  }

  if (highestSeverity) {
    return {
      isCrisis: true,
      severity: highestSeverity,
      type: matchedType,
      message: getCrisisMessage(matchedType, highestSeverity),
      method: "pattern",
    };
  }

  return {
    isCrisis: false,
    severity: "none",
    type: null,
    message: null,
    method: "pattern",
  };
}

/**
 * GPT-based crisis detection for complex messages
 *
 * @param {string} message - Message to analyze
 * @returns {Promise<Object>} - Crisis detection result
 */
async function checkCrisisWithGPT(message) {
  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY,
    });

    const systemPrompt = `You are a crisis detection AI. Analyze the user's message for crisis indicators.

Crisis types to detect:
- suicide: Suicidal ideation, wanting to end life
- self_harm: Self-injury, cutting, harmful behaviors
- severe_crisis: Severe mental health emergency, acute distress
- abuse: Domestic violence, assault, abuse
- substance: Drug/alcohol overdose, substance crisis

Respond with ONLY a JSON object:
{"isCrisis": boolean, "type": "suicide|self_harm|severe_crisis|abuse|substance|null", "severity": "critical|high|moderate|none", "confidence": 0.0-1.0}

Be conservative - only flag if message clearly indicates crisis. Default to false if uncertain.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    if (parsed.isCrisis && parsed.confidence > 0.7) {
      return {
        isCrisis: true,
        severity: parsed.severity,
        type: parsed.type,
        message: getCrisisMessage(parsed.type, parsed.severity),
        method: "gpt",
        confidence: parsed.confidence,
      };
    }

    return {
      isCrisis: false,
      severity: "none",
      type: null,
      message: null,
      method: "gpt",
    };
  } catch (error) {
    logger.error(`GPT crisis check failed: ${error.message}`);
    return {
      isCrisis: false,
      severity: "none",
      type: null,
      message: null,
      method: "gpt-error",
    };
  }
}

/**
 * Get appropriate crisis message based on type and severity
 *
 * @param {string} type - Crisis type
 * @param {string} severity - Crisis severity
 * @returns {string} - Crisis message
 */
function getCrisisMessage(type, severity) {
  const messages = {
    suicide:
      "I hear that you're in pain. Your life matters, and there are people who want to help. Please reach out to a crisis counselor right now.",
    self_harm:
      "I'm concerned about your safety. Please contact a mental health professional or crisis counselor immediately.",
    severe_crisis:
      "You're going through something very difficult. Professional support is available right now - please reach out.",
    abuse:
      "Your safety is the priority. Please contact the domestic violence hotline or emergency services.",
    substance:
      "If you've overdosed or are in danger, please call 911 or emergency services immediately.",
    error:
      "I want to make sure you're safe. If you're in crisis, please reach out to one of the resources below.",
  };

  return messages[type] || messages.error;
}

/**
 * Get crisis resources for a country
 *
 * @param {string} type - Crisis type (optional, for filtering)
 * @param {string} country - Country code
 * @returns {Array} - List of crisis resources
 */
function getCrisisResources(type = null, country = "us") {
  const resources = CRISIS_RESOURCES[country] || CRISIS_RESOURCES.us;

  // Filter relevant resources by type
  const typeMap = {
    suicide: [
      "National Suicide Prevention Lifeline",
      "Crisis Text Line",
      "Emergency Services",
    ],
    self_harm: ["Crisis Text Line", "National Suicide Prevention Lifeline"],
    severe_crisis: [
      "National Crisis Line",
      "National Suicide Prevention Lifeline",
    ],
    abuse: ["National Domestic Violence Hotline", "Emergency Services"],
    substance: ["National Crisis Line", "Emergency Services"],
    error: ["Emergency Services", "National Suicide Prevention Lifeline"],
  };

  const relevant = typeMap[type] || Object.keys(resources);

  return relevant
    .filter((name) => resources[name])
    .map((name) => ({
      name,
      ...resources[name],
    }));
}

/**
 * Format crisis response for API return
 *
 * @param {Object} crisisCheck - Result from performCrisisCheck
 * @returns {Object} - Formatted response for frontend
 */
export function formatCrisisResponse(crisisCheck) {
  if (!crisisCheck.isCrisis) {
    return null;
  }

  return {
    ok: true,
    isCrisis: true,
    severity: crisisCheck.severity,
    type: crisisCheck.type,
    message: crisisCheck.message,
    resources: crisisCheck.resources,
    timestamp: new Date().toISOString(),
    note: "This response is from our safety system. A trained crisis counselor is available 24/7.",
  };
}

export default {
  performCrisisCheck,
  formatCrisisResponse,
  getCrisisResources,
  CRISIS_PATTERNS,
  CRISIS_RESOURCES,
};
