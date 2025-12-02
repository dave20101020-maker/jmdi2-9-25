import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(authRequired);

router.get('/', asyncHandler(notificationController.listNotifications));
router.post('/mark-read', asyncHandler(notificationController.markRead));
// internal create endpoint (protected); call from server-side code when needed
router.post('/create', asyncHandler(notificationController.createNotification));

export default router;
