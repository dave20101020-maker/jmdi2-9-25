import AuditLog from "../models/AuditLog.js";
import logger from "../utils/logger.js";

const resolveIp = (req) => {
  if (!req) return null;
  const forwarded =
    req.headers?.["x-forwarded-for"] || req.headers?.["X-Forwarded-For"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
};

export const logAuditEvent = async ({
  action,
  req,
  userId,
  route,
  method,
  ip,
  status = "success",
  description,
  metadata,
}) => {
  if (!action) return;
  try {
    await AuditLog.create({
      action,
      userId: userId ?? req?.user?._id ?? null,
      route: route || req?.originalUrl || req?.url || "unknown",
      method: method || req?.method || "UNKNOWN",
      ip: ip || resolveIp(req),
      status,
      description,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });
  } catch (error) {
    logger.warn("[auditLogger] Failed to record audit log", {
      action,
      error: error.message,
    });
  }
};

export const auditRouteAccess = (action = "route-access") => {
  return (req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      const outcome =
        res.statusCode >= 200 && res.statusCode < 400 ? "success" : "failure";
      logAuditEvent({
        action,
        req,
        status: outcome,
        description: `${req.method} ${req.originalUrl} completed in ${
          Date.now() - startedAt
        }ms`,
      });
    });
    next();
  };
};

export default { logAuditEvent, auditRouteAccess };
