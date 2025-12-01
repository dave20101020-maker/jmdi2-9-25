import express from 'express';
import {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  completeHabit,
  deleteHabit,
} from '../controllers/habitsController.js';

const router = express.Router();

router.post('/', createHabit);
router.get('/', getHabits);
router.get('/:id', getHabit);
router.put('/:id', updateHabit);
router.post('/:id/complete', completeHabit);
router.delete('/:id', deleteHabit);

export default router;
