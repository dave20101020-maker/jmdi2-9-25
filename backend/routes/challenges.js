import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import * as challengeController from '../controllers/challengeController.js';

const router = express.Router();

router.use(authRequired);

router.post('/', challengeController.createChallenge);
router.post('/join', challengeController.joinChallenge);
router.get('/my', challengeController.myChallenges);

export default router;
