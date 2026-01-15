import express from "express";
import missionControlRouter from "../src/missionControl/missionControlRouter.js";

const router = express.Router();

router.use("/", missionControlRouter);

export default router;
