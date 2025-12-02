import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { validate, onboardingSchemas } from '../middleware/validate.js';
import { getProfile, saveProfile } from '../controllers/onboardingController.js';

const router = express.Router();

router.use(authRequired);

router.get('/', getProfile);
router.post('/', validate({ body: onboardingSchemas.save }), saveProfile);

export default router;
