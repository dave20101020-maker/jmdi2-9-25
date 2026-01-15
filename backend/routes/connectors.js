import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getConnector,
  listConnectors,
} from "../src/connectors/ConnectorRegistry.js";

const router = express.Router();
router.use(authRequired);

router.get("/", (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const connectors = listConnectors().map((connector) => {
    const handler = getConnector(connector.id);
    const status = handler?.getStatus ? handler.getStatus({ userId }) : null;
    return {
      ...connector,
      status: status?.status || "disconnected",
      updatedAt: status?.updatedAt || null,
    };
  });

  res.json({ ok: true, connectors });
});

router.post("/google/connect", async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const handler = getConnector("google");
  const result = await handler.connect({ userId, payload: req.body || {} });
  res.json(result);
});

router.post("/google/sync", async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const handler = getConnector("google");
  const result = await handler.sync({ userId });
  res.json(result);
});

router.post("/apple/connect", async (_req, res) => {
  res
    .status(501)
    .json({ ok: false, message: "Apple connector not implemented" });
});

router.post("/apple/sync", async (_req, res) => {
  res
    .status(501)
    .json({ ok: false, message: "Apple connector not implemented" });
});

router.post("/samsung/connect", async (_req, res) => {
  res
    .status(501)
    .json({ ok: false, message: "Samsung connector not implemented" });
});

router.post("/samsung/sync", async (_req, res) => {
  res
    .status(501)
    .json({ ok: false, message: "Samsung connector not implemented" });
});

export default router;
