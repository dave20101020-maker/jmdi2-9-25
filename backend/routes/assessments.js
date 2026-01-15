import express from "express";
import assessmentRouter from "../src/assessments/assessmentRouter.js";

const router = express.Router();

router.use("/", assessmentRouter);

export default router;
