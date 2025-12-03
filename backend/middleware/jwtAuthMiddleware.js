/**
 * JWT Authentication Middleware for AI Routes
 * 
 * Extracts userId from JWT token and attaches it to req.userId
 * for all AI requests. Provides fallback to session/body userId
 * for development/testing.
 */

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * Extract userId from various sources:
 * 1. JWT token in Authorization header
 * 2. Session userId
 * 3. Body userId (development only)
 * 4. IP address as fallback
 * 
 * @param {Object} req - Express request
 * @returns {string} - User ID
 */
export function extractUserId(req) {
  // Priority 1: JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.userId) {
        return decoded.userId;
      }
    } catch (error) {
      logger.warn(`Invalid JWT token: ${error.message}`);
    }
  }

  // Priority 2: User from session/auth
  if (req.user?.id) {
    return req.user.id;
  }

  // Priority 3: Session userId
  if (req.session?.userId) {
    return req.session.userId;
  }

  // Priority 4: Development fallback - userId in request body
  if (process.env.NODE_ENV === 'development' && req.body?.userId) {
    return req.body.userId;
  }

  // Priority 5: IP address as fallback (not ideal but allows anonymous)
  return `anon_${req.ip}`;
}

/**
 * Main JWT auth middleware
 * 
 * Extracts userId and attaches to req.userId
 * Does NOT require authentication - allows anonymous access with IP fallback
 * 
 * Usage:
 * app.use('/api/orchestrator', jwtAuthMiddleware);
 */
export function jwtAuthMiddleware(req, res, next) {
  try {
    req.userId = extractUserId(req);
    
    // Log authentication info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Route] userId: ${req.userId}, path: ${req.path}`);
    }
    
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    // Continue anyway - fallback to IP
    req.userId = `anon_${req.ip}`;
    next();
  }
}

/**
 * Strict authentication middleware - REQUIRES valid JWT
 * 
 * Use this for protected routes that need authentication
 * 
 * Usage:
 * app.use('/api/protected', requireAuth);
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
      message: 'Missing or invalid Authorization header'
    });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.userId) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid token',
        message: 'Token does not contain userId'
      });
    }

    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: 'Invalid token',
      message: error.message
    });
  }
}

/**
 * Create a JWT token
 * 
 * Utility function for testing or login routes
 * 
 * @param {string} userId - User ID
 * @param {Object} [extra={}] - Additional claims
 * @returns {string} - JWT token
 */
export function createToken(userId, extra = {}) {
  return jwt.sign(
    {
      userId,
      iat: Math.floor(Date.now() / 1000),
      ...extra
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a JWT token
 * 
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token
 * @throws {Error} - If token is invalid
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export default jwtAuthMiddleware;
