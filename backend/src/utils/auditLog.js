export function emitAuditEvent(event) {
  if (process.env.AUDIT_LOG_ENABLED !== "true") return;

  try {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        type: "AUDIT_EVENT",
        ts: new Date().toISOString(),
        ...event,
      })
    );
  } catch {
    // Never fail requests due to audit logging
  }
}
