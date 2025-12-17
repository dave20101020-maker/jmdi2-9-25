import express from "express";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const { default: prisma } = await import("../src/db/prismaClient.js");
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({ ok: true, postgres: "ok" });
  } catch (err) {
    return res
      .status(503)
      .json({
        ok: false,
        postgres: "error",
        error: err?.code || "unavailable",
      });
  }
});

export default router;
