import express from 'express';
import rateLimit from 'express-rate-limit';
import { authRequired } from '../middleware/authMiddleware.js';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  exportUserData,
  deleteAccount
} from '../controllers/userController.js';

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Public routes (no authentication required)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes (authentication required)
router.get('/me', authRequired, getCurrentUser);
router.put('/me', authRequired, updateCurrentUser);
router.post('/resend-verification', authRequired, resendVerification);
router.post('/change-password', authRequired, changePassword);
router.get('/export', authRequired, exportUserData);
router.post('/delete-account', authRequired, deleteAccount);

export default router;
