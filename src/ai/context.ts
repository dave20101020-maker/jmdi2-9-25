import PILLARS from "@/config/pillars";

export type AIContext = {
  /**
   * Current pillar focus derived from the UI.
   *
   * NOTE: Use "general" when no pillar focus is detectable.
   */
  pillar: string;
  /**
   * Optional sub-module within a pillar (e.g. "coping_toolkit").
   * Keep null when unknown.
   */
  module: string | null;
  /**
   * The current UI route (pathname + search + hash).
   * Useful as low-risk metadata for the AI orchestrator.
   */
  route: string;
};

const KNOWN_PILLAR_IDS = new Set(
  (Array.isArray(PILLARS) ? PILLARS : [])
    .map((p) => String(p?.id || ""))
    .filter(Boolean)
);

const normalizeId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    // allow either "physical-health" or "physical_health" in URLs
    .replace(/-/g, "_");

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const inferModuleFromPath = (pathname: string) => {
  // Supports future sub-routes like /pillars/:pillarId/:module
  const parts = pathname.split("/").filter(Boolean);
  const pillarsIndex = parts.indexOf("pillars");
  if (pillarsIndex === -1) return null;

  const maybeModule = parts[pillarsIndex + 2];
  if (!maybeModule) return null;

  const normalized = normalizeId(safeDecode(maybeModule));
  // Avoid treating common route fragments as modules.
  if (normalized === "overview") return null;

  return normalized || null;
};

const inferModuleFromSearchOrHash = (search: string, hash: string) => {
  try {
    const params = new URLSearchParams(search || "");
    const fromSearch = params.get("module") || params.get("focus");
    if (fromSearch) return normalizeId(fromSearch);
  } catch {
    // ignore
  }

  const cleanedHash = (hash || "").replace(/^#/, "").trim();
  if (!cleanedHash) return null;

  // If you ever encode module in the hash, prefer a clear prefix.
  // Example: /pillars/mental_health#module=coping_toolkit
  if (cleanedHash.toLowerCase().startsWith("module=")) {
    return normalizeId(cleanedHash.slice("module=".length));
  }

  return null;
};

/**
 * Derives the current AI context from a React Router-style location.
 *
 * This is frontend-only and safe: if we cannot infer context we fall back to
 * { pillar: "general", module: null }.
 */
export function getCurrentAIContext(location: {
  pathname?: string;
  search?: string;
  hash?: string;
}): AIContext {
  const pathname = String(location?.pathname || "/");
  const search = String(location?.search || "");
  const hash = String(location?.hash || "");

  const route = `${pathname}${search}${hash}`;

  let pillar = "general";
  let module: string | null = null;

  const match = pathname.match(/^\/pillars\/([^/]+)(?:\/|$)/i);
  if (match?.[1]) {
    const raw = normalizeId(safeDecode(match[1]));
    // Prefer known pillars, but do not block if unknown.
    pillar = raw || "general";
    if (KNOWN_PILLAR_IDS.size && raw && !KNOWN_PILLAR_IDS.has(raw)) {
      // Keep the raw value as-is for forward compatibility.
      pillar = raw;
    }
  }

  module =
    inferModuleFromSearchOrHash(search, hash) ||
    inferModuleFromPath(pathname) ||
    null;

  return { pillar, module, route };
}
