/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Logging Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Logs all AI endpoint activity for:
 * - Monitoring usage patterns
 * - Detecting abuse
 * - Cost tracking
 * - Debugging issues
 * - Compliance/audit trails
 */

import logger from '../utils/logger.js';

/**
 * AI Request/Response Logging Middleware
 * 
 * Logs:
 * - userId or IP
 * - route/endpoint
 * - request method
 * - response status
 * - response time
 * - request size
 * - timestamp
 */
export function aiLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  const userId = req.user?.id || req.user?.email;
  const ip = req.ip;

  // Capture response finish to log complete request/response cycle
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Determine severity based on status code
    const isError = statusCode >= 400;
    const isRateLimit = statusCode === 429;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    // Build log object
    const logData = {
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous',
      ip,
      method: req.method,
      path: req.path,
      route: req.route?.path || 'unknown',
      endpoint: req.path.replace(/^\/api\/ai/, '/api/ai').split('?')[0],
      statusCode,
      responseTime: `${responseTime}ms`,
      requestSize: req.get('content-length') || 'unknown',
      responseSize: Buffer.byteLength(JSON.stringify(data)),
      userAgent: req.get('user-agent'),
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      rateLimitRemaining: req.rateLimit?.remaining,
      rateLimitLimit: req.rateLimit?.limit,
    };

    // Filter undefined values
    Object.keys(logData).forEach(
      (key) => logData[key] === undefined && delete logData[key]
    );

    // Log at appropriate level
    if (isRateLimit) {
      logger.warn('AI Rate Limited', logData);
    } else if (isError) {
      logger.error('AI Request Error', logData);
    } else if (isSuccess) {
      logger.info('AI Request Success', logData);
    } else {
      logger.debug('AI Request', logData);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Log AI endpoint cost tracking
 * Helper function to estimate cost based on endpoint
 */
export function estimateAICost(route, tokensUsed = 0) {
  // Rough estimates (update based on actual pricing)
  const costs = {
    '/api/ai/transcribe': 0.0001, // per minute of audio
    '/api/ai/sentiment': 0.0001, // per request
    '/api/ai/orchestrator': 0.002, // per request (expensive)
    '/api/ai/agent': 0.002, // per pillar agent request
    '/api/ai/crisis-check': 0.001, // per request
  };

  // Default to 0.001 per request if not found
  return costs[route] || 0.001;
}

/**
 * Cost tracking middleware
 * Accumulates usage for billing/monitoring
 */
export function costTrackingMiddleware(req, res, next) {
  const startTime = Date.now();
  const userId = req.user?.id;
  const originalSend = res.send;

  res.send = function (data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Only track successful requests
    if (statusCode >= 200 && statusCode < 300 && userId) {
      const estimatedCost = estimateAICost(req.path);
      
      // Log cost tracking event
      logger.info('AI Cost Tracked', {
        userId,
        endpoint: req.path,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });

      // In a real system, this would write to a billing database
      // Example: await CostLog.create({ userId, endpoint: req.path, cost: estimatedCost, ... })
    }

    return originalSend.call(this, data);
  };

  next();
}

export default aiLoggingMiddleware;
