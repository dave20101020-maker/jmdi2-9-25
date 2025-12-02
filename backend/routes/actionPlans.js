import express from 'express';
import { authRequired, requirePillarAccess } from '../middleware/authMiddleware.js';
import actionPlanController from '../controllers/actionPlanController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// protect all action-plan endpoints
router.use(authRequired);

// create new plan (body must include pillarId)
router.post('/', requirePillarAccess('pillarId'), asyncHandler(actionPlanController.createActionPlan));

// get latest plan for a pillar
router.get('/:pillarId', requirePillarAccess('pillarId'), asyncHandler(actionPlanController.getLatestPlanForPillar));

export default router;
