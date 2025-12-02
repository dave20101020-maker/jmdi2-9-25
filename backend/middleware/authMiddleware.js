import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'ns_token';

export const authRequired = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.headers['authorization']?.replace(/^Bearer\s+/, '');
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    console.error('authRequired error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Middleware factory to require that the current user has access to a pillar.
 * pillarParamKey: the key in req.params or req.body where the pillar id can be found.
 */
export const requirePillarAccess = (pillarParamKey = 'pillarId') => {
  // pillarParamKey may be a string or array of candidate keys
  const keys = Array.isArray(pillarParamKey) ? pillarParamKey : [pillarParamKey];
  return async (req, res, next) => {
    try {
      // ensure authRequired has run or run it here
      if (!req.user) {
        await authRequired(req, res, () => {});
        if (!req.user) return; // authRequired already sent a response
      }

      // try params, body, or query for any of the candidate keys
      let pillarId = null;
      for (const key of keys) {
        if (!pillarId) pillarId = req.params?.[key] || req.body?.[key] || req.query?.[key];
      }

      if (!pillarId) {
        return res.status(400).json({ success: false, error: 'Missing pillar identifier in request' });
      }

      const allowed = Array.isArray(req.user.allowedPillars) ? req.user.allowedPillars : [];
      if (!allowed.includes(pillarId)) {
        return res.status(403).json({ success: false, error: `Access to pillar '${pillarId}' is not permitted for your subscription tier (${req.user.subscriptionTier || 'unknown'})` });
      }

      next();
    } catch (err) {
      console.error('requirePillarAccess error', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  };
};

/**
 * Logout handler - clears the authentication cookie
 */
export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export default { authRequired, requirePillarAccess, logout };
