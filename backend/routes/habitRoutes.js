import express from 'express'
import { authRequired } from '../middleware/authMiddleware.js'
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../controllers/habitController.js'

const router = express.Router()

// All habit routes require authentication
router.use(authRequired)

router.route('/')
  .get(getHabits)
  .post(createHabit)

router.route('/:id')
  .get(getHabit)
  .put(updateHabit)
  .delete(deleteHabit)

export default router
