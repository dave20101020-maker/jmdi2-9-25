// ============================================================
// PHASE 6.5 LOCKED: OnboardingProfile migration complete
// - Postgres is primary read path
// - MongoDB retained as fallback only
// - Dual-write completed and stable
// ============================================================

export const READ_SWITCH_PREFIX = "[PHASE 6.4][READ SWITCH]";
export const READ_FALLBACK_PREFIX = "[PHASE 6.4][READ FALLBACK]";

export const isDev = () => process.env.NODE_ENV === "development";

// ============================================================
// PHASE 7 — Mongo fallback kill-switch (read path only)
// Default:
//  - development: enabled (smoother dev)
//  - production: disabled (once you’re ready)
//
// Set explicitly:
//  MONGO_FALLBACK_ENABLED=true|false
// ============================================================
export const isMongoFallbackEnabled = () => {
  const raw = process.env.MONGO_FALLBACK_ENABLED;
  if (raw === undefined || raw === null || raw === "") return isDev();
  return String(raw).toLowerCase() === "true";
};

export const logReadSwitch = (message, meta) => {
  if (!isDev()) return;
  // eslint-disable-next-line no-console
  console.info(`${READ_SWITCH_PREFIX} ${message}`, meta || {});
};

export const logReadFallback = (message, meta) => {
  // Fallback logs must be production-safe: avoid request bodies/tokens.
  // eslint-disable-next-line no-console
  console.warn(`${READ_FALLBACK_PREFIX} ${message}`, meta || {});
};

const isEmptyResult = (value) => {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === "object") return false;
  return !value;
};

/**
 * Postgres-first read with Mongo fallback.
 * - If Postgres throws: fallback to Mongo.
 * - If Postgres returns empty: do a single Mongo check; if Mongo has data, use it and log fallback.
 *
 * NOTE: this extra Mongo check only triggers on empty Postgres results.
 * Phase 6.4 Pillar Check-ins migration complete and locked.
 */
export const pgFirstRead = async ({ pgRead, mongoRead, label, meta }) => {
  const allowFallback = isMongoFallbackEnabled();
  let pgResult;
  try {
    pgResult = await pgRead();
    logReadSwitch(`primary=postgres label=${label}`, meta);

    // Phase 8.1 — runtime parity validation (read-only)
    if (process.env.RUNTIME_PARITY_CHECK === "true" && mongoRead) {
      try {
        const mongoResult = await mongoRead();
        const pgCount = Array.isArray(pgResult) ? pgResult.length : 1;
        const mongoCount = Array.isArray(mongoResult) ? mongoResult.length : 1;

        if (pgCount !== mongoCount) {
          // eslint-disable-next-line no-console
          console.warn(
            `[PARITY][WARN] ${label}: pg=${pgCount} mongo=${mongoCount}`
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[PARITY][ERROR] ${label}:`, err?.message || String(err));
      }
    }
  } catch (error) {
    logReadFallback(`postgres_failed label=${label}`, {
      ...meta,
      name: error?.name,
      code: error?.code,
      message: error?.message || String(error),
    });
    if (!allowFallback) throw error;
    return mongoRead();
  }

  if (allowFallback && isEmptyResult(pgResult)) {
    try {
      const mongoResult = await mongoRead();
      if (!isEmptyResult(mongoResult)) {
        logReadFallback(`postgres_empty_using_mongo label=${label}`, meta);
        return mongoResult;
      }
    } catch (error) {
      // If mongo read fails too, keep the Postgres empty result.
      logReadFallback(`mongo_failed_after_postgres_empty label=${label}`, {
        ...meta,
        name: error?.name,
        code: error?.code,
        message: error?.message || String(error),
      });
    }
  }

  return pgResult;
};
