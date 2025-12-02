import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import friendController from '../controllers/friendController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authRequired);

// Send friend request (body: { friendId: id|email|username })
// Send friend request (body: { friendId: id|email|username })
router.post('/request', asyncHandler(friendController.sendFriendRequest));

// Accept friend request (body: { requestId } or { requesterId })
// Accept friend request (body: { requestId } or { requesterId })
router.post('/accept', asyncHandler(friendController.acceptFriendRequest));

// List accepted friends
// List accepted friends
router.get('/', asyncHandler(friendController.listFriends));

// List pending incoming requests
// List pending incoming requests
router.get('/pending', asyncHandler(friendController.listPendingRequests));

// Leaderboard endpoints
// Leaderboard endpoints
router.get('/leaderboard/:pillarId', asyncHandler(friendController.getLeaderboardForPillar));
router.get('/leaderboard/overall', asyncHandler(friendController.getOverallLeaderboard));

export default router;
