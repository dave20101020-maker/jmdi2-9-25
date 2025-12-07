import express from "express";
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  getPillarStats,
} from "../controllers/entriesController.js";
import {
  authRequired,
  requirePillarAccess,
} from "../middleware/authMiddleware.js";
import { requireSensitiveConsent } from "../middleware/consentGuard.js";
import { validate, entrySchemas, idParam } from "../middleware/validate.js";

const router = express.Router();

// require auth for entries
router.use(authRequired);
router.use(requireSensitiveConsent);

// Create entry (body.pillar) - enforce pillar access
router.post(
  "/",
  validate({ body: entrySchemas.create }),
  requirePillarAccess(["pillar", "pillarId"]),
  createEntry
);

// List entries - if query contains `pillar`, enforce access for that pillar
router.get(
  "/",
  validate({ query: entrySchemas.query }),
  (req, res, next) => {
    if (req.query?.pillar)
      return requirePillarAccess(["pillar", "pillarId"])(req, res, next);
    return next();
  },
  getEntries
);

// Stats for a specific pillar param
router.get(
  "/stats/:userId/:pillar",
  requirePillarAccess("pillar"),
  getPillarStats
);

// Single entry operations (by entry id) - still require auth but entry contains pillar
router.get("/:id", validate({ params: idParam }), getEntry);
router.put(
  "/:id",
  validate({ params: idParam, body: entrySchemas.update }),
  updateEntry
);
router.delete("/:id", validate({ params: idParam }), deleteEntry);

export default router;
