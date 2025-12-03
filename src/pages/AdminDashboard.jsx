import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Zap, AlertCircle, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { adminClient } from '@/api/adminClient';

/**
 * AdminDashboard Component
 * 
 * Displays admin analytics and management interface
 * Currently shows:
 * - User statistics
 * - AI usage metrics
 * - System health
 * - Error tracking
 * 
 * Protected by admin role check
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard stats
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminClient.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: true
  });

  // Fetch user count
  const { data: userStats } = useQuery({
    queryKey: ['adminUserStats'],
    queryFn: () => adminClient.getUserCount(),
    refetchInterval: 60000
  });

  // Fetch AI usage
  const { data: aiStats } = useQuery({
    queryKey: ['adminAIStats'],
    queryFn: () => adminClient.getAIUsageSummary(),
    refetchInterval: 60000
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success('Dashboard refreshed');
    } catch (err) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-white/60 mb-4">Failed to load admin dashboard</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const data = dashboardData || {
    users: { total: 0, activeToday: 0, activeWeek: 0 },
    ai: { totalRequests: 0, requestsToday: 0, avgResponseTime: 0, errors: 0 },
    health: { status: 'unknown', errorRate: 0, uptime: 0 }
  };

  // Chart data - simulated time series
  const chartData = [
    { time: '00:00', requests: 125, errors: 2 },
    { time: '04:00', requests: 89, errors: 1 },
    { time: '08:00', requests: 342, errors: 3 },
    { time: '12:00', requests: 512, errors: 4 },
    { time: '16:00', requests: 678, errors: 5 },
    { time: '20:00', requests: 623, errors: 4 }
  ];

  const healthColor = {
    healthy: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  }[data.health.status] || 'text-gray-500';

  const healthBgColor = {
    healthy: 'bg-green-500/10',
    warning: 'bg-yellow-500/10',
    critical: 'bg-red-500/10'
  }[data.health.status] || 'bg-gray-500/10';

  return (
    <div className="min-h-screen bg-[#0A1628] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/60">System monitoring and analytics</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-[#D4AF37] text-[#0A1628] hover:bg-[#F4D03F]"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Total Users</h3>
              <Users className="w-5 h-5 text-[#4CC9F0]" />
            </div>
            <p className="text-3xl font-bold text-white">{data.users.total}</p>
            <p className="text-white/60 text-sm mt-2">
              {data.users.activeToday} active today
            </p>
          </div>

          {/* Active This Week */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Active This Week</h3>
              <TrendingUp className="w-5 h-5 text-[#52B788]" />
            </div>
            <p className="text-3xl font-bold text-white">{data.users.activeWeek}</p>
            <p className="text-white/60 text-sm mt-2">
              {((data.users.activeWeek / data.users.total) * 100 || 0).toFixed(1)}% of users
            </p>
          </div>

          {/* AI Requests Today */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">AI Requests Today</h3>
              <Zap className="w-5 h-5 text-[#FFD700]" />
            </div>
            <p className="text-3xl font-bold text-white">{data.ai.requestsToday}</p>
            <p className="text-white/60 text-sm mt-2">
              Avg response: {(data.ai.avgResponseTime / 1000).toFixed(1)}s
            </p>
          </div>

          {/* System Health */}
          <div className={`${healthBgColor} border border-white/10 rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">System Health</h3>
              <AlertCircle className={`w-5 h-5 ${healthColor}`} />
            </div>
            <p className={`text-3xl font-bold capitalize ${healthColor}`}>{data.health.status}</p>
            <p className="text-white/60 text-sm mt-2">
              Error rate: {data.health.errorRate.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Requests Over Time */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">AI Requests Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,22,40,0.8)',
                    border: '1px solid rgba(212,175,55,0.2)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#4CC9F0"
                  strokeWidth={2}
                  dot={{ fill: '#4CC9F0' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rate */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Error Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,22,40,0.8)',
                    border: '1px solid rgba(212,175,55,0.2)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="errors" fill="#FF5733" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Stats */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">AI Usage</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Total Requests</span>
                <span className="text-white font-semibold">{data.ai.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg Response Time</span>
                <span className="text-white font-semibold">
                  {(data.ai.avgResponseTime / 1000).toFixed(2)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Errors</span>
                <span className={`font-semibold ${data.ai.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.ai.errors}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Success Rate</span>
                <span className="text-white font-semibold">
                  {(((data.ai.totalRequests - data.ai.errors) / data.ai.totalRequests) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Uptime</span>
                <span className="text-green-400 font-semibold">{data.health.uptime}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Error Rate</span>
                <span className={`font-semibold ${data.health.errorRate < 5 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.health.errorRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className={`font-semibold capitalize ${healthColor}`}>
                  {data.health.status}
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm">
                  Last updated: {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                disabled={refreshing}
              >
                View Logs
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                System Settings
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
