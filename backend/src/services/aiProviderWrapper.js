import logger from "../../utils/logger.js";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 250;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 2 * 60 * 1000; // 2 minutes

const circuitState = {
  failureCount: 0,
  openUntil: 0,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractStatus = (err) => {
  if (!err) return undefined;
  if (err.status) return err.status;
  if (err.response?.status) return err.response.status;
  if (err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT") return 408;
  if (err.code === "ECONNRESET") return 502;
  return undefined;
};

const isTransient = (status, err) => {
  if (!status) {
    const code = err?.code?.toLowerCase?.();
    return code?.includes("timeout") || code === "ecconnreset";
  }
  return [408, 502, 503, 504].includes(status);
};

const isCircuitOpen = () => Date.now() < circuitState.openUntil;

const openCircuit = (label) => {
  circuitState.openUntil = Date.now() + CIRCUIT_OPEN_MS;
  logger.warn("AI provider circuit opened", {
    label,
    failureCount: circuitState.failureCount,
    retryAt: new Date(circuitState.openUntil).toISOString(),
  });
};

const recordFailure = (label) => {
  circuitState.failureCount += 1;
  if (
    circuitState.failureCount >= CIRCUIT_FAILURE_THRESHOLD &&
    !isCircuitOpen()
  ) {
    openCircuit(label);
  }
};

const recordSuccess = (label) => {
  if (circuitState.failureCount > 0 || isCircuitOpen()) {
    logger.info("AI provider circuit reset", {
      label,
      previousFailures: circuitState.failureCount,
    });
  }
  circuitState.failureCount = 0;
  circuitState.openUntil = 0;
};

export async function callProviderWithResilience(label, fn) {
  if (isCircuitOpen()) {
    return {
      ok: false,
      error: true,
      message:
        "AI temporarily unavailable. Please try again in a couple of minutes.",
      circuitOpen: true,
      retryAt: new Date(circuitState.openUntil).toISOString(),
    };
  }

  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const result = await fn();

      const transientStatus = extractStatus(result);
      if (result?.ok === false && isTransient(transientStatus, result)) {
        throw result;
      }

      recordSuccess(label);
      return result;
    } catch (err) {
      lastError = err;
      const status = extractStatus(err);

      if (!isTransient(status, err)) {
        recordSuccess(label);
        throw err;
      }

      recordFailure(label);

      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** attempt, 2000);
      logger.warn("AI provider transient error — retrying", {
        label,
        attempt: attempt + 1,
        status,
        backoffMs: backoff,
        message: err?.message,
      });

      if (attempt < MAX_RETRIES - 1) {
        await sleep(backoff);
      }
    }
  }

  const status = extractStatus(lastError);
  return {
    ok: false,
    error: true,
    status,
    message: "AI temporarily unavailable after retries",
    circuitOpen: isCircuitOpen(),
    retryAt: isCircuitOpen()
      ? new Date(circuitState.openUntil).toISOString()
      : undefined,
  };
}
