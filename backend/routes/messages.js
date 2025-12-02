import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { validate, messageSchemas, idParam } from '../middleware/validate.js';
import * as messageController from '../controllers/messageController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(authRequired);

router.post('/send', validate({ body: messageSchemas.send }), asyncHandler(messageController.sendMessage));
router.get('/:friendId', validate({ params: idParam }), asyncHandler(messageController.getConversation));

export default router;
