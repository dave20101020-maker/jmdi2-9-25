/**
 * Classifies API errors into UX-safe categories.
 *
 * Not all backend failures should surface to users.
 * Missing or optional data should fail silently.
 */

export function classifyApiError(error) {
  if (!error) {
    return { showToast: false };
  }

  const status =
    error.status || error?.response?.status || error?.response?.data?.status;

  // Axios URL can live in multiple places depending on failure mode
  const path =
    error?.path || error?.config?.url || error?.response?.config?.url || "";

  // Network-level errors (e.g. ECONNREFUSED via Vite proxy)
  // These often occur during dev or when optional services are offline
  if (error?.code === "ECONNREFUSED") {
    return {
      showToast: false,
      silent: true,
    };
  }

  // Known optional / non-blocking endpoints
  const optionalPaths = ["/subscription", "/entries", "/timeline", "/stats"];

  if (optionalPaths.some((p) => path.includes(p))) {
    return {
      showToast: false,
      silent: true,
    };
  }

  // Auth-related issues should surface clearly
  if (status === 401 || status === 403) {
    return {
      showToast: true,
      level: "auth",
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
