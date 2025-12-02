import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// GET current user's subscription and allowed pillars
router.get('/me', authRequired, subscriptionController.getMySubscription);

// POST upgrade (simulated)
router.post('/upgrade', authRequired, subscriptionController.upgradeSubscription);

export default router;
