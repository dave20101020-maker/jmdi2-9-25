import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { validate, challengeSchemas } from '../middleware/validate.js';
import * as challengeController from '../controllers/challengeController.js';

const router = express.Router();

router.use(authRequired);

router.post('/', validate({ body: challengeSchemas.create }), challengeController.createChallenge);
router.post('/join', validate({ body: challengeSchemas.join }), challengeController.joinChallenge);
router.get('/my', challengeController.myChallenges);

export default router;
