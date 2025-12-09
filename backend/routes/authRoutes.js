import express from "express";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate, userSchemas } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  refresh,
  logout,
  currentUser,
} from "../controllers/authRoutesController.js";

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validate({ body: userSchemas.register }),
  register
);
router.post(
  "/login",
  authRateLimiter,
  validate({ body: userSchemas.login }),
  login
);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, currentUser);

export default router;
