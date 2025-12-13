import logger from "./logger.js";

const providerKey = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
const HEALTH_CACHE_MS = 60_000;
const PROVIDER_TIMEOUT_MS = 1500;

let lastProviderCheck = null;
let aiProviderPresent = Boolean(providerKey);
let aiProviderStatus = providerKey ? "error" : "not-configured";

function markNotConfigured() {
  aiProviderPresent = false;
  aiProviderStatus = "not-configured";
  lastProviderCheck = new Date().toISOString();
}

async function pingProvider() {
  if (!providerKey) {
    markNotConfigured();
    return {
      aiProviderPresent,
      aiProviderStatus,
      lastProviderCheck,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/models?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${providerKey}`,
      },
      signal: controller.signal,
    });

    aiProviderPresent = true;
    aiProviderStatus = res.ok ? "ok" : "error";
  } catch (error) {
    aiProviderPresent = true;
    aiProviderStatus = "error";
    logger.warn("AI provider health ping failed", {
      message: error?.message,
    });
  } finally {
    clearTimeout(timeout);
    lastProviderCheck = new Date().toISOString();
  }

  return {
    aiProviderPresent,
    aiProviderStatus,
    lastProviderCheck,
  };
}

export async function getProviderHealth({ force } = {}) {
  const now = Date.now();
  const last = lastProviderCheck ? Date.parse(lastProviderCheck) : 0;
  const stale = !last || now - last > HEALTH_CACHE_MS;

  if (force || stale) {
    return pingProvider();
  }

  return {
    aiProviderPresent,
    aiProviderStatus,
    lastProviderCheck,
  };
}

export function primeProviderHealth() {
  getProviderHealth({ force: true }).catch((err) => {
    logger.warn("Prime AI provider health failed", { message: err?.message });
  });
}
