import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Flame,
  Award,
  Target,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

const PILLARS = {
  sleep: { name: "Sleep", color: "#6B46C1", icon: "🌙" },
  diet: { name: "Diet", color: "#52B788", icon: "🥗" },
  exercise: { name: "Exercise", color: "#FF5733", icon: "💪" },
  physical_health: { name: "Physical Health", color: "#FF7F50", icon: "❤️" },
  mental_health: { name: "Mental Health", color: "#4CC9F0", icon: "🧠" },
  finances: { name: "Finances", color: "#2E8B57", icon: "💰" },
  social: { name: "Social", color: "#FFD700", icon: "👥" },
  spirituality: { name: "Spirituality", color: "#7C3AED", icon: "✨" },
};

export default function DailyProgress() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: () =>
      api.getHabits(
        { userId: user?.email, isActive: true },
        "-created_date",
        100
      ),
    enabled: !!user,
    initialData: [],
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["activePlans"],
    queryFn: () =>
      api.getPlans(
        { created_by: user?.email, isActive: true },
        "-created_date",
        100
      ),
    enabled: !!user,
    initialData: [],
  });

  // Filter habits that belong to active plans
  const activePlanIds = plans.map((p) => p.id);
  const activeHabits = habits.filter((h) =>
    activePlanIds.includes(h.linkedPlanId)
  );

  // Group habits by plan
  const habitsByPlan = {};
  activeHabits.forEach((habit) => {
    if (!habitsByPlan[habit.linkedPlanId]) {
      habitsByPlan[habit.linkedPlanId] = [];
    }
    habitsByPlan[habit.linkedPlanId].push(habit);
  });

  const completeMutation = useMutation({
    mutationFn: async (habit) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, "yyyy-MM-dd");

      let newStreak = 1;

      // Calculate new streak
      if (habit.lastCompletedDate === today) {
        // Already completed today - do nothing
        return habit;
      } else if (habit.lastCompletedDate === yesterdayStr) {
        // Completed yesterday - increment streak
        newStreak = (habit.streakCount || 0) + 1;
      } else {
        // Missed days or first time - reset to 1
        newStreak = 1;
      }

      return api.updateHabit(habit.id, {
        streakCount: newStreak,
        lastCompletedDate: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["habits"]);
      queryClient.invalidateQueries(["habitsForPlan"]);
    },
  });

  const handleToggle = (habit) => {
    if (habit.lastCompletedDate === today) {
      // Already completed today - optionally could allow "uncomplete"
      return;
    }
    completeMutation.mutate(habit);
  };

  const isCompletedToday = (habit) => habit.lastCompletedDate === today;

  const todayProgress = activeHabits.filter((h) => isCompletedToday(h)).length;
  const totalHabits = activeHabits.length;
  const progressPercent =
    totalHabits > 0 ? Math.round((todayProgress / totalHabits) * 100) : 0;

  if (habitsLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 animate-pulse" />
          <p className="text-white/60">Loading your habits...</p>
        </div>
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return (
      <div className="min-h-screen pb-24 px-6 pt-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            Daily Progress
          </h1>
          <div className="text-center py-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <Target className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white mb-2">
                No Active Habits Yet
              </h2>
              <p className="text-white/60 mb-6">
                Create a plan with your AI coach to get personalized daily
                habits!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Daily Progress
          </h1>
          <p className="text-white/60">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Overall Progress */}
        <div
          className="bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-6 mb-8"
          style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.3)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Today's Progress
              </h2>
              <p className="text-white/60 text-sm">Keep up the momentum! 💪</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D4AF37]">
                {progressPercent}%
              </div>
              <div className="text-xs text-white/60">
                {todayProgress}/{totalHabits}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] transition-all duration-500 rounded-full"
              style={{
                width: `${progressPercent}%`,
                boxShadow: "0 0 10px rgba(212, 175, 55, 0.5)",
              }}
            />
          </div>

          {progressPercent === 100 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-full">
                <Award className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold">
                  All habits completed! 🎉
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Habits by Plan */}
        <div className="space-y-6">
          {Object.entries(habitsByPlan).map(([planId, planHabits]) => {
            const plan = plans.find((p) => p.id === planId);
            if (!plan) return null;

            const pillar = PILLARS[plan.pillar];
            const planCompleted = planHabits.filter((h) =>
              isCompletedToday(h)
            ).length;
            const planTotal = planHabits.length;

            return (
              <div
                key={planId}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                style={{ boxShadow: `0 0 20px ${pillar.color}30` }}
              >
                {/* Plan Header */}
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-white/10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      backgroundColor: `${pillar.color}20`,
                      boxShadow: `0 0 15px ${pillar.color}40`,
                    }}
                  >
                    {pillar.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {plan.planTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${pillar.color}30`,
                          color: pillar.color,
                        }}
                      >
                        {pillar.name}
                      </span>
                      <span className="text-white/60">
                        {planCompleted}/{planTotal} completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Habits List */}
                <div className="space-y-2">
                  {planHabits.map((habit) => {
                    const completed = isCompletedToday(habit);
                    const streak = habit.streakCount || 0;

                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleToggle(habit)}
                        disabled={completed || completeMutation.isPending}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                          completed
                            ? "bg-green-500/10 border-green-500/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-6 h-6 text-white/40 flex-shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1">
                          <div
                            className={`font-medium mb-1 ${
                              completed
                                ? "text-white/80 line-through"
                                : "text-white"
                            }`}
                          >
                            {habit.habitText}
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            {streak > 0 && (
                              <div className="flex items-center gap-1 text-orange-400">
                                <Flame className="w-3 h-3" />
                                <span className="font-bold">
                                  {streak} day momentum
                                </span>
                              </div>
                            )}

                            {/* Milestone Badges */}
                            {streak >= 21 && (
                              <div className="flex items-center gap-1 text-purple-400">
                                <Award className="w-3 h-3" />
                                <span className="font-semibold">
                                  21-day momentum
                                </span>
                              </div>
                            )}
                            {streak >= 7 && streak < 21 && (
                              <div className="flex items-center gap-1 text-blue-400">
                                <Award className="w-3 h-3" />
                                <span className="font-semibold">
                                  7-day momentum
                                </span>
                              </div>
                            )}
                            {streak >= 3 && streak < 7 && (
                              <div className="flex items-center gap-1 text-green-400">
                                <Award className="w-3 h-3" />
                                <span className="font-semibold">
                                  3-day momentum
                                </span>
                              </div>
                            )}

                            {!completed && streak === 0 && (
                              <span className="text-white/40">
                                Build momentum today
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivational Footer */}
        <div className="mt-8 text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <TrendingUp className="w-8 h-8 mx-auto mb-3 text-[#D4AF37]" />
          <h3 className="text-lg font-bold text-white mb-2">
            Consistency is Key
          </h3>
          <p className="text-white/60 text-sm">
            Small daily actions lead to big long-term results.
          </p>
        </div>
      </div>
    </div>
  );
}
