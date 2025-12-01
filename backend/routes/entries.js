import express from 'express';
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  getPillarStats,
} from '../controllers/entriesController.js';

const router = express.Router();

router.post('/', createEntry);
router.get('/', getEntries);
router.get('/stats/:userId/:pillar', getPillarStats);
router.get('/:id', getEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;
