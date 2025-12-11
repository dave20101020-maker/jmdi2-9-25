import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ status: "NorthStar", message: "Public site placeholder" });
});

router.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default router;
