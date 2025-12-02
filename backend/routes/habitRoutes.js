import express from 'express'
import { authRequired } from '../middleware/authMiddleware.js'
import { validate, habitSchemas } from '../middleware/validate.js'
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
  .post(validate({ body: habitSchemas.create }), createHabit)

router.route('/:id')
  .get(validate({ params: habitSchemas.idParam }), getHabit)
  .put(validate({ params: habitSchemas.idParam, body: habitSchemas.update }), updateHabit)
  .delete(validate({ params: habitSchemas.idParam }), deleteHabit)

export default router
