/**
 * Input Sanitization Middleware
 * 
 * Prevents:
 * - Prompt injection attacks
 * - Explicit/harmful content
 * - System prompt exposure attempts
 * - XSS injection
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Patterns to detect prompt injection attempts
 */
const INJECTION_PATTERNS = [
  /ignore previous instructions/gi,
  /disregard instructions/gi,
  /forget .+? instructions/gi,
  /tell me.+? instructions/gi,
  /what.+? instructions/gi,
  /show me.+? instructions/gi,
  /reveal.+? instructions/gi,
  /act as if/gi,
  /pretend you are/gi,
  /you are now/gi,
  /system prompt/gi,
  /hidden instructions/gi,
  /secret instructions/gi,
  /jailbreak/gi,
  /bypass security/gi,
  /forget your guidelines/gi,
  /new instructions/gi,
  /override .+? rules/gi,
  /new role:/gi,
  /assume role:/gi
];

/**
 * Patterns to detect explicit/harmful content
 */
const HARMFUL_PATTERNS = [
  /(?:kill|murder|harm|hurt|violence|rape|sexual|drugs|cocaine|heroin|meth)/gi,
  /(?:suicide|self-harm|cut myself)/gi,
  /(?:bomb|explosive|weapon|gun|shoot)/gi
];

/**
 * Patterns indicating attempts to leak system prompts
 */
const SYSTEM_LEAK_PATTERNS = [
  /what.{0,20}your instructions/gi,
  /show.{0,20}system prompt/gi,
  /reveal.{0,20}prompt/gi,
  /what.{0,20}you told to do/gi,
  /who instructed you/gi,
  /what are your rules/gi,
  /what guidelines do you follow/gi
];

/**
 * Sanitize user input
 * 
 * @param {string} input - User input to sanitize
 * @returns {Object} - { sanitized: string, flagged: boolean, reason: string }
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      flagged: false,
      reason: null
    };
  }

  // Remove HTML/script tags
  let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

  // Check for prompt injection
  if (INJECTION_PATTERNS.some(pattern => pattern.test(input))) {
    return {
      sanitized,
      flagged: true,
      reason: 'prompt_injection_detected'
    };
  }

  // Check for harmful content (but allow for legitimate mental health discussions)
  // Only flag if context doesn't match health-seeking behavior
  const hasHarmfulContent = HARMFUL_PATTERNS.some(pattern => pattern.test(input));
  const isHealthContext = /help|support|therapy|counseling|struggling|depressed|anxious|worried/gi.test(input);
  
  if (hasHarmfulContent && !isHealthContext) {
    return {
      sanitized,
      flagged: true,
      reason: 'harmful_content_detected'
    };
  }

  // Check for system prompt leak attempts
  if (SYSTEM_LEAK_PATTERNS.some(pattern => pattern.test(input))) {
    return {
      sanitized,
      flagged: true,
      reason: 'system_prompt_leak_attempt'
    };
  }

  return {
    sanitized,
    flagged: false,
    reason: null
  };
}

/**
 * Express middleware for input sanitization
 */
export function sanitizationMiddleware(req, res, next) {
  // Sanitize body fields
  if (req.body) {
    if (req.body.message) {
      const result = sanitizeInput(req.body.message);
      
      if (result.flagged) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid input detected',
          reason: result.reason
        });
      }

      req.body.message = result.sanitized;
    }

    if (req.body.text) {
      const result = sanitizeInput(req.body.text);
      
      if (result.flagged) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid input detected',
          reason: result.reason
        });
      }

      req.body.text = result.sanitized;
    }
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      const result = sanitizeInput(req.query[key]);
      if (result.flagged) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid query parameter',
          reason: result.reason
        });
      }
      req.query[key] = result.sanitized;
    });
  }

  next();
}

/**
 * Validate message length
 */
export function validateMessageLength(minLength = 1, maxLength = 5000) {
  return (req, res, next) => {
    const message = req.body?.message;

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: 'Message is required'
      });
    }

    if (message.length < minLength) {
      return res.status(400).json({
        ok: false,
        error: `Message must be at least ${minLength} characters`
      });
    }

    if (message.length > maxLength) {
      return res.status(400).json({
        ok: false,
        error: `Message must not exceed ${maxLength} characters`
      });
    }

    next();
  };
}

/**
 * Crisis detection middleware
 * If user mentions crisis/suicidal content, provide immediate resources
 */
export function crisisDetectionMiddleware(req, res, next) {
  const message = req.body?.message;

  if (!message) {
    return next();
  }

  const crisisPatterns = [
    /suicidal|suicide|kill myself|end it all|want to die/gi,
    /self-harm|cut myself|hurt myself|self-injury/gi,
    /no reason to live|hopeless|worthless|should be dead/gi
  ];

  const isCrisis = crisisPatterns.some(pattern => pattern.test(message));

  if (isCrisis) {
    // Add crisis flag to request for agent to handle
    req.isCrisis = true;
    req.crisisResources = {
      988: '988 (US) - Suicide & Crisis Lifeline - Call or text 988',
      crisis_text: 'Crisis Text Line - Text HOME to 741741',
      international: 'findahelpline.com',
      emergency: 'If in immediate danger, call 911 or go to nearest ER'
    };
  }

  next();
}

/**
 * Sanitize AI response to prevent system prompt leakage
 * @param {string} response - AI response to sanitize
 * @returns {Object} - { sanitized: string, flagged: boolean }
 */
export function sanitizeAIResponse(response) {
  if (!response || typeof response !== 'string') {
    return {
      sanitized: '',
      flagged: false
    };
  }

  let sanitized = response;
  let flagged = false;

  // Remove common system prompt patterns from AI responses
  const leakPatterns = [
    /You are an? (?:AI|assistant|model)/gi,
    /Your instructions? (?:are|is)/gi,
    /You should (?:act|behave|respond)/gi,
    /System prompt:/gi,
    /Internal instructions:/gi,
    /Hidden (?:instructions|rules|guidelines):/gi
  ];

  leakPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      flagged = true;
      sanitized = sanitized.replace(pattern, '');
    }
  });

  return {
    sanitized: sanitized.trim(),
    flagged
  };
}

/**
 * Validate user message
 * @param {string} message - User message to validate
 * @returns {Object} - { valid: boolean, error?: string, violations: string[] }
 */
export function validateUserMessage(message) {
  const violations = [];

  // Check if message exists
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: 'Message is required',
      violations: ['missing_message']
    };
  }

  // Check length
  const minLength = 1;
  const maxLength = 10000;

  if (message.length < minLength) {
    violations.push('message_too_short');
  }

  if (message.length > maxLength) {
    violations.push('message_too_long');
  }

  // Check for injection
  if (INJECTION_PATTERNS.some(pattern => pattern.test(message))) {
    violations.push('prompt_injection_detected');
  }

  // Check for harmful content
  const hasHarmfulContent = HARMFUL_PATTERNS.some(pattern => pattern.test(message));
  const isHealthContext = /help|support|therapy|counseling|struggling|depressed|anxious|worried/gi.test(message);
  
  if (hasHarmfulContent && !isHealthContext) {
    violations.push('harmful_content_detected');
  }

  // Check for system prompt leak attempts
  if (SYSTEM_LEAK_PATTERNS.some(pattern => pattern.test(message))) {
    violations.push('system_prompt_leak_attempt');
  }

  return {
    valid: violations.length === 0,
    error: violations.length > 0 ? 'Message validation failed' : undefined,
    violations
  };
}

export default sanitizationMiddleware;
