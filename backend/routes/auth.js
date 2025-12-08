import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshSession,
  logoutUser,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  startFacebookOAuth,
  handleFacebookOAuthCallback,
  startNhsOAuth,
} from "../controllers/authController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/google", startGoogleOAuth);
router.get("/google/callback", handleGoogleOAuthCallback);
router.get("/facebook", startFacebookOAuth);
router.get("/facebook/callback", handleFacebookOAuthCallback);
router.get("/nhs", startNhsOAuth);
router.post("/logout", logoutUser);
router.post("/refresh", refreshSession);
router.get("/me", authRequired, getCurrentUser);

export default router;
