import { emitAuditEvent } from "../../utils/auditLog.js";

export async function appendVaultEvent({ eventType, payload, metadata } = {}) {
  try {
    emitAuditEvent({
      eventType,
      payload,
      metadata,
    });
  } catch {
    // Never fail requests due to audit/event logging
  }
}

export default {
  appendVaultEvent,
};
