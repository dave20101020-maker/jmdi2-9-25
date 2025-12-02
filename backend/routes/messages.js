import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import * as messageController from '../controllers/messageController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(authRequired);

router.post('/send', asyncHandler(messageController.sendMessage));
router.get('/:friendId', asyncHandler(messageController.getConversation));

export default router;
