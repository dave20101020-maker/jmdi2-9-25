import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'ns_token';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function setTokenCookie(res, token) {
  // httpOnly, secure in production, sameSite strict, path /
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'username, email and password are required' });
    }

    // Basic password strength check
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    // Check uniqueness
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with that email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ username, email, passwordHash });
    await user.save();

    const token = createToken({ id: user._id, email: user.email });
    setTokenCookie(res, token);

    return res.status(201).json({ success: true, data: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('registerUser error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, error: 'emailOrUsername and password required' });
    }

    const user = await User.findOne({ $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }] });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = createToken({ id: user._id, email: user.email });
    setTokenCookie(res, token);

    return res.status(200).json({ success: true, data: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('loginUser error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies?.[process.env.JWT_COOKIE_NAME || 'ns_token'];
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('getCurrentUser error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
