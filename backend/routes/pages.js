import express from "express";
import { getPageManifest } from "../controllers/pagesController.js";

const router = express.Router();

router.get("/manifest", getPageManifest);

export default router;
