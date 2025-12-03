/**
 * Admin Routes
 * 
 * All routes require admin authentication
 * Format: /api/admin/*
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  getUserCount,
  getAIUsageSummary,
  getDashboardStats
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * Middleware: Verify authentication and admin role
 */
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/users/count
 * Get total user count and active user statistics
 */
router.get('/users/count', getUserCount);

/**
 * GET /api/admin/ai/usage-summary
 * Get AI service usage statistics
 */
router.get('/ai/usage-summary', getAIUsageSummary);

/**
 * GET /api/admin/dashboard
 * Get comprehensive dashboard statistics
 */
router.get('/dashboard', getDashboardStats);

export default router;
