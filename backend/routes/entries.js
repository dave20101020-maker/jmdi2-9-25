import express from 'express';
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  getPillarStats,
} from '../controllers/entriesController.js';
import { authRequired, requirePillarAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// require auth for entries
router.use(authRequired);

// Create entry (body.pillar) - enforce pillar access
router.post('/', requirePillarAccess(['pillar','pillarId']), createEntry);

// List entries - if query contains `pillar`, enforce access for that pillar
router.get('/', (req, res, next) => {
  if (req.query?.pillar) return requirePillarAccess(['pillar','pillarId'])(req, res, next);
  return next();
}, getEntries);

// Stats for a specific pillar param
router.get('/stats/:userId/:pillar', requirePillarAccess('pillar'), getPillarStats);

// Single entry operations (by entry id) - still require auth but entry contains pillar
router.get('/:id', getEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;
