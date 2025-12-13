import express from "express";
import { z } from "zod";
import { authRequired } from "../middleware/authMiddleware.js";
import { validate, friendSchemas, idParam } from "../middleware/validate.js";
import friendController from "../controllers/friendController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.use(authRequired);

// Send friend request (body: { friendId: id|email|username })
router.post(
  "/request",
  validate({ body: friendSchemas.sendRequest }),
  asyncHandler(friendController.sendFriendRequest)
);

// Respond to friend request (accept/decline)
router.post(
  "/respond",
  validate({ body: friendSchemas.respondRequest }),
  asyncHandler(friendController.respondFriendRequest)
);

// List accepted friends
router.get("/", asyncHandler(friendController.listFriends));

// List pending incoming requests
router.get("/pending", asyncHandler(friendController.listPendingRequests));

// Leaderboard endpoints
router.get(
  "/leaderboard/:pillarId",
  validate({ params: z.object({ pillarId: z.string() }) }),
  asyncHandler(friendController.getLeaderboardForPillar)
);
router.get(
  "/leaderboard/overall",
  asyncHandler(friendController.getOverallLeaderboard)
);

// Privacy toggle
router.patch(
  "/:id/privacy",
  validate({ params: idParam, body: friendSchemas.updatePrivacy }),
  asyncHandler(friendController.updatePrivacy)
);

// Mini-challenges
router.get("/challenges", asyncHandler(friendController.listMiniChallenges));
router.post(
  "/challenges",
  validate({ body: friendSchemas.createMiniChallenge }),
  asyncHandler(friendController.createMiniChallenge)
);
router.patch(
  "/challenges/:id",
  validate({ params: idParam, body: friendSchemas.updateMiniChallenge }),
  asyncHandler(friendController.updateMiniChallenge)
);

export default router;
