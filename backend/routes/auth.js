import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshSession,
  logoutUser,
  googleOAuthLogin,
  linkGoogleAccount,
  facebookOAuthLogin,
  startFacebookOAuth,
  facebookOAuthCallback,
  linkFacebookAccount,
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
router.post("/google", authLimiter, googleOAuthLogin);
router.get("/facebook", startFacebookOAuth);
router.get("/facebook/callback", facebookOAuthCallback);
router.post("/facebook", authLimiter, facebookOAuthLogin);
router.post("/logout", logoutUser);
router.post("/refresh", refreshSession);
router.get("/me", authRequired, getCurrentUser);
router.post("/google/link", authRequired, linkGoogleAccount);
router.post("/facebook/link", authRequired, linkFacebookAccount);

export default router;
