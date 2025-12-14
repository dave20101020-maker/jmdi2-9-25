import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import * as userController from "../controllers/userController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();
router.use(authRequired);

router.get("/export", asyncHandler(userController.exportUserData));
router.post("/delete-account", asyncHandler(userController.deleteAccount));

router.get("/consent", asyncHandler(userController.getConsent));
router.post("/consent", asyncHandler(userController.updateConsent));
router.put("/consent", asyncHandler(userController.updateConsent));

export default router;
