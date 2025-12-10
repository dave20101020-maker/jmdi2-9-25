import AnalyticsEvent from "../models/AnalyticsEvent.js";
import logger from "./logger.js";

const sanitizePayload = (payload = {}) => {
  if (!payload || typeof payload !== "object") return {};
  const clone = { ...payload };
  if (clone.password) delete clone.password;
  if (clone.token) delete clone.token;
  return clone;
};

export const recordEvent = async (
  eventType,
  { userId, payload = {}, source = "backend", ip } = {}
) => {
  if (!eventType) {
    logger.warn("Analytics event skipped: missing eventType");
    return null;
  }

  try {
    const event = await AnalyticsEvent.create({
      userId: userId ? String(userId) : undefined,
      eventType,
      source,
      ip,
      payload: sanitizePayload(payload),
    });
    return event;
  } catch (error) {
    logger.warn("Analytics event logging failed", {
      eventType,
      userId,
      error: error.message,
    });
    return null;
  }
};

export default {
  recordEvent,
};
