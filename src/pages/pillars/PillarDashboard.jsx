/**
 * PillarDashboard Template
 *
 * Reusable component for displaying individual pillar dashboards.
 * Shows current goals, habits, last check-in, and AI coach interaction.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PillarPage from "@/components/shared/PillarPage";
import DataCard from "@/components/shared/DataCard";
import ActionCard from "@/components/shared/ActionCard";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Plus,
  Send,
  Loader2,
  Target,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import * as pillarClient from "@/api/pillarClient";
import { differenceInCalendarDays } from "date-fns";
import { computeComBRecommendations, createComBInput } from "@/engines/com-b";
import {
  buildAdaptiveCoachContext,
  buildAdaptiveCoachProfile,
  getAdaptivePillarPlan,
} from "@/ai/adaptive";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { createPageUrl } from "@/utils";
import { api } from "@/utils/apiClient";

export default function PillarDashboard({ pillar, coachAgent = null }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [coachMessage, setCoachMessage] = useState("");
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const { hasPremiumAccess, isTrial, daysRemaining } = useSubscriptionStatus();

  // Get current user
  useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.me();
        if (u && typeof u === "object") {
          setUser(u);
          return;
        }
        // Demo-mode fallback to enable pillar pages without backend
        if (import.meta.env.VITE_DEMO_MODE === "true") {
          setUser({ id: "demo" });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        if (import.meta.env.VITE_DEMO_MODE === "true") {
          setUser({ id: "demo" });
        }
      }
    }
    loadUser();
  }, []);

  // Fetch current goals for this pillar
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", pillar.id, user?.id],
    queryFn: async () => {
      try {
        const result = await pillarClient.getGoals({
          pillar: pillar.id,
          status: "active",
        });
        return result.goals || result.data || [];
      } catch (error) {
        console.error(`Error fetching goals for ${pillar.id}:`, error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch current habits for this pillar
  const { data: habits = [] } = useQuery({
    queryKey: ["habits", pillar.id, user?.id],
    queryFn: async () => {
      try {
        const result = await pillarClient.getHabits({
          pillar: pillar.id,
          status: "active",
        });
        return result.habits || result.data || [];
      } catch (error) {
        console.error(`Error fetching habits for ${pillar.id}:`, error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch last check-in
  const { data: lastCheckin = null } = useQuery({
    queryKey: ["lastCheckin", pillar.id, user?.id],
    queryFn: async () => {
      try {
        const result = await pillarClient.getCheckIns(pillar.id, { limit: 1 });
        const checkins = result.checkIns || result.data || [];
        return checkins.length > 0 ? checkins[0] : null;
      } catch (error) {
        console.error(`Error fetching check-in for ${pillar.id}:`, error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Log check-in mutation
  const logCheckinMutation = useMutation({
    mutationFn: (data) =>
      pillarClient.createCheckIn({
        pillar: pillar.id,
        rating: data.rating,
        notes: data.notes,
        date: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lastCheckin", pillar.id] });
      toast.success(`${pillar.name} check-in saved!`);
    },
    onError: (error) => {
      toast.error(`Failed to save check-in: ${error.message}`);
    },
  });

  // Handle AI coach message
  const handleCoachMessage = async (e) => {
    e.preventDefault();
    if (!coachMessage.trim()) return;
    if (!hasPremiumAccess) {
      toast.error("Upgrade to access AI coaching for this pillar.");
      return;
    }

    setIsLoadingCoach(true);
    try {
      // Send to AI agent
      const payload = {
        pillar: pillar.id,
        message: coachMessage,
        agent: coachAgent || pillar.id,
      };
      if (adaptiveCoachContext) {
        payload.adaptiveContext = {
          ...adaptiveCoachContext,
          targetPillar: pillar.id,
        };
      }

      if (import.meta.env.VITE_DEMO_MODE === "true") {
        toast.success("Message sent to coach!");
        setCoachMessage("");
      } else {
        const result = await api.post("/ai/orchestrator", payload);
        toast.success("Message sent to coach!");
        setCoachMessage("");
      }

      // Could trigger a modal or navigate to chat here
    } catch (error) {
      toast.error("Failed to reach coach. Please try again.");
      console.error("Coach message error:", error);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Calculate pillar score (placeholder)
  const pillarScore =
    Math.round((goals.length * 10 + habits.length * 5) % 100) || 42;

  const stats = [
    {
      icon: <Target className="w-4 h-4" />,
      label: "Active Goals",
      value: goals.length,
      subtitle: "in progress",
      color: pillar.color,
    },
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Active Habits",
      value: habits.length,
      subtitle: "daily",
      color: pillar.color,
    },
    {
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Pillar Score",
      value: pillarScore,
      subtitle: "/100",
      color: pillar.color,
    },
  ];

  const comBScores = useMemo(() => {
    if (!user) {
      return { motivation: 58, opportunity: 55, capability: 57 };
    }
    const fallback = { motivation: 58, opportunity: 55, capability: 57 };
    const profile = user.behavior_profile || user.behaviorProfile || {};
    const onboarding = user.onboarding_profile || {};
    const stored = user.com_b_scores || user.comB || {};
    const parseScore = (value, fallbackValue) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallbackValue;
    };

    return {
      motivation: parseScore(
        stored.motivation ||
          profile.motivation ||
          onboarding.motivation ||
          user.motivation_score,
        fallback.motivation
      ),
      opportunity: parseScore(
        stored.opportunity ||
          profile.opportunity ||
          onboarding.opportunity ||
          user.opportunity_score ||
          profile.environment,
        fallback.opportunity
      ),
      capability: parseScore(
        stored.capability ||
          profile.capability ||
          onboarding.capability ||
          user.capability_score ||
          profile.skill,
        fallback.capability
      ),
    };
  }, [user]);

  const habitConsistency = useMemo(() => {
    if (!habits.length) return null;
    const aggregate = habits.reduce(
      (acc, habit) => {
        const value =
          typeof habit.consistency === "number"
            ? habit.consistency
            : typeof habit.completionRate === "number"
            ? habit.completionRate
            : typeof habit.progress === "number"
            ? habit.progress
            : habit.streak
            ? Math.min(100, (habit.streak / 21) * 100)
            : 0;
        acc.total += value;
        acc.count += 1;
        return acc;
      },
      { total: 0, count: 0 }
    );
    return Math.round(aggregate.total / aggregate.count);
  }, [habits]);

  const lastCheckInDays = useMemo(() => {
    if (!lastCheckin?.date) return null;
    const diff = differenceInCalendarDays(
      new Date(),
      new Date(lastCheckin.date)
    );
    return Number.isFinite(diff) ? Math.max(0, Math.min(365, diff)) : null;
  }, [lastCheckin]);

  const comBPillarMetric = useMemo(() => {
    if (!pillar) return null;
    return {
      id: pillar.id,
      name: pillar.name,
      score: pillarScore,
      trend: lastCheckin?.rating ? (lastCheckin.rating - 3) * 12.5 : undefined,
      lastEntryDays: lastCheckInDays,
      habitConsistency,
      blockers: [],
      focus: pillar.name,
    };
  }, [pillar, pillarScore, lastCheckInDays, habitConsistency, lastCheckin]);

  const comBInput = useMemo(() => {
    if (!comBPillarMetric) return null;
    return createComBInput({
      motivation: comBScores.motivation,
      opportunity: comBScores.opportunity,
      capability: comBScores.capability,
      pillarMetrics: [comBPillarMetric],
      focusPillarId: pillar.id,
    });
  }, [
    comBPillarMetric,
    comBScores.capability,
    comBScores.motivation,
    comBScores.opportunity,
    pillar.id,
  ]);

  const comBInsights = useMemo(() => {
    if (!comBInput) return null;
    return computeComBRecommendations(comBInput, {
      limit: 3,
      focusPillarId: pillar.id,
    });
  }, [comBInput, pillar.id]);

  const comBPrimaryFocus = comBInsights?.primaryFocus || null;
  const comBMicroActions =
    comBPrimaryFocus?.microActions || comBInsights?.recommendedActions || [];

  const adaptiveCoachProfile = useMemo(() => {
    if (!user) return null;
    return buildAdaptiveCoachProfile({
      user,
      comBInsights,
      accessiblePillars: [pillar],
    });
  }, [user, comBInsights, pillar]);

  const adaptiveCoachContext = useMemo(
    () => buildAdaptiveCoachContext(adaptiveCoachProfile),
    [adaptiveCoachProfile]
  );

  const adaptivePillarInsight = useMemo(
    () => getAdaptivePillarPlan(pillar.id, adaptiveCoachProfile),
    [pillar.id, adaptiveCoachProfile]
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <PillarPage
      pillar={pillar}
      title={`${pillar.name} Hub`}
      subtitle={pillar.description}
      stats={stats}
    >
      {/* Current Goals Section */}
      <DataCard
        title={`${pillar.name} Goals`}
        titleIcon={<Target />}
        color={pillar.color}
        action={
          <Button
            size="sm"
            className="gap-2"
            style={{ background: pillar.color }}
          >
            <Plus className="w-4 h-4" />
            New Goal
          </Button>
        }
      >
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3"
              >
                <h4 className="text-white font-semibold">{goal.title}</h4>
                <p className="text-white/60 text-sm mt-1">{goal.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/50">{goal.status}</span>
                  <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                    {goal.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
            {goals.length > 3 && (
              <p className="text-sm text-white/50 text-center py-2">
                +{goals.length - 3} more goals
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/60 mb-3">No goals yet for {pillar.name}</p>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: pillar.color }}
            >
              <Plus className="w-4 h-4" />
              Create First Goal
            </Button>
          </div>
        )}
      </DataCard>

      {/* Current Habits Section */}
      <DataCard
        title={`${pillar.name} Habits`}
        titleIcon={<CheckCircle2 />}
        color={pillar.color}
      >
        {habits.length > 0 ? (
          <div className="space-y-3">
            {habits.slice(0, 3).map((habit) => (
              <div
                key={habit.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3"
              >
                <h4 className="text-white font-semibold">{habit.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/50">
                    {habit.frequency}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                      🔥 {habit.streak || 0} day streak
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                </div>
              </div>
            ))}
            {habits.length > 3 && (
              <p className="text-sm text-white/50 text-center py-2">
                +{habits.length - 3} more habits
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/60 mb-3">No habits tracked yet</p>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: pillar.color }}
            >
              <Plus className="w-4 h-4" />
              Start a Habit
            </Button>
          </div>
        )}
      </DataCard>

      {/* Last Check-in Section */}
      <DataCard
        title="Last Check-in"
        titleIcon={<MessageSquare />}
        color={pillar.color}
      >
        {lastCheckin ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">How are you doing?</h4>
              <span className="text-xl">
                {["😞", "😐", "🙂", "😊", "🤩"][lastCheckin.rating || 2]}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-white/80 text-sm">
                {lastCheckin.notes || "No notes"}
              </p>
            </div>
            <p className="text-xs text-white/50">
              {lastCheckin.date
                ? new Date(lastCheckin.date).toLocaleDateString()
                : "Recently"}
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/60 mb-3">No check-in yet today</p>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: pillar.color }}
              onClick={() =>
                logCheckinMutation.mutate({ rating: 3, notes: "Doing well!" })
              }
            >
              <Plus className="w-4 h-4" />
              Check In Now
            </Button>
          </div>
        )}
      </DataCard>

      {comBPrimaryFocus && (
        <DataCard
          title="Behavioral Guidance"
          titleIcon={<AlertCircle />}
          color={pillar.color}
        >
          <div className="space-y-4">
            {comBPrimaryFocus.reasoning && (
              <p className="text-white/70 text-sm">
                {comBPrimaryFocus.reasoning}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-white/60">
              {habitConsistency !== null && (
                <div className="px-3 py-1 rounded-full bg-white/5">
                  Habit consistency: {habitConsistency}%
                </div>
              )}
              {lastCheckInDays !== null && (
                <div className="px-3 py-1 rounded-full bg-white/5">
                  Last check-in: {lastCheckInDays}d ago
                </div>
              )}
            </div>
            {comBMicroActions.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {comBMicroActions.slice(0, 4).map((action) => (
                  <div
                    key={action.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-3"
                  >
                    <h4 className="text-white font-semibold">
                      {action.label || action.description || "Guided action"}
                    </h4>
                    {(action.description || action.rationale) && (
                      <p className="text-white/60 text-sm mt-1">
                        {action.description || action.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {adaptivePillarInsight && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Adaptive signal</span>
                  {adaptivePillarInsight.intensity && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      {adaptivePillarInsight.intensity}
                    </span>
                  )}
                </div>
                <h4 className="text-white font-semibold mt-1">
                  {adaptivePillarInsight.summary}
                </h4>
                {adaptivePillarInsight.alert?.severityLabel && (
                  <p className="text-xs text-white/50 mt-1">
                    Psychometrics flag {adaptivePillarInsight.alert.label} as{" "}
                    {adaptivePillarInsight.alert.severityLabel || "elevated"}
                  </p>
                )}
                {adaptivePillarInsight.microActions?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-white/70">
                    {adaptivePillarInsight.microActions.map((micro) => (
                      <li key={micro.id}>
                        • {micro.label || micro.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </DataCard>
      )}

      {/* AI Coach Section */}
      <DataCard
        title={`Ask the ${pillar.name} Coach`}
        titleIcon={<MessageSquare />}
        color={pillar.color}
      >
        <form onSubmit={handleCoachMessage} className="space-y-3">
          <textarea
            value={coachMessage}
            onChange={(e) => setCoachMessage(e.target.value)}
            placeholder={`Ask your ${pillar.name} coach anything...`}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 min-h-24 resize-none"
          />
          <Button
            type="submit"
            disabled={!coachMessage.trim() || isLoadingCoach}
            className="w-full gap-2"
            style={{ background: pillar.color }}
          >
            {isLoadingCoach ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-white/50 mt-3">
          The {pillar.name} coach will respond with personalized advice based on
          your situation.
        </p>
      </DataCard>

      {/* Pillar Score Placeholder */}
      <DataCard
        title="Pillar Score"
        titleIcon={<Target />}
        color={pillar.color}
      >
        <div className="text-center space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={pillar.color}
                strokeWidth="8"
                strokeDasharray={`${(pillarScore / 100) * 283} 283`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-white">
                  {pillarScore}
                </div>
                <div className="text-white/60 text-sm">/ 100</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">
              {pillarScore >= 80
                ? "🌟 Excellent! Keep it up!"
                : pillarScore >= 60
                ? "👍 Good progress, room to grow"
                : pillarScore >= 40
                ? "💪 Getting there, stay consistent"
                : "🚀 Time to focus on this pillar!"}
            </p>
          </div>
        </div>
      </DataCard>
    </PillarPage>
  );
}
