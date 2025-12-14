import axios from "axios";

/**
 * Admin Client API Wrapper
 *
 * Centralizes all admin API calls with:
 * - Base URL configuration
 * - Error handling
 * - Token management
 * - Response formatting
 */

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

const API_ORIGIN = computeApiOrigin() || "";

const adminClient = {
  /**
   * Get user count statistics
   * @returns {Promise<{count: number, activeToday: number, activeWeek: number}>}
   */
  getUserCount: async () => {
    try {
      const response = await axios.get(`${API_ORIGIN}/api/admin/users/count`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user count:", error);
      throw error;
    }
  },

  /**
   * Get AI usage summary
   * @returns {Promise<{totalRequests: number, requestsToday: number, avgResponseTime: number, errors: number, successRate: number}>}
   */
  getAIUsageSummary: async () => {
    try {
      const response = await axios.get(
        `${API_ORIGIN}/api/admin/ai/usage-summary`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch AI usage summary:", error);
      throw error;
    }
  },

  /**
   * Get comprehensive dashboard statistics
   * @returns {Promise<{users: object, ai: object, health: object, timestamp: string}>}
   */
  getDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_ORIGIN}/api/admin/dashboard`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      throw error;
    }
  },

  /**
   * Check if user has admin access
   * @returns {Promise<{isAdmin: boolean}>}
   */
  checkAdminAccess: async () => {
    try {
      const response = await axios.get(`${API_ORIGIN}/api/admin/access`, {
        withCredentials: true,
      });
      return response.data.isAdmin;
    } catch (error) {
      // 403 means user exists but isn't admin, which is expected
      if (error.response?.status === 403) {
        return false;
      }
      console.error("Failed to check admin access:", error);
      throw error;
    }
  },
};

export { adminClient };
export default adminClient;
