import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * DashboardDisplay Component
 * Displays: habits, scores, AI insights, trends
 * 
 * Props:
 * - habits: Array of active habits with completion data
 * - pillarScores: Array of pillar scores (1-10)
 * - trendData: Historical score data for charts
 * - aiInsights: Array of recent AI insights
 * - loading: Boolean indicating loading state
 */

export default function DashboardDisplay({ 
  habits = [], 
  pillarScores = [], 
  trendData = [], 
  aiInsights = [],
  loading = false 
}) {
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  // Pillar configuration
  const pillarConfig = {
    sleep: { color: '#A855F7', icon: '🌙', label: 'Sleep' },
    diet: { color: '#EAB308', icon: '🥗', label: 'Nutrition' },
    exercise: { color: '#EF4444', icon: '🏃', label: 'Fitness' },
    physical_health: { color: '#EC4899', icon: '❤️', label: 'Physical' },
    mental_health: { color: '#06B6D4', icon: '🧘', label: 'Mental' },
    finances: { color: '#10B981', icon: '💰', label: 'Finances' },
    social: { color: '#3B82F6', icon: '🤝', label: 'Social' },
    spirituality: { color: '#8B5CF6', icon: '✨', label: 'Spirit' },
  };

  // Get trend icon and color
  const getTrendDisplay = (trend) => {
    switch (trend) {
      case 'improving':
        return { icon: <TrendingUp className="w-4 h-4 text-green-500" />, color: 'text-green-500', label: 'Improving' };
      case 'declining':
        return { icon: <TrendingDown className="w-4 h-4 text-red-500" />, color: 'text-red-500', label: 'Declining' };
      default:
        return { icon: <Minus className="w-4 h-4 text-gray-500" />, color: 'text-gray-500', label: 'Stable' };
    }
  };

  // Calculate habit completion rate
  const getHabitCompletionRate = (habit) => {
    if (!habit.totalCompletions || habit.totalCompletions === 0) return 0;
    const daysActive = Math.ceil((new Date() - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24));
    const rate = Math.round((habit.totalCompletions / daysActive) * 100);
    return Math.min(100, Math.max(0, rate));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Your Wellness Dashboard</h1>
          <p className="text-slate-600">Track your progress across all life pillars</p>
        </div>

        {/* Pillar Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {pillarScores.map((ps) => {
            const config = pillarConfig[ps.pillar];
            const trend = getTrendDisplay(ps.trend);
            const scorePercentage = (ps.score / 10) * 100;

            return (
              <div
                key={ps.pillar}
                onClick={() => setSelectedPillar(ps.pillar)}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPillar === ps.pillar
                    ? 'border-purple-500 bg-white shadow-lg'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-2xl mb-1">{config.icon}</p>
                    <p className="font-semibold text-slate-900">{config.label}</p>
                  </div>
                  {trend.icon}
                </div>

                {/* Score Circle */}
                <div className="flex items-center mb-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={config.color}
                        strokeWidth="4"
                        strokeDasharray={`${scorePercentage * 1.76} 176`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">{ps.score.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs text-slate-600">Current Score</p>
                    <p className={`text-sm font-semibold ${trend.color}`}>{trend.label}</p>
                  </div>
                </div>

                {/* Weekly Sparkline */}
                {ps.weeklyScores && ps.weeklyScores.length > 0 && (
                  <div className="text-xs text-slate-500">
                    Last 4 weeks: {ps.weeklyScores.slice(-4).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Score Trends</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded text-sm ${
                    chartType === 'line'
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded text-sm ${
                    chartType === 'bar'
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'line' ? (
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 10]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    {Object.entries(pillarConfig).map(([key, config]) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={config.color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 10]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    {Object.entries(pillarConfig).map(([key, config]) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={config.color}
                        isAnimationActive={true}
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-slate-500">
                Not enough data to display trends
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Stats</h2>

            <div className="space-y-4">
              {/* Average Score */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Overall Average</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(pillarScores.reduce((sum, ps) => sum + ps.score, 0) / pillarScores.length).toFixed(1)}
                </p>
              </div>

              {/* Active Habits */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Active Habits</p>
                <p className="text-2xl font-bold text-green-900">{habits.filter(h => h.isActive).length}</p>
              </div>

              {/* Current Streaks */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Best Streak</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.max(...habits.map(h => h.bestStreak), 0)} days
                </p>
              </div>

              {/* Improving Pillars */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Improving</p>
                <p className="text-2xl font-bold text-blue-900">
                  {pillarScores.filter(ps => ps.trend === 'improving').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Habits Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Active Habits</h2>

          {habits && habits.filter(h => h.isActive).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits
                .filter(h => h.isActive)
                .map((habit) => {
                  const config = pillarConfig[habit.pillar];
                  const completionRate = getHabitCompletionRate(habit);

                  return (
                    <div
                      key={habit._id}
                      className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <p className="font-semibold text-slate-900">{habit.name}</p>
                            <p className="text-xs text-slate-500">{config.label}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">Completion</span>
                          <span className="text-xs font-semibold text-slate-700">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all`}
                            style={{
                              width: `${completionRate}%`,
                              backgroundColor: config.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Current Streak</p>
                          <p className="font-bold text-slate-900">{habit.streakCount} days</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total</p>
                          <p className="font-bold text-slate-900">{habit.totalCompletions}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No active habits yet</p>
              <button className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                Create a Habit
              </button>
            </div>
          )}
        </div>

        {/* AI Insights Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Recent AI Insights</h2>

          {aiInsights && aiInsights.length > 0 ? (
            <div className="space-y-4">
              {aiInsights.map((insight) => {
                const config = pillarConfig[insight.pillar];
                
                return (
                  <div
                    key={insight._id}
                    className="p-4 border-l-4 rounded-lg bg-slate-50"
                    style={{ borderLeftColor: config.color }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: config.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">{config.label}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700">{insight.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No insights yet. Keep logging your data!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
