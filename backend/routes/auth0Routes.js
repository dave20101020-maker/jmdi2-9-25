import express from "express";
import { auth0Exchange } from "../controllers/auth0SessionController.js";

const router = express.Router();

// Frontend sends: Authorization: Bearer <Auth0 ID token>
router.post("/auth0/exchange", auth0Exchange);

export default router;
