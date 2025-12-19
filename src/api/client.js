import axios from "axios";
import { classifyApiError } from "./errorClassifier";

const rawEnvBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

const isCodespacesHost = (hostname) =>
  typeof hostname === "string" && hostname.endsWith(".app.github.dev");

const toOriginOnly = (value) => {
  if (!value) return "";
  if (typeof value !== "string") return "";
  if (value.startsWith("/")) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

const computeApiOrigin = () => {
  const currentOrigin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  const envOrigin = toOriginOnly(rawEnvBase);

  if (!envOrigin) return currentOrigin;

  if (typeof window !== "undefined" && window.location) {
    const currentHost = window.location.hostname;
    const envHost = (() => {
      try {
        return new URL(envOrigin).hostname;
      } catch {
        return "";
      }
    })();

    if (isCodespacesHost(currentHost) && isCodespacesHost(envHost)) {
      if (currentHost !== envHost) {
        return currentOrigin;
      }
    }
  }

  return envOrigin;
};

// Note: Most callers pass paths that already include `/api/...`.
// Keep this base URL origin-only to avoid `/api/api/...` duplication.
const API_BASE_URL = computeApiOrigin() || "";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for JWT authentication
});

// Request interceptor for adding auth tokens if needed
client.interceptors.request.use(
  (config) => {
    // Add any custom headers or tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const classification = classifyApiError(error);

    // Emit global error event for toast notifications
    if (
      classification?.showToast &&
      typeof window !== "undefined" &&
      window.dispatchEvent
    ) {
      const message =
        error.response?.data?.message || error.message || "An error occurred";
      window.dispatchEvent(new CustomEvent("api-error", { detail: message }));
    }

    if (classification?.silent) {
      // Mark error so downstream handlers don't toast
      error.__suppressToast = true;
      return Promise.resolve({ data: null });
    }

    return Promise.reject(error);
  }
);

// GET request
export const get = async (url, config = {}) => {
  const response = await client.get(url, config);
  return response.data;
};

// POST request
export const post = async (url, data = {}, config = {}) => {
  const response = await client.post(url, data, config);
  return response.data;
};

// PUT request
export const put = async (url, data = {}, config = {}) => {
  const response = await client.put(url, data, config);
  return response.data;
};

// DELETE request
export const del = async (url, config = {}) => {
  const response = await client.delete(url, config);
  return response.data;
};

// PATCH request (bonus)
export const patch = async (url, data = {}, config = {}) => {
  const response = await client.patch(url, data, config);
  return response.data;
};

// Export the client instance for custom usage
export default client;
