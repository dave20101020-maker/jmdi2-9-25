/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Rate Limiting Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Protects against:
 * - API abuse
 * - Cost explosions from excessive AI API calls
 * - Brute force attacks
 * - Resource exhaustion
 * 
 * Uses express-rate-limit for robust rate limiting with configurable stores
 */

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * AI Route Rate Limiter
 * 10 requests per minute per user
 * Much stricter than general API due to cost
 */
export const aiRateLimiter = rateLimit({
  // Identify users by their userId from JWT or IP address
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  
  // 1 minute window
  windowMs: 1 * 60 * 1000,
  
  // 10 requests per window
  max: 10,
  
  // Don't rate limit successful requests under a certain threshold
  skipSuccessfulRequests: false,
  
  // Don't count certain request types
  skip: (req, res) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    return false;
  },
  
  // Standard response when rate limited
  handler: (req, res, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    
    // Log the rate limit incident
    logger.warn('AI Rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      retryAfter,
    });

    res.status(options.statusCode).json({
      error: true,
      message: `Too many AI requests. Please slow down. Try again in ${retryAfter} seconds.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
      resetTime: new Date(Date.now() + options.windowMs).toISOString(),
    });
  },
  
  // Custom header names
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * General API Rate Limiter
 * 30 requests per minute per user
 */
export const apiRateLimiter = rateLimit({
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  
  windowMs: 1 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: false,
  
  handler: (req, res, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    
    logger.warn('API Rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
      retryAfter,
    });

    res.status(options.statusCode).json({
      error: true,
      message: `Too many requests. Please slow down. Try again in ${retryAfter} seconds.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth Rate Limiter
 * 5 requests per minute per IP
 * Very strict to prevent brute force
 */
export const authRateLimiter = rateLimit({
  keyGenerator: (req, res) => {
    return req.ip || 'anonymous';
  },
  
  windowMs: 1 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  
  handler: (req, res, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    
    logger.warn('Auth Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      retryAfter,
    });

    res.status(options.statusCode).json({
      error: true,
      message: `Too many login attempts. Please try again in ${retryAfter} seconds.`,
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter,
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

export default aiRateLimiter;
