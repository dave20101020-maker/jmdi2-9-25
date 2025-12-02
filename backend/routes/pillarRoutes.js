import express from 'express'
import { authRequired } from '../middleware/authMiddleware.js'
import { validate, pillarSchemas } from '../middleware/validate.js'
import {
  getPillars,
  getPillar,
  createPillar,
  updatePillar,
  deletePillar,
} from '../controllers/pillarController.js'

const router = express.Router()

// Public routes
router.route('/')
  .get(getPillars)
  .post(authRequired, validate({ body: pillarSchemas.create }), createPillar) // Admin only

router.route('/:id')
  .get(validate({ params: pillarSchemas.idParam }), getPillar)
  .put(authRequired, validate({ params: pillarSchemas.idParam, body: pillarSchemas.update }), updatePillar) // Admin only
  .delete(authRequired, validate({ params: pillarSchemas.idParam }), deletePillar) // Admin only

export default router
