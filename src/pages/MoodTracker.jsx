
import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/index.js";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Brain, Calendar, Zap, Heart, AlertCircle, Sparkles, Smile } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MoodLogger from "@/components/shared/MoodLogger";
import AIThinkingOverlay from "@/ai/AIThinkingOverlay";
import { toast } from "sonner";

export default function MoodTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showLogger, setShowLogger] = useState(false);
  const [dateRange, setDateRange] = useState(30);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  const { data: moodEntries = [], isLoading } = useQuery({
    queryKey: ['moodEntries', user?.email],
    queryFn: () => api.getMoods({ userId: user?.email }, '-timestamp', 200),
    enabled: !!user,
    initialData: []
  });
  
  const { data: mentalHealthEntries = [] } = useQuery({
    queryKey: ['mentalHealthEntries', user?.email],
    queryFn: () => api.getEntries({ 
      created_by: user?.email,
      pillar: 'mental_health'
    }, '-date', 100),
    enabled: !!user,
    initialData: []
  });
  
  const { data: exerciseEntries = [] } = useQuery({
    queryKey: ['exerciseEntries', user?.email],
    queryFn: () => api.getEntries({
      created_by: user?.email,
      pillar: 'exercise'
    }, '-date', 100),
    enabled: !!user,
    initialData: []
  });
  
  const { data: meditationLogs = [] } = useQuery({
    queryKey: ['meditationLogs', user?.email],
    queryFn: () => api.getMeditationLogs({ userId: user?.email }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });
  
  const saveMoodMutation = useMutation({
    mutationFn: (moodData) => api.createMood({
      userId: user.email,
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: new Date().toISOString(),
      ...moodData
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodEntries', user?.email] });
      setShowLogger(false);
      toast.success('Mood logged successfully! 💙');
    }
  });
  
  const handleSaveMood = async (moodData) => {
    await saveMoodMutation.mutateAsync(moodData);
  };
  
  // Calculate chart data
  const chartData = [];
  for (let i = dateRange - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const dateLabel = format(subDays(new Date(), i), dateRange > 90 ? 'MMM d' : 'MMM d');
    const dayMoods = moodEntries.filter(e => e.date === date);
    
    const avgMood = dayMoods.length > 0
      ? Math.round(dayMoods.reduce((sum, e) => sum + e.moodScore, 0) / dayMoods.length)
      : null;
    
    chartData.push({
      date: dateLabel,
      mood: avgMood
    });
  }
  
  // Stats
  const recentMoods = moodEntries.slice(0, 7);
  const avgMood = recentMoods.length > 0
    ? Math.round(recentMoods.reduce((sum, e) => sum + e.moodScore, 0) / recentMoods.length)
    : 0;
  
  const weekAgoMoods = moodEntries.filter(e => {
    const entryDate = new Date(e.date);
    const weekAgo = subDays(new Date(), 14);
    const twoWeeksAgo = subDays(new Date(), 7);
    return entryDate >= twoWeeksAgo && entryDate < weekAgo;
  });
  
  const weekAgoAvg = weekAgoMoods.length > 0
    ? Math.round(weekAgoMoods.reduce((sum, e) => sum + e.moodScore, 0) / weekAgoMoods.length)
    : 0;
  
  const moodChange = avgMood - weekAgoAvg;
  
  // Most common emotions
  const emotionCounts = {};
  recentMoods.forEach(mood => {
    (mood.emotions || []).forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
  });
  
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion);
  
  // AI Insights
  const generateAIInsights = async () => {
    setLoadingInsights(true);
    
    try {
      const prompt = `Analyze this mood tracking data and provide insights:

Mood Data (last 30 days):
- Average mood: ${avgMood}/100
- Mood trend: ${moodChange >= 0 ? `+${moodChange}` : moodChange} points
- Total entries: ${recentMoods.length}
- Top emotions: ${topEmotions.join(', ') || 'none'}

Common triggers:
${recentMoods.flatMap(m => m.triggers || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).join(', ')}

Mental Health Context:
- Recent mental health scores: ${mentalHealthEntries.slice(0, 7).map(e => e.score).join(', ')}
- Recent stress levels: ${mentalHealthEntries.slice(0, 7).map(e => e.stress_level || 'N/A').join(', ')}

Exercise Context:
- Days with exercise: ${exerciseEntries.filter(e => {
  const exerciseDate = new Date(e.date);
  const weekAgo = subDays(new Date(), 7);
  return exerciseDate >= weekAgo;
}).length}/7

Meditation:
- Sessions completed: ${meditationLogs.slice(0, 7).length} in last week

Identify patterns and provide:
1. Key insights about mood patterns (2-3 sentences)
2. Potential triggers for low moods (1-2 specific observations)
3. Recommendations (2-3 actionable suggestions)

Return ONLY valid JSON:
{
  "insights": "Your detailed insights here",
  "triggers": "Potential triggers observation",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      const result = await api.aiCoach({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: { type: "string" },
            triggers: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      setAiInsights(result);
      setLoadingInsights(false);
      toast.success('Mood insights ready! 💙', {
        description: 'AI analysis of your emotional patterns complete'
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      setLoadingInsights(false);
      toast.error('Failed to generate insights', {
        description: 'Our AI is temporarily unavailable. Try again later.'
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4CC9F0]/20 animate-pulse" />
          <p className="text-white/60">Loading mood data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <AIThinkingOverlay 
        isVisible={loadingInsights}
        message="NorthStar is analyzing your mood patterns..."
      />
      
      <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Brain className="w-6 h-6 md:w-7 md:h-7 text-[#4CC9F0]" />
                Mood Tracker
              </h1>
              <p className="text-white/60 text-sm">Track and understand your emotional patterns</p>
            </div>
            <Button
              onClick={() => setShowLogger(true)}
              className="bg-gradient-to-r from-[#4CC9F0] to-[#7C3AED] text-white font-bold w-full sm:w-auto"
              style={{ boxShadow: '0 0 20px rgba(76, 201, 240, 0.4)' }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Log Mood
            </Button>
          </div>
          
          {moodEntries.length === 0 ? (
            /* Enhanced Empty State */
            <div className="text-center py-12 md:py-16">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 max-w-lg mx-auto">
                {/* Mood Faces Visual */}
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 flex items-center justify-center" aria-hidden="true">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4CC9F0]/20 to-[#7C3AED]/20 animate-pulse" />
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#4CC9F0]/30 to-[#7C3AED]/30 flex items-center justify-center border-4 border-[#4CC9F0]/40">
                      <span className="text-6xl md:text-7xl">😊</span>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Start Tracking Your Mood</h2>
                <p className="text-white/70 mb-6 text-sm md:text-base px-4">
                  Understanding your emotions is the first step to better mental health. Log your first mood check-in to discover patterns and insights.
                </p>
                
                <Button
                  onClick={() => setShowLogger(true)}
                  className="bg-gradient-to-r from-[#4CC9F0] to-[#7C3AED] text-white font-bold mb-6"
                  style={{ boxShadow: '0 0 20px rgba(76, 201, 240, 0.5)' }}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Log Your First Mood
                </Button>
                
                {/* Benefits */}
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-4 md:p-6 text-left">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    What You'll Discover
                  </h3>
                  <ul className="space-y-2 text-xs md:text-sm text-white/80">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                      <span><strong>Patterns:</strong> Identify what affects your mood over time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                      <span><strong>Triggers:</strong> Recognize situations that impact your emotions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                      <span><strong>Correlations:</strong> See how exercise, sleep, and habits affect your mood</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                      <span><strong>AI Insights:</strong> Get personalized recommendations for emotional wellbeing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-[#4CC9F0]" />
                    <div className="text-white/70 text-xs md:text-sm font-medium">Avg Mood</div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-[#4CC9F0]">{avgMood}</div>
                  <div className="text-xs text-white/60">Last 7 days</div>
                </div>
                
                <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {moodChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <div className="text-white/70 text-xs md:text-sm font-medium">Trend</div>
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${moodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {moodChange >= 0 ? '+' : ''}{moodChange}
                  </div>
                  <div className="text-xs text-white/60">vs prev week</div>
                </div>
                
                <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <div className="text-white/70 text-xs md:text-sm font-medium">Entries</div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">{moodEntries.length}</div>
                  <div className="text-xs text-white/60">Total</div>
                </div>
                
                <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <div className="text-white/70 text-xs md:text-sm font-medium">This Week</div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-[#7C3AED]">{recentMoods.length}</div>
                  <div className="text-xs text-white/60">checks</div>
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days)}
                    className={`px-3 md:px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                      dateRange === days
                        ? 'bg-[#4CC9F0] text-white'
                        : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
              
              {/* Mood Chart */}
              <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-6 mb-6">
                <h2 className="text-lg md:text-xl font-bold text-white mb-4">Mood Over Time</h2>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[400px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(26, 24, 56, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          stroke="#4CC9F0"
                          strokeWidth={3}
                          dot={{ fill: '#4CC9F0', r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* AI Insights */}
              <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-[#F4D03F]" />
                    AI Insights
                  </h2>
                  <Button
                    onClick={generateAIInsights}
                    disabled={loadingInsights || moodEntries.length < 3}
                    size="sm"
                    className="bg-[#F4D03F]/20 hover:bg-[#F4D03F]/30 text-[#F4D03F] font-bold w-full sm:w-auto"
                  >
                    {loadingInsights ? 'Analyzing...' : 'Generate Insights'}
                  </Button>
                </div>
                
                {aiInsights ? (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-[#4CC9F0]" />
                        Key Insights
                      </h4>
                      <p className="text-white/80 text-sm">{aiInsights.insights}</p>
                    </div>
                    
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        Potential Triggers
                      </h4>
                      <p className="text-white/80 text-sm">{aiInsights.triggers}</p>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {aiInsights.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-white/80 text-sm flex items-start gap-2">
                            <span className="text-green-400 flex-shrink-0">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8">
                    <p className="text-white/60 text-sm">
                      {moodEntries.length < 3
                        ? 'Log at least 3 mood entries to get AI insights'
                        : 'Click "Generate Insights" to analyze your mood patterns'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Recent Entries */}
              <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-white mb-4">Recent Entries</h2>
                <div className="space-y-3">
                  {moodEntries.slice(0, 10).map(entry => (
                    <div key={entry.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm md:text-base">
                            {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                          </div>
                          {entry.emotions && entry.emotions.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {entry.emotions.map(emotion => (
                                <span key={emotion} className="px-2 py-1 bg-[#4CC9F0]/20 text-[#4CC9F0] text-xs rounded-full font-bold">
                                  {emotion}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl md:text-3xl font-bold text-[#4CC9F0]">{entry.moodScore}</div>
                          <div className="text-xs text-white/60">mood</div>
                        </div>
                      </div>
                      
                      {entry.triggers && entry.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entry.triggers.map(trigger => (
                            <span key={trigger} className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {entry.notes && (
                        <p className="text-white/70 text-sm mt-2 italic break-words">"{entry.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {showLogger && (
        <MoodLogger
          onClose={() => setShowLogger(false)}
          onSave={handleSaveMood}
          initialMood={avgMood || 50}
        />
      )}
    </>
  );
}
