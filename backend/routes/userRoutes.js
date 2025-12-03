import express from 'express';
import rateLimit from 'express-rate-limit';
import { authRequired } from '../middleware/authMiddleware.js';
import { validate, userSchemas } from '../middleware/validate.js';
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
  deleteAccount,
  updateConsent,
  getConsent
} from '../controllers/userController.js';

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Public routes (no authentication required)
router.post('/register', authLimiter, validate({ body: userSchemas.register }), register);
router.post('/login', authLimiter, validate({ body: userSchemas.login }), login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, validate({ body: userSchemas.forgotPassword }), forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: userSchemas.resetPassword }), resetPassword);

// Protected routes (authentication required)
router.get('/me', authRequired, getCurrentUser);
router.put('/me', authRequired, validate({ body: userSchemas.updateProfile }), updateCurrentUser);
router.post('/resend-verification', authRequired, resendVerification);
router.post('/change-password', authRequired, validate({ body: userSchemas.changePassword }), changePassword);
router.get('/export', authRequired, exportUserData);
router.post('/delete-account', authRequired, deleteAccount);

// AI Consent routes
router.get('/consent', authRequired, getConsent);
router.post('/consent', authRequired, updateConsent);

export default router;
