import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl, PILLARS, COLORS } from '@/utils';
import { Target, Plus, TrendingUp, CheckCircle2, Sparkles, ChevronRight, Calendar, Trophy, Zap, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoalCreator from "@/components/shared/GoalCreator";
import GoalCard from "@/components/shared/GoalCard";
import HabitCard from "@/components/shared/HabitCard";
import { format } from "date-fns";
import { toast } from 'sonner';


export default function MyGrowth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [view, setView] = useState("overview");
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['smartGoals', user?.email],
    queryFn: () => api.getGoals({ created_by: user?.email }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });
  
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['lifePlans', user?.email],
    queryFn: () => api.getPlans({ created_by: user?.email }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });
  
  const { data: habits = [] } = useQuery({
    queryKey: ['habits', user?.email],
    queryFn: () => api.getHabits({ userId: user?.email }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });
  
  // Optimistic update for goal status
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateGoal(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['smartGoals', user?.email] });
      
      // Snapshot previous value
      const previousGoals = queryClient.getQueryData(['smartGoals', user?.email]);
      
      // Optimistically update
      queryClient.setQueryData(['smartGoals', user?.email], (old) =>
        old?.map((goal) => goal.id === id ? { ...goal, ...data } : goal)
      );
      
      return { previousGoals };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['smartGoals', user?.email], context.previousGoals);
      toast.error('Failed to update goal', {
        description: 'Your changes were not saved. Please try again.'
      });
    },
    onSuccess: (data, variables) => {
      toast.success('Goal updated successfully! 🎯');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['smartGoals', user?.email] });
      
      // If goal is linked to a plan, invalidate plan queries
      if (variables.data.linkedPlanId || data.linkedPlanId) {
        queryClient.invalidateQueries({ queryKey: ['lifePlans', user?.email] });
        queryClient.invalidateQueries({ 
          queryKey: ['lifePlan', variables.data.linkedPlanId || data.linkedPlanId] 
        });
      }
    }
  });

  // Optimistic delete for goals
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId) => {
      const goal = goals.find(g => g.id === goalId);
      
      // Unlink habits first
      if (goal?.linkedHabitsCount > 0) {
        const linkedHabits = await api.getHabits({ linkedGoalId: goalId });
        await Promise.all(
          linkedHabits.map(habit => 
            api.updateHabit(habit.id, { linkedGoalId: null })
          )
        );
      }
      
      // Update plan if linked
      if (goal?.linkedPlanId) {
        const plan = await api.getPlans({ id: goal.linkedPlanId });
        if (plan.length > 0) {
          const currentGoals = plan[0].smartGoalIds || [];
          await api.updatePlan(goal.linkedPlanId, {
            smartGoalIds: currentGoals.filter(id => id !== goalId),
            linkedGoalsCount: Math.max(0, (plan[0].linkedGoalsCount || 0) - 1)
          });
        }
      }
      
      // Delete the goal
      await api.deleteGoal(goalId);
      return { goalId, linkedPlanId: goal?.linkedPlanId };
    },
    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: ['smartGoals', user?.email] });
      
      const previousGoals = queryClient.getQueryData(['smartGoals', user?.email]);
      const previousHabits = queryClient.getQueryData(['habits', user?.email]);
      
      // Optimistically remove goal
      queryClient.setQueryData(['smartGoals', user?.email], (old) =>
        old?.filter((goal) => goal.id !== goalId)
      );
      
      // Optimistically unlink habits
      queryClient.setQueryData(['habits', user?.email], (old) =>
        old?.map((habit) => 
          habit.linkedGoalId === goalId ? { ...habit, linkedGoalId: null } : habit
        )
      );
      
      return { previousGoals, previousHabits };
    },
    onError: (err, goalId, context) => {
      queryClient.setQueryData(['smartGoals', user?.email], context.previousGoals);
      queryClient.setQueryData(['habits', user?.email], context.previousHabits);
      toast.error('Failed to delete goal');
    },
    onSuccess: (data) => {
      toast.success('Goal deleted successfully');
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['smartGoals', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['habits', user?.email] });
      
      if (data.linkedPlanId) {
        queryClient.invalidateQueries({ queryKey: ['lifePlans', user?.email] });
        queryClient.invalidateQueries({ queryKey: ['lifePlan', data.linkedPlanId] });
      }
    }
  });

  // Optimistic habit completion toggle
  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateHabit(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['habits', user?.email] });
      
      const previousHabits = queryClient.getQueryData(['habits', user?.email]);
      
      // Optimistically update habit
      queryClient.setQueryData(['habits', user?.email], (old) =>
        old?.map((habit) => habit.id === id ? { ...habit, ...data } : habit)
      );
      
      return { previousHabits };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['habits', user?.email], context.previousHabits);
      toast.error('Failed to update habit');
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['habits', user?.email] });
      
      // If habit is linked to goal or plan, invalidate those
      if (data.linkedGoalId) {
        queryClient.invalidateQueries({ queryKey: ['smartGoals', user?.email] });
      }
      if (data.linkedPlanId) {
        queryClient.invalidateQueries({ queryKey: ['lifePlans', user?.email] });
        queryClient.invalidateQueries({ queryKey: ['lifePlan', data.linkedPlanId] });
      }
    }
  });
  
  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowGoalCreator(true);
  };
  
  const handleUpdateStatus = (goalId, newStatus) => {
    updateGoalMutation.mutate({
      id: goalId,
      data: { status: newStatus }
    });
  };
  
  const handleUpdateProgress = (goalId, newProgress) => {
    const goal = goals.find(g => g.id === goalId);
    updateGoalMutation.mutate({
      id: goalId,
      data: { 
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : goal.status
      }
    });
  };

  const handleDeleteGoal = (goalId) => {
    deleteGoalMutation.mutate(goalId);
  };

  const handleToggleHabitComplete = (habit) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const completionDates = habit.completionDates || [];
    const isCompletedToday = completionDates.includes(today);
    
    let newCompletionDates;
    let newStreakCount = habit.streakCount || 0;
    let newTotalCompletions = habit.totalCompletions || 0;
    let newBestStreak = habit.bestStreak || 0;
    
    if (isCompletedToday) {
      newCompletionDates = completionDates.filter(d => d !== today);
      newStreakCount = Math.max(0, newStreakCount - 1);
      newTotalCompletions = Math.max(0, newTotalCompletions - 1);
    } else {
      newCompletionDates = [...completionDates, today];
      newTotalCompletions = newTotalCompletions + 1;
      
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      if (completionDates.includes(yesterday)) {
        newStreakCount = newStreakCount + 1;
      } else {
        newStreakCount = 1;
      }
      
      newBestStreak = Math.max(newBestStreak, newStreakCount);
      
      toast.success(`Habit completed! 🎉 ${newStreakCount} day streak!`);
    }
    
    updateHabitMutation.mutate({
      id: habit.id,
      data: {
        completionDates: newCompletionDates,
        lastCompletedDate: isCompletedToday ? habit.lastCompletedDate : today,
        streakCount: newStreakCount,
        totalCompletions: newTotalCompletions,
        bestStreak: newBestStreak
      }
    });
  };
  
  const handleSuccess = () => {
    setShowGoalCreator(false);
    setEditingGoal(null);
    queryClient.invalidateQueries({ queryKey: ['smartGoals', user?.email] });
    queryClient.invalidateQueries({ queryKey: ['lifePlans', user?.email] });
  };
  
  // Stats
  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const activePlans = plans.filter(p => p.isActive);
  const activeHabits = habits.filter(h => h.isActive);
  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;
  
  // Group by pillar
  const groupedData = {};
  Object.keys(PILLARS).forEach(pillarId => {
    const pillarGoals = goals.filter(g => g.pillar === pillarId);
    const pillarPlans = plans.filter(p => p.pillar === pillarId);
    const pillarHabits = habits.filter(h => h.pillar === pillarId && h.isActive);
    
    if (pillarGoals.length > 0 || pillarPlans.length > 0 || pillarHabits.length > 0) {
      groupedData[pillarId] = {
        goals: pillarGoals,
        plans: pillarPlans,
        habits: pillarHabits
      };
    }
  });
  
  if (goalsLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse" style={{ backgroundColor: `${COLORS.PRIMARY}33` }} />
          <p className="text-white/60">Loading your growth journey...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(to bottom right, ${COLORS.PRIMARY}, ${COLORS.PRIMARY_LIGHT})`,
              boxShadow: `0 0 30px ${COLORS.PRIMARY}80` 
            }}
          >
            <Trophy className="w-10 h-10" style={{ color: COLORS.BACKGROUND }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Growth</h1>
          <p className="text-white/70">Goals, plans, and progress tracking</p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#D4AF37]" />
              <div className="text-white/70 text-sm">Goals</div>
            </div>
            <div className="text-3xl font-bold text-white">{goals.length}</div>
            <div className="text-xs text-white/60">{activeGoals.length} active</div>
          </div>
          
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#4CC9F0]" />
              <div className="text-white/70 text-sm">Plans</div>
            </div>
            <div className="text-3xl font-bold text-white">{plans.length}</div>
            <div className="text-xs text-white/60">{activePlans.length} active</div>
          </div>
          
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#F4D03F]" />
              <div className="text-white/70 text-sm">Habits</div>
            </div>
            <div className="text-3xl font-bold text-white">{habits.length}</div>
            <div className="text-xs text-white/60">{activeHabits.length} active</div>
          </div>
          
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <div className="text-white/70 text-sm">Avg Progress</div>
            </div>
            <div className="text-3xl font-bold text-[#D4AF37]">{totalProgress}%</div>
            <div className="text-xs text-white/60">{completedGoals.length} completed</div>
          </div>
        </div>
        
        {/* View Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setView("overview")}
            className={`py-3 px-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              view === "overview"
                ? 'bg-[#D4AF37] text-[#0A1628]'
                : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
            }`}
          >
            <BarChart className="w-5 h-5 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">All</span>
          </button>
          <button
            onClick={() => setView("goals")}
            className={`py-3 px-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              view === "goals"
                ? 'bg-[#D4AF37] text-[#0A1628]'
                : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-5 h-5 inline mr-1 md:mr-2" />
            <span>Goals</span>
            <span className="ml-1 text-xs opacity-70">({goals.length})</span>
          </button>
          <button
            onClick={() => setView("plans")}
            className={`py-3 px-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              view === "plans"
                ? 'bg-[#D4AF37] text-[#0A1628]'
                : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-5 h-5 inline mr-1 md:mr-2" />
            <span>Plans</span>
            <span className="ml-1 text-xs opacity-70">({plans.length})</span>
          </button>
          <button
            onClick={() => setView("habits")}
            className={`py-3 px-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              view === "habits"
                ? 'bg-[#D4AF37] text-[#0A1628]'
                : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-5 h-5 inline mr-1 md:mr-2" />
            <span>Habits</span>
            <span className="ml-1 text-xs opacity-70">({habits.length})</span>
          </button>
        </div>
        
        {/* Overview View */}
        {view === "overview" && (
          <div>
            {Object.keys(groupedData).length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <div className="w-32 h-32 mx-auto mb-6" aria-hidden="true">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" strokeWidth="3" opacity="0.3" />
                      <circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.2" strokeDasharray="5,5" />
                      <text x="100" y="35" textAnchor="middle" fill="#D4AF37" fontSize="16" fontWeight="bold">N</text>
                      <text x="165" y="105" textAnchor="middle" fill="#D4AF37" fontSize="16" opacity="0.5">E</text>
                      <text x="100" y="175" textAnchor="middle" fill="#D4AF37" fontSize="16" opacity="0.5">S</text>
                      <text x="35" y="105" textAnchor="middle" fill="#D4AF37" fontSize="16" opacity="0.5">W</text>
                      <circle cx="100" cy="100" r="8" fill="#F4D03F" />
                      <circle cx="100" cy="100" r="12" fill="none" stroke="#F4D03F" strokeWidth="2" opacity="0.5" />
                      <line x1="100" y1="100" x2="100" y2="60" stroke="#fff" strokeWidth="3" strokeDasharray="5,5" opacity="0.3" />
                      <circle cx="100" cy="60" r="4" fill="#fff" opacity="0.3" />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">Set Your First North Star</h2>
                  <p className="text-white/70 mb-6">
                    Create goals, plans, and habits to track your growth across all life pillars
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button
                      onClick={() => setShowGoalCreator(true)}
                      aria-label="Create your first goal"
                      className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                    >
                      <Target className="w-5 h-5 mr-2" aria-hidden="true" />
                      Create Goal
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl("MyPlans"))}
                      aria-label="Create your first plan"
                      className="bg-[#1a1f35] border border-white/20 text-white hover:bg-white/10 font-bold"
                    >
                      <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                      Create Plan
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl("Habits"))}
                      aria-label="Create your first habit"
                      className="bg-[#1a1f35] border border-white/20 text-white hover:bg-white/10 font-bold"
                    >
                      <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                      Create Habit
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedData).map(([pillarId, data]) => {
                  const pillar = PILLARS[pillarId];
                  return (
                    <div
                      key={pillarId}
                      className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6"
                      style={{ boxShadow: `0 0 20px ${pillar.color}20` }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{
                            backgroundColor: `${pillar.color}20`,
                            boxShadow: `0 0 10px ${pillar.color}40`
                          }}
                        >
                          {pillar.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{pillar.name}</h3>
                          <p className="text-white/60 text-sm">
                            {data.goals.length} goals • {data.plans.length} plans • {data.habits.length} habits
                          </p>
                        </div>
                      </div>
                      
                      {data.habits.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-white/80 font-semibold mb-3 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Daily Habits
                          </h4>
                          <div className="space-y-2">
                            {data.habits.map(habit => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                onToggleComplete={() => handleToggleHabitComplete(habit)}
                                onEdit={() => navigate(createPageUrl("Habits"))}
                                onDelete={() => {}}
                                onTogglePause={() => {}}
                                compact={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {data.goals.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-white/80 font-semibold mb-3 text-sm flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Goals
                          </h4>
                          <div className="space-y-2">
                            {data.goals.map(goal => (
                              <GoalCard
                                key={goal.id}
                                goal={goal}
                                onEdit={() => handleEdit(goal)}
                                onUpdateStatus={handleUpdateStatus}
                                onUpdateProgress={handleUpdateProgress}
                                onDelete={handleDeleteGoal}
                                compact={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {data.plans.length > 0 && (
                        <div>
                          <h4 className="text-white/80 font-semibold mb-3 text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Plans
                          </h4>
                          <div className="space-y-2">
                            {data.plans.map(plan => (
                              <Link
                                key={plan.id}
                                to={createPageUrl("PlanDetail") + `?id=${plan.id}`}
                                className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-white font-bold mb-1">{plan.planTitle}</h5>
                                    <p className="text-white/70 text-sm line-clamp-1">
                                      {plan.planDescription}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
                                      <Calendar className="w-3 h-3" />
                                      {plan.startDate && `Started ${new Date(plan.startDate).toLocaleDateString()}`}
                                      {plan.isActive && (
                                        <>
                                          <span>•</span>
                                          <span className="text-green-400">Active</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-white/40" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Goals View */}
        {view === "goals" && (
          <div>
            {goals.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6" aria-hidden="true">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#D4AF37" strokeWidth="3" opacity="0.3" />
                      <circle cx="100" cy="100" r="8" fill="#F4D03F" />
                      <path d="M 100 100 L 100 40" stroke="#fff" strokeWidth="3" strokeDasharray="5,5" opacity="0.3" />
                    </svg>
                  </div>
                  
                  <Target className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" aria-hidden="true" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Goals Yet</h2>
                  <p className="text-white/70 mb-6">
                    Create your first SMART goal and let our AI help you achieve it!
                  </p>
                  <Button
                    onClick={() => setShowGoalCreator(true)}
                    aria-label="Create your first goal"
                    className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                  >
                    <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                    Get Started
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => handleEdit(goal)}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateProgress={handleUpdateProgress}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Plans View */}
        {view === "plans" && (
          <div>
            {plans.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#4CC9F0]" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Plans Yet</h2>
                  <p className="text-white/70 mb-6">
                    Create a plan with AI-powered guidance and actionable steps
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("MyPlans"))}
                    className="bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30 text-[#4CC9F0] border border-[#4CC9F0]/40"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Plan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map(plan => {
                  const pillar = PILLARS[plan.pillar];
                  const planGoals = goals.filter(g => g.linkedPlanId === plan.id);
                  
                  return (
                    <Link
                      key={plan.id}
                      to={createPageUrl("PlanDetail") + `?id=${plan.id}`}
                      className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all"
                      style={{ boxShadow: `0 0 20px ${pillar.color}30` }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{
                            backgroundColor: `${pillar.color}20`,
                            boxShadow: `0 0 15px ${pillar.color}40`
                          }}
                        >
                          {pillar.icon}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">{plan.planTitle}</h3>
                          <p className="text-white/70 text-sm mb-3 line-clamp-2">
                            {plan.planDescription}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-white/60">
                            {plan.startDate && (
                              <>
                                <Calendar className="w-3 h-3" />
                                <span>Started {new Date(plan.startDate).toLocaleDateString()}</span>
                              </>
                            )}
                            {plan.isActive && (
                              <>
                                <span>•</span>
                                <span className="text-green-400">Active</span>
                              </>
                            )}
                            {planGoals.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-[#D4AF37]">{planGoals.length} linked goals</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Habits View */}
        {view === "habits" && (
          <div>
            {habits.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Habits Yet</h2>
                  <p className="text-white/70 mb-6">
                    Build sustainable daily practices to support your goals
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("Habits"))}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Create Habit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {habits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggleComplete={() => handleToggleHabitComplete(habit)}
                    onEdit={() => navigate(createPageUrl("Habits"))}
                    onDelete={() => {}}
                    onTogglePause={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Info Card */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Goals vs Plans</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-white/90 font-semibold mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#D4AF37]" />
                    SMART Goals
                  </h4>
                  <p className="text-white/70">
                    Specific, measurable targets with clear success criteria and deadlines. Perfect for concrete achievements.
                  </p>
                </div>
                <div>
                  <h4 className="text-white/90 font-semibold mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4CC9F0]" />
                    Life Plans
                  </h4>
                  <p className="text-white/70">
                    Comprehensive strategies with daily habits, weekly actions, and long-term vision. Great for lifestyle changes.
                  </p>
                </div>
              </div>
              <p className="text-white/60 text-sm mt-3">
                💡 Tip: Link goals to plans to create a powerful growth framework!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {showGoalCreator && (
        <GoalCreator
          onClose={() => {
            setShowGoalCreator(false);
            setEditingGoal(null);
          }}
          onSuccess={handleSuccess}
          initialGoal={editingGoal}
          user={user}
        />
      )}
    </div>
  );
}