import axios from 'axios';

/**
 * Admin Client API Wrapper
 * 
 * Centralizes all admin API calls with:
 * - Base URL configuration
 * - Error handling
 * - Token management
 * - Response formatting
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const adminClient = {
  /**
   * Get user count statistics
   * @returns {Promise<{count: number, activeToday: number, activeWeek: number}>}
   */
  getUserCount: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/users/count`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user count:', error);
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
        `${API_BASE_URL}/api/admin/ai/usage-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch AI usage summary:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive dashboard statistics
   * @returns {Promise<{users: object, ai: object, health: object, timestamp: string}>}
   */
  getDashboardStats: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Check if user has admin access
   * @returns {Promise<{isAdmin: boolean}>}
   */
  checkAdminAccess: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/access`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.isAdmin;
    } catch (error) {
      // 403 means user exists but isn't admin, which is expected
      if (error.response?.status === 403) {
        return false;
      }
      console.error('Failed to check admin access:', error);
      throw error;
    }
  }
};

export { adminClient };
export default adminClient;
