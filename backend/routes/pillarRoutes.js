import express from 'express'
import { authRequired } from '../middleware/authMiddleware.js'
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
  .post(authRequired, createPillar) // Admin only

router.route('/:id')
  .get(getPillar)
  .put(authRequired, updatePillar) // Admin only
  .delete(authRequired, deletePillar) // Admin only

export default router
