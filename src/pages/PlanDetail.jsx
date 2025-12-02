
import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl, PILLARS, handleHabitCompletion } from '@/components/shared/Utils';
import { ArrowLeft, CheckCircle2, Circle, Calendar, Target, TrendingUp, Flame, Trash2, Sparkles, Plus, Award, Star, Lightbulb, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import GoalCreator from "@/components/shared/GoalCreator";
import GoalCard from "@/components/shared/GoalCard";
import { toast } from "sonner";

function isHabitCompletedToday(habit) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return habit.completionDates?.includes(today) || false;
}

function WeeklyReviewCard({ review, pillar }) {
  const [expanded, setExpanded] = useState(false);
  
  const getRatingEmoji = (rating) => {
    if (rating === 1) return '😟';
    if (rating === 2) return '😕';
    if (rating === 3) return '😐';
    if (rating === 4) return '🙂';
    return '😄';
  };
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-white font-medium">
              {format(new Date(review.weekStartDate), 'MMM d')} - {format(new Date(review.weekEndDate), 'MMM d')}
            </span>
            {review.overallRating && (
              <div className="flex items-center gap-1">
                <span className="text-xl">{getRatingEmoji(review.overallRating)}</span>
                <span className="text-white/60 text-sm">{review.overallRating}/5</span>
              </div>
            )}
          </div>
          {!expanded && review.whatWorked && (
            <p className="text-white/60 text-sm line-clamp-2">{review.whatWorked}</p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-white/40 flex-shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0 ml-2" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
          {review.whatWorked && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">What Worked</span>
              </div>
              <p className="text-white/80 text-sm ml-6">{review.whatWorked}</p>
            </div>
          )}
          
          {review.whatDidntWork && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Challenges</span>
              </div>
              <p className="text-white/80 text-sm ml-6">{review.whatDidntWork}</p>
            </div>
          )}
          
          {review.lessonsLearned && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Lessons Learned</span>
              </div>
              <p className="text-white/80 text-sm ml-6">{review.lessonsLearned}</p>
            </div>
          )}
          
          {review.nextWeekFocus && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Next Week Focus</span>
              </div>
              <p className="text-white/80 text-sm ml-6">{review.nextWeekFocus}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlanDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['lifePlan', planId],
    queryFn: async () => {
      const plans = await api.getPlans({ id: planId });
      return plans[0];
    },
    enabled: !!planId && !!user
  });
  
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habitsForPlan', planId],
    queryFn: () => api.getHabits({ linkedPlanId: planId, userId: user?.email }, '-created_date', 100),
    enabled: !!planId && !!user,
    initialData: []
  });
  
  const { data: weeklyReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['weeklyReviewsForPlan', planId],
    queryFn: () => api.getWeeklyReviews({ planId: planId, created_by: user?.email }, '-weekEndDate', 20),
    enabled: !!planId && !!user,
    initialData: []
  });

  const { data: linkedGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['linkedSmartGoals', planId, plan?.smartGoalIds],
    queryFn: async () => {
      if (!plan?.smartGoalIds || plan.smartGoalIds.length === 0) return [];
      
      const goalPromises = plan.smartGoalIds.map(goalId =>
        api.getGoals({ id: goalId }).then(results => results[0])
      );
      
      const goals = await Promise.all(goalPromises);
      return goals.filter(Boolean);
    },
    enabled: !!plan && !!plan.smartGoalIds,
    initialData: []
  });
  
  const toggleActiveMutation = useMutation({
    mutationFn: () => api.updatePlan(plan.id, { isActive: !plan.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lifePlan', planId]);
      queryClient.invalidateQueries(['lifePlans']);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['linkedSmartGoals']);
      queryClient.invalidateQueries(['lifePlan', planId]);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (linkedGoals.length > 0) {
        const unlinkPromises = linkedGoals.map(g => 
          api.updateGoal(g.id, { linkedPlanId: null })
        );
        await Promise.all(unlinkPromises);
      }
      
      const deleteHabitPromises = habits.map(h => api.deleteHabit(h.id));
      await Promise.all(deleteHabitPromises);
      
      const deleteReviewPromises = weeklyReviews.map(r => api.deleteWeeklyReview(r.id));
      await Promise.all(deleteReviewPromises);
      
      await api.deletePlan(plan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lifePlans']);
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries(['weeklyReviews']);
      queryClient.invalidateQueries(['smartGoals']);
      navigate(createPageUrl("MyPlans"));
    }
  });

  const handleUpdateGoalStatus = (goalId, newStatus) => {
    updateGoalMutation.mutate({ id: goalId, data: { status: newStatus } });
  };
  
  const handleUpdateGoalProgress = (goalId, newProgress) => {
    const goal = linkedGoals.find(g => g.id === goalId);
    updateGoalMutation.mutate({
      id: goalId,
      data: { 
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : goal.status
      }
    });
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this plan? This will also delete all associated habits and weekly reviews. Linked goals will remain but will be unlinked from this plan.')) {
      deleteMutation.mutate();
    }
  };
  
  const handleToggleHabit = async (habit) => {
    const isCompleting = !isHabitCompletedToday(habit);
    
    try {
      const updatedData = handleHabitCompletion(habit, isCompleting);
      
      await api.updateHabit(habit.id, updatedData);
      
      queryClient.invalidateQueries(['habitsForPlan', planId]);
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries(['linkedSmartGoals']);
      queryClient.invalidateQueries(['lifePlan', planId]);
      
      if (isCompleting) {
        toast.success(`✓ Habit completed! ${updatedData.streakCount} day streak`);
      } else {
        toast.info(`Habit uncompleted`);
      }
      
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast.error('Failed to update habit');
    }
  };
  
  if (planLoading || habitsLoading || reviewsLoading || goalsLoading || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 animate-pulse" />
          <p className="text-white/60">Loading plan...</p>
        </div>
      </div>
    );
  }
  
  const pillar = PILLARS[plan.pillar];
  const daysSinceStart = plan.startDate 
    ? Math.floor((new Date() - new Date(plan.startDate)) / (1000 * 60 * 60 * 24))
    : 0;
  
  const habitStreaks = habits.map(h => h.streakCount || 0);
  const planStreak = habitStreaks.length > 0 ? Math.min(...habitStreaks) : 0;
  
  const todayCompleted = habits.filter(h => isHabitCompletedToday(h)).length;
  const totalHabits = habits.length;
  
  const habitContribution = totalHabits > 0 
    ? `${todayCompleted}/${totalHabits} habits completed → +${todayCompleted * 5}/${totalHabits * 5} pts`
    : 'No habits yet';
  
  const ratingsWithValues = weeklyReviews.filter(r => r.overallRating);
  const avgRating = ratingsWithValues.length > 0
    ? (ratingsWithValues.reduce((sum, r) => sum + r.overallRating, 0) / ratingsWithValues.length).toFixed(1)
    : null;
  
  const avgGoalProgress = linkedGoals.length > 0
    ? Math.round(linkedGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / linkedGoals.length)
    : 0;
  
  return (
    <div className="min-h-screen pb-24 px-6 pt-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("MyPlans"))}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `${pillar.color}20`,
                  boxShadow: `0 0 20px ${pillar.color}40`
                }}
              >
                {pillar.icon}
              </div>
              <div>
                <span 
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${pillar.color}30`,
                    color: pillar.color
                  }}
                >
                  {pillar.name}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${pillar.color}40` }}
        >
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex-1">{plan.planTitle}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActiveMutation.mutate()}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  plan.isActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : 'bg-white/10 text-white/60 border border-white/20'
                }`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
          
          <p className="text-white/80 mb-4 leading-relaxed">{plan.planDescription}</p>
          
          {linkedGoals.length > 0 && (
            <div className="mb-4 flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke={pillar.color}
                    strokeWidth="8"
                    strokeDasharray={`${avgGoalProgress * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{avgGoalProgress}%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1">Plan Progress</div>
                <div className="text-xs text-white/60 mb-1">
                  {avgGoalProgress}% from {linkedGoals.length} linked goal{linkedGoals.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-white/60">
                  {habitContribution}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            {plan.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Started {new Date(plan.startDate).toLocaleDateString()}
                {daysSinceStart > 0 && <span className="ml-1">({daysSinceStart} days ago)</span>}
              </div>
            )}
            {planStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-400 font-bold">
                <Flame className="w-4 h-4" />
                {planStreak} day streak
              </div>
            )}
            {avgRating && (
              <div className="flex items-center gap-1 text-[#D4AF37] font-bold">
                <Star className="w-4 h-4" />
                {avgRating} avg rating
              </div>
            )}
          </div>
          
          {planStreak > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {planStreak >= 3 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-xs font-bold">
                  <Award className="w-3 h-3" />
                  3-Day Strong!
                </div>
              )}
              {planStreak >= 7 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-400 text-xs font-bold">
                  <Award className="w-3 h-3" />
                  Week Warrior!
                </div>
              )}
              {planStreak >= 21 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400 text-xs font-bold">
                  <Award className="w-3 h-3" />
                  21-Day Master!
                </div>
              )}
            </div>
          )}
        </div>

        {linkedGoals.length > 0 && (
          <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                Linked Goals ({linkedGoals.length})
              </h3>
              <Button
                onClick={() => setShowGoalCreator(true)}
                size="sm"
                className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
            
            <div className="space-y-3">
              {linkedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => navigate(createPageUrl("MyGrowth"))}
                  onUpdateStatus={handleUpdateGoalStatus}
                  onUpdateProgress={handleUpdateGoalProgress}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}
        
        {linkedGoals.length === 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-1">No Linked Goals Yet</h4>
                <p className="text-white/70 text-sm mb-3">
                  Create SMART goals linked to this plan for more focused tracking
                </p>
                <Button
                  onClick={() => setShowGoalCreator(true)}
                  size="sm"
                  className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal for This Plan
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {weeklyReviews.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Weekly Progress History</h2>
              </div>
              <div className="text-sm text-white/60">
                {weeklyReviews.length} {weeklyReviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            
            <div className="space-y-3">
              {weeklyReviews.map(review => (
                <WeeklyReviewCard key={review.id} review={review} pillar={pillar} />
              ))}
            </div>
          </div>
        )}
        
        {habits.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold text-white">Daily Habits</h2>
              </div>
              <div className="text-sm text-white/60">
                Today: {todayCompleted}/{totalHabits}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {habits.map(habit => {
                const completed = isHabitCompletedToday(habit);
                const streak = habit.streakCount || 0;
                
                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit)}
                    disabled={!habit.isActive}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                      completed
                        ? 'bg-green-500/10 border-green-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } ${!habit.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                    )}
                    
                    <div className="flex-1">
                      <span className={`block ${completed ? 'text-white/80 line-through' : 'text-white font-bold'}`}>
                        {habit.habitText}
                      </span>
                      
                      {streak > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-orange-400">
                            <Flame className="w-3 h-3" />
                            <span className="font-bold">{streak} days</span>
                          </div>
                          
                          {streak >= 21 && (
                            <span className="text-xs text-purple-400 font-bold">21-Day Master!</span>
                          )}
                          {streak >= 7 && streak < 21 && (
                            <span className="text-xs text-blue-400 font-bold">Week Warrior!</span>
                          )}
                          {streak >= 3 && streak < 7 && (
                            <span className="text-xs text-green-400 font-bold">3-Day Strong!</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <p className="text-xs text-white/40">
              Tap to mark habits complete today • Each completion adds +5 points to this plan
            </p>
          </div>
        )}
        
        {plan.goals && plan.goals.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white">Legacy Goals (Text)</h2>
            </div>
            <ul className="space-y-3">
              {plan.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <span className="text-[#D4AF37] text-lg mt-0.5">•</span>
                  <span className="flex-1">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {plan.weeklyActions && plan.weeklyActions.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Weekly Actions</h2>
            </div>
            <ul className="space-y-3">
              {plan.weeklyActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-blue-400 text-lg mt-0.5">→</span>
                  <span className="flex-1 text-white/80">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {plan.successMetrics && plan.successMetrics.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Success Metrics</h2>
            </div>
            <ul className="space-y-3">
              {plan.successMetrics.map((metric, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <span className="text-purple-400 text-lg mt-0.5">📊</span>
                  <span className="flex-1">{metric}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={handleDelete}
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20 font-bold"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Plan
          </Button>
        </div>
      </div>
      
      {showGoalCreator && (
        <GoalCreator
          onClose={() => setShowGoalCreator(false)}
          onSuccess={() => {
            setShowGoalCreator(false);
            queryClient.invalidateQueries(['linkedSmartGoals']);
            queryClient.invalidateQueries(['lifePlan', planId]);
          }}
          user={user}
          linkedPlanId={planId}
        />
      )}
    </div>
  );
}
