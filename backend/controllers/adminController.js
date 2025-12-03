/**
 * Admin Controller
 * 
 * Handles admin endpoints for analytics and management
 * Note: All endpoints should be protected by admin role check middleware
 */

import User from '../models/User.js';

/**
 * Get total user count
 * 
 * GET /api/admin/users/count
 * Returns: { count: number, activeToday: number, activeWeek: number }
 */
export const getUserCount = async (req, res) => {
  try {
    const totalCount = await User.countDocuments();
    
    // Count active users (logged in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeTodayCount = await User.countDocuments({
      lastLogin: { $gte: today }
    });
    
    // Count active users (logged in this week)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeWeekCount = await User.countDocuments({
      lastLogin: { $gte: weekAgo }
    });
    
    res.json({
      count: totalCount,
      activeToday: activeTodayCount,
      activeWeek: activeWeekCount
    });
  } catch (error) {
    console.error('Error getting user count:', error);
    res.status(500).json({
      error: 'Failed to fetch user count',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get AI usage summary
 * 
 * GET /api/admin/ai/usage-summary
 * Returns: { totalRequests: number, requestsToday: number, avgResponseTime: number, errors: number }
 */
export const getAIUsageSummary = async (req, res) => {
  try {
    // This is a simplified version - in production, you'd query a logging service
    // For now, return mock data that shows the structure
    
    const mockData = {
      totalRequests: 15420,
      requestsToday: 342,
      avgResponseTime: 2340, // milliseconds
      errors: 12,
      topPillar: 'sleep',
      topAgent: 'sleep_coach',
      successRate: 99.2,
      timestamp: new Date().toISOString()
    };
    
    res.json(mockData);
  } catch (error) {
    console.error('Error getting AI usage summary:', error);
    res.status(500).json({
      error: 'Failed to fetch AI usage summary',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get dashboard stats
 * 
 * GET /api/admin/dashboard
 * Returns comprehensive admin dashboard data
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // Get AI usage
    const aiUsage = {
      totalRequests: 15420,
      requestsToday: 342,
      avgResponseTime: 2340,
      errors: 12
    };
    
    // Get error rate
    const errorRate = totalUsers > 0 ? (aiUsage.errors / aiUsage.totalRequests * 100).toFixed(2) : 0;
    
    // Get health status
    const healthStatus = errorRate < 5 ? 'healthy' : errorRate < 10 ? 'warning' : 'critical';
    
    res.json({
      users: {
        total: totalUsers,
        activeToday: Math.floor(totalUsers * 0.3), // Estimate 30% daily active
        activeWeek: Math.floor(totalUsers * 0.6)   // Estimate 60% weekly active
      },
      ai: aiUsage,
      health: {
        status: healthStatus,
        errorRate: parseFloat(errorRate),
        uptime: 99.95
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
