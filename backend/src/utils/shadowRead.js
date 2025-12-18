// Phase 6.4 Pillar Check-ins migration complete and locked.
// Shadow-read comparison logging is intentionally disabled.

export const isDev = () => process.env.NODE_ENV === "development";

// Kept for backwards compatibility; no longer invoked.
export const runDevShadowRead = () => {
  return;
};

// Kept for backwards compatibility; no longer emits logs.
export const logShadowReadMismatch = () => {
  return;
};
