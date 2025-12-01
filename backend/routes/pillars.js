import express from 'express';
import { upsertPillarScore, getPillarScores, deletePillarScore } from '../controllers/pillarsController.js';

const router = express.Router();

router.post('/', upsertPillarScore);
router.get('/', getPillarScores);
router.delete('/:id', deletePillarScore);

export default router;
