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
