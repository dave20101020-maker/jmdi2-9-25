import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getUserProgress,
  saveUserProgress,
} from "../controllers/progressController.js";

const router = express.Router();

router.use(authRequired);

router.route("/").get(getUserProgress).post(saveUserProgress);

export default router;
