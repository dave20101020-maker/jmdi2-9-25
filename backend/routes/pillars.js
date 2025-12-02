import express from 'express';
import { upsertPillarScore, getPillarScores, deletePillarScore, postPillarCheckIn, getPillarHistory } from '../controllers/pillarsController.js';
import { authRequired, requirePillarAccess } from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// require auth for pillar operations
router.use(authRequired);

// Create/update a pillar score (body should include `pillar`)
router.post('/', requirePillarAccess(['pillar','pillarId']), asyncHandler(upsertPillarScore));

// List pillar scores (no specific pillar -> allowed for authenticated users)
router.get('/', asyncHandler(getPillarScores));

// POST check-in: create a new daily checkin and update aggregate
router.post('/check-in', requirePillarAccess('pillarId'), asyncHandler(postPillarCheckIn));

// GET history for a pillar
router.get('/:pillarId/history', requirePillarAccess('pillarId'), asyncHandler(getPillarHistory));

// Delete by pillar score id (not pillar id) - auth required
router.delete('/:id', asyncHandler(deletePillarScore));

export default router;
