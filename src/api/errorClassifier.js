/**
 * Classifies API errors into UX-safe categories.
 *
 * Not all backend failures should surface to users.
 * Missing or optional data should fail silently.
 */

export function classifyApiError(error) {
  if (!error) {
    return { showToast: false, silent: true };
  }

  // HARD STOP: dev proxy / backend offline noise must never surface
  if (
    error?.code === "ECONNREFUSED" ||
    error?.message?.includes("ECONNREFUSED") ||
    error?.message?.includes("proxy error")
  ) {
    return { showToast: false, silent: true };
  }

  const status =
    error.status || error?.response?.status || error?.response?.data?.status;

  // Axios URL can live in multiple places depending on failure mode
  const path =
    error?.path || error?.config?.url || error?.response?.config?.url || "";

  // Optional read-only endpoints must never toast
  if (path.includes("/entries") || path.includes("/subscription")) {
    return { showToast: false, silent: true };
  }

  // Known optional / non-blocking endpoints
  const optionalPaths = ["/timeline", "/stats"];

  if (optionalPaths.some((p) => path.includes(p))) {
    return {
      showToast: false,
      silent: true,
    };
  }

  // Auth-required noise during dev / unauthenticated shell
  // Do not surface auth toasts unless the user explicitly initiated auth-gated action
  if (status === 401 || status === 403) {
    return {
      showToast: false,
      silent: true,
      authRequired: true,
    };
  }

  // Server errors that block user action
  if (status >= 500) {
    return {
      showToast: true,
      level: "blocking",
    };
  }

  return { showToast: false };
}
