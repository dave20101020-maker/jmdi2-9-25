import express from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/authMiddleware.js';
import { validate, friendSchemas, idParam } from '../middleware/validate.js';
import friendController from '../controllers/friendController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authRequired);

// Send friend request (body: { friendId: id|email|username })
router.post('/request', validate({ body: friendSchemas.sendRequest }), asyncHandler(friendController.sendFriendRequest));

// Accept friend request (body: { requestId } or { requesterId })
router.post('/accept', validate({ body: friendSchemas.respondRequest }), asyncHandler(friendController.acceptFriendRequest));

// List accepted friends
router.get('/', asyncHandler(friendController.listFriends));

// List pending incoming requests
router.get('/pending', asyncHandler(friendController.listPendingRequests));

// Leaderboard endpoints
router.get('/leaderboard/:pillarId', validate({ params: z.object({ pillarId: z.string() }) }), asyncHandler(friendController.getLeaderboardForPillar));
router.get('/leaderboard/overall', asyncHandler(friendController.getOverallLeaderboard));

export default router;
