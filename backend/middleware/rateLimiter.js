/**
 * Rate Limiting Middleware for AI Routes
 * 
 * Prevents:
 * - API abuse
 * - Cost explosions from excessive API calls
 * - Brute force attacks
 * - Resource exhaustion
 */

/**
 * In-memory rate limiter (for development)
 * Use Redis in production for distributed rate limiting
 */
class RateLimiter {
  constructor() {
    this.store = new Map(); // userId -> { count, resetTime }
  }

  /**
   * Check if request is allowed
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Max requests per window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} - { allowed: boolean, remaining: number, resetTime: Date }
   */
  check(userId, limit = 30, windowMs = 60000) {
    const now = Date.now();
    const entry = this.store.get(userId);

    // New entry or window expired
    if (!entry || now > entry.resetTime) {
      this.store.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: new Date(now + windowMs),
        retryAfter: null
      };
    }

    // Within window
    if (entry.count < limit) {
      entry.count++;
      return {
        allowed: true,
        remaining: limit - entry.count,
        resetTime: new Date(entry.resetTime),
        retryAfter: null
      };
    }

    // Limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(entry.resetTime),
      retryAfter
    };
  }

  /**
   * Reset a user's rate limit (for testing)
   */
  reset(userId) {
    this.store.delete(userId);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get stats (for monitoring)
   */
  getStats() {
    return {
      totalUsers: this.store.size,
      entries: Array.from(this.store.entries()).map(([userId, data]) => ({
        userId,
        count: data.count,
        resetTime: new Date(data.resetTime)
      }))
    };
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Express middleware for AI route rate limiting
 * 30 requests per minute per user
 * 
 * Usage:
 * app.post('/api/ai/chat', aiRateLimitMiddleware, aiChatHandler);
 */
export function aiRateLimitMiddleware(req, res, next) {
  const userId = req.user?.id || req.ip || 'anonymous';
  
  // AI routes are more expensive - stricter limits
  const result = rateLimiter.check(userId, 30, 60000); // 30 req/min

  // Set rate limit headers
  res.set('X-RateLimit-Limit', '30');
  res.set('X-RateLimit-Remaining', result.remaining.toString());
  res.set('X-RateLimit-Reset', result.resetTime.toISOString());

  if (!result.allowed) {
    res.set('Retry-After', result.retryAfter.toString());
    
    return res.status(429).json({
      ok: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      resetTime: result.resetTime
    });
  }

  // Attach rate limit info to request
  req.rateLimit = {
    limit: 30,
    remaining: result.remaining,
    reset: result.resetTime
  };

  next();
}

/**
 * General API rate limiting (less strict)
 * 100 requests per minute per user
 */
export function apiRateLimitMiddleware(req, res, next) {
  const userId = req.user?.id || req.ip || 'anonymous';
  
  const result = rateLimiter.check(userId, 100, 60000); // 100 req/min

  res.set('X-RateLimit-Limit', '100');
  res.set('X-RateLimit-Remaining', result.remaining.toString());
  res.set('X-RateLimit-Reset', result.resetTime.toISOString());

  if (!result.allowed) {
    res.set('Retry-After', result.retryAfter.toString());
    
    return res.status(429).json({
      ok: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter
    });
  }

  req.rateLimit = {
    limit: 100,
    remaining: result.remaining,
    reset: result.resetTime
  };

  next();
}

/**
 * Strict rate limiting for authentication endpoints
 * 5 requests per minute per IP
 */
export function authRateLimitMiddleware(req, res, next) {
  const ip = req.ip || 'anonymous';
  
  const result = rateLimiter.check(ip, 5, 60000); // 5 req/min

  res.set('X-RateLimit-Limit', '5');
  res.set('X-RateLimit-Remaining', result.remaining.toString());
  res.set('X-RateLimit-Reset', result.resetTime.toISOString());

  if (!result.allowed) {
    res.set('Retry-After', result.retryAfter.toString());
    
    return res.status(429).json({
      ok: false,
      error: 'Too many authentication attempts',
      message: `Too many login attempts. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter
    });
  }

  next();
}

/**
 * Export the rate limiter instance for testing/monitoring
 */
export { rateLimiter };

export default aiRateLimitMiddleware;
