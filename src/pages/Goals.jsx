import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Filter,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GoalCreator from "@/components/shared/GoalCreator";
import GoalCard from "@/components/shared/GoalCard";

const PILLARS = {
  sleep: { name: "Sleep", icon: "🌙", color: "#6B46C1" },
  diet: { name: "Diet", icon: "🥗", color: "#52B788" },
  exercise: { name: "Exercise", icon: "💪", color: "#FF5733" },
  physical_health: { name: "Physical Health", icon: "❤️", color: "#FF7F50" },
  mental_health: { name: "Mental Health", icon: "🧠", color: "#4CC9F0" },
  finances: { name: "Finances", icon: "💰", color: "#2E8B57" },
  social: { name: "Social", icon: "👥", color: "#FFD700" },
  spirituality: { name: "Spirituality", icon: "✨", color: "#7C3AED" },
};

export default function Goals() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterPillar, setFilterPillar] = useState("all");

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["smartGoals", user?.email], // Updated query key to include user email
    queryFn: () =>
      api.getGoals({ created_by: user?.email }, "-created_date", 100),
    enabled: !!user,
    initialData: [],
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartGoals", user?.email] }); // Updated query key
    },
  });

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowCreator(true);
  };

  const handleUpdateStatus = (goalId, newStatus) => {
    updateGoalMutation.mutate({
      id: goalId,
      data: { status: newStatus },
    });
  };

  const handleUpdateProgress = (goalId, newProgress) => {
    const goal = goals.find((g) => g.id === goalId);
    updateGoalMutation.mutate({
      id: goalId,
      data: {
        progress: newProgress,
        status: newProgress === 100 ? "completed" : goal.status,
      },
    });
  };

  const handleSuccess = () => {
    setShowCreator(false);
    setEditingGoal(null);
    queryClient.invalidateQueries({ queryKey: ["smartGoals", user?.email] }); // Updated query key
  };

  // Filter goals
  const filteredGoals = goals.filter((goal) => {
    const statusMatch = filterStatus === "all" || goal.status === filterStatus;
    const pillarMatch = filterPillar === "all" || goal.pillar === filterPillar;
    return statusMatch && pillarMatch;
  });

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const totalProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
        )
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
            <Skeleton className="h-9 w-64 mx-auto mb-3" />
            <Skeleton className="h-5 w-56 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center"
            style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)" }}
          >
            <Target className="w-10 h-10 text-[#0A1628]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            SMART Goals
          </h1>
          <p className="text-white/70">AI-powered goal setting and tracking</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="text-white/70 text-sm mb-1">Total Goals</div>
            <div className="text-3xl font-bold text-white">{goals.length}</div>
          </div>

          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="text-white/70 text-sm mb-1">Active</div>
            <div className="text-3xl font-bold text-[#4CC9F0]">
              {activeGoals.length}
            </div>
          </div>

          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="text-white/70 text-sm mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-400">
              {completedGoals.length}
            </div>
          </div>

          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4">
            <div className="text-white/70 text-sm mb-1">Avg Progress</div>
            <div className="text-3xl font-bold text-[#D4AF37]">
              {totalProgress}%
            </div>
          </div>
        </div>

        {/* Filters & Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/60" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#1a1f35] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <select
              value={filterPillar}
              onChange={(e) => setFilterPillar(e.target.value)}
              className="bg-[#1a1f35] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Pillars</option>
              {Object.entries(PILLARS).map(([id, pillar]) => (
                <option key={id} value={id}>
                  {pillar.icon} {pillar.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => {
              setEditingGoal(null);
              setShowCreator(true);
            }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
            style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Goal
          </Button>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold text-white mb-2">
                No Goals Yet
              </h2>
              <p className="text-white/70 mb-6">
                Create your first SMART goal and let our AI help you achieve it!
              </p>
              <Button
                onClick={() => setShowCreator(true)}
                className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEdit(goal)}
                onUpdateStatus={handleUpdateStatus}
                onUpdateProgress={handleUpdateProgress}
              />
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                What are SMART Goals?
              </h3>
              <ul className="text-white/80 text-sm space-y-1">
                <li>
                  <strong>Specific:</strong> Clear and well-defined
                </li>
                <li>
                  <strong>Measurable:</strong> Track your progress with numbers
                </li>
                <li>
                  <strong>Achievable:</strong> Realistic and attainable
                </li>
                <li>
                  <strong>Relevant:</strong> Aligned with your values and needs
                </li>
                <li>
                  <strong>Time-bound:</strong> Has a deadline or timeframe
                </li>
              </ul>
              <p className="text-white/70 text-sm mt-3">
                💡 Our AI helps transform your ideas into actionable SMART goals
                with personalized recommendations!
              </p>
            </div>
          </div>
        </div>
      </div>

      {showCreator && (
        <GoalCreator
          onClose={() => {
            setShowCreator(false);
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
