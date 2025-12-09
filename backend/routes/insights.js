import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  createInsight,
  listInsights,
  getInsight,
  deleteInsight,
} from "../controllers/insightsController.js";

const router = express.Router();

router.use(authRequired);

router.route("/").get(listInsights).post(createInsight);

router.route("/:id").get(getInsight).delete(deleteInsight);

export default router;
