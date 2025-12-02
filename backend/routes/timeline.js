import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import * as timelineController from '../controllers/timelineController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(authRequired);

router.get('/', asyncHandler(timelineController.getTimeline));

export default router;
