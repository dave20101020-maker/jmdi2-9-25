import express from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js';
import { logout } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply cookie parser to this router
router.use(cookieParser());

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

export default router;
