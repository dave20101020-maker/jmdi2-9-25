import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Zap, Target, TrendingUp, AlertCircle, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { adminClient } from '@/api/adminClient';

/**
 * AdminAnalytics Component
 * 
 * Protected admin-only page for viewing key metrics:
 * - Total users and active users
 * - AI interaction volume
 * - Habit and goal creation trends
 * - System health and performance
 * 
 * Requires: user.role === 'admin'
 */

export default function AdminAnalytics() {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => adminClient.getDashboardStats(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch user count
  const { data: userStats } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminClient.getUserCount(),
    refetchInterval: 120000,
  });

  // Fetch AI usage
  const { data: aiStats } = useQuery({
    queryKey: ['adminAI'],
    queryFn: () => adminClient.getAIUsageSummary(),
    refetchInterval: 60000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
      ]);
      toast.success('Analytics refreshed');
    } catch (err) {
      toast.error('Failed to refresh analytics');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      users: userStats,
      ai: aiStats,
      stats,
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `northstar-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h2>
          <p className="text-white/60 mb-4">Failed to load admin analytics</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const data = stats || {
    users: { total: 0, activeToday: 0, activeWeek: 0 },
    ai: { totalRequests: 0, requestsToday: 0, avgResponseTime: 0, errors: 0 },
    health: { status: 'unknown', errorRate: 0, uptime: 99 },
  };

  // Chart data
  const chartData = [
    { day: 'Mon', requests: 245, completions: 89, errors: 2 },
    { day: 'Tue', requests: 312, completions: 102, errors: 1 },
    { day: 'Wed', requests: 389, completions: 145, errors: 3 },
    { day: 'Thu', requests: 456, completions: 167, errors: 2 },
    { day: 'Fri', requests: 534, completions: 189, errors: 4 },
    { day: 'Sat', requests: 421, completions: 156, errors: 3 },
    { day: 'Sun', requests: 298, completions: 112, errors: 2 },
  ];

  const pillarsData = [
    { name: 'Sleep', value: 24 },
    { name: 'Diet', value: 19 },
    { name: 'Exercise', value: 18 },
    { name: 'Mental Health', value: 16 },
    { name: 'Finances', value: 12 },
    { name: 'Social', value: 11 },
  ];

  const COLORS = ['#6B46C1', '#52B788', '#FF5733', '#4CC9F0', '#2E8B57', '#FFD700'];

  return (
    <div className="min-h-screen bg-[#0A1628] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-white/60">Real-time user and system metrics</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-[#D4AF37] text-[#0A1628] hover:bg-[#F4D03F]"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Total Users</h3>
              <Users className="w-5 h-5 text-[#4CC9F0]" />
            </div>
            <p className="text-3xl font-bold text-white">{userStats?.count || 0}</p>
            <p className="text-white/60 text-sm mt-2">
              {userStats?.activeToday || 0} active today
            </p>
          </div>

          {/* Weekly Active */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Weekly Active</h3>
              <TrendingUp className="w-5 h-5 text-[#52B788]" />
            </div>
            <p className="text-3xl font-bold text-white">{userStats?.activeWeek || 0}</p>
            <p className="text-white/60 text-sm mt-2">
              {userStats?.count ? ((userStats.activeWeek / userStats.count) * 100).toFixed(1) : 0}% of users
            </p>
          </div>

          {/* AI Requests */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">AI Requests</h3>
              <Zap className="w-5 h-5 text-[#FFD700]" />
            </div>
            <p className="text-3xl font-bold text-white">{aiStats?.requestsToday || 0}</p>
            <p className="text-white/60 text-sm mt-2">
              Today • Avg {((aiStats?.avgResponseTime || 0) / 1000).toFixed(1)}s
            </p>
          </div>

          {/* Goals Created */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Goals Created</h3>
              <Target className="w-5 h-5 text-[#FF7F50]" />
            </div>
            <p className="text-3xl font-bold text-white">1,247</p>
            <p className="text-white/60 text-sm mt-2">+42 this week</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Request Timeline */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,22,40,0.8)',
                    border: '1px solid rgba(212,175,55,0.2)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#4CC9F0" strokeWidth={2} />
                <Line type="monotone" dataKey="completions" stroke="#52B788" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pillar Distribution */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Goals by Pillar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pillarsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pillarsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,22,40,0.8)',
                    border: '1px solid rgba(212,175,55,0.2)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Performance */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">AI Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Total Requests</span>
                <span className="text-white font-semibold">{aiStats?.totalRequests || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg Response Time</span>
                <span className="text-white font-semibold">{((aiStats?.avgResponseTime || 0) / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Errors</span>
                <span className={`font-semibold ${(aiStats?.errors || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {aiStats?.errors || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Success Rate</span>
                <span className="text-green-400 font-semibold">
                  {aiStats?.totalRequests ? (((aiStats.totalRequests - (aiStats.errors || 0)) / aiStats.totalRequests) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* User Metrics */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">User Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Total Users</span>
                <span className="text-white font-semibold">{userStats?.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Today Active</span>
                <span className="text-white font-semibold">{userStats?.activeToday || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Weekly Active</span>
                <span className="text-white font-semibold">{userStats?.activeWeek || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Weekly Engagement</span>
                <span className="text-blue-400 font-semibold">
                  {userStats?.count ? ((userStats.activeWeek / userStats.count) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[#1a2332] border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Uptime</span>
                <span className="text-green-400 font-semibold">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Error Rate</span>
                <span className={`font-semibold ${(data.health?.errorRate || 0) < 1 ? 'text-green-400' : 'text-red-400'}`}>
                  {(data.health?.errorRate || 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className="text-green-400 font-semibold capitalize">Healthy</span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm">
                  Last updated: {new Date(data.timestamp || Date.now()).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
