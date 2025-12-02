import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { getProfile, saveProfile } from '../controllers/onboardingController.js';

const router = express.Router();

router.use(authRequired);

router.get('/', getProfile);
router.post('/', saveProfile);

export default router;
