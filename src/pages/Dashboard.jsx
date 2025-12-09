import CoachPanel from "@/components/ai/CoachPanel";
import { api } from "@/utils/apiClient";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PILLARS, getPillarsArray, createPageUrl } from "@/utils";
import PropTypes from "prop-types";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Flame,
  ChevronRight,
  Smile,
  CheckCircle2,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import ScoreOrb from "@/components/shared/ScoreOrb";
import DailySummary from "@/components/shared/DailySummary";
import AIInsights from "@/ai/AIInsights";
import {
  buildAdaptiveCoachContext,
  buildAdaptiveCoachProfile,
} from "@/ai/adaptive";
import ActiveItemsWidget from "@/components/shared/ActiveItemsWidget";
import GuidedTour from "@/ai/GuidedTour";
import AuthGuard from "@/components/shared/AuthGuard";
import StreakDisplay from "@/components/shared/StreakDisplay";
import MilestoneCelebration from "@/components/shared/MilestoneCelebration";
import { useStreak } from "@/hooks/useStreak";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import ErrorBoundary from "@/components/ErrorBoundary";
import AIErrorBoundary from "@/components/AIErrorBoundary";
import { LifeOrbitVisualizer } from "@/components/visuals/LifeOrbitVisualizer";
import { computeComBRecommendations, createComBInput } from "@/engines/com-b";

/** @typedef {import("@/engines/com-b").PillarMetric} PillarMetric */

// This constant is necessary for iterating over all pillars in the UI and filtering
const PILLARS_ARRAY = getPillarsArray();

// Helper function for calculating scores based on a specific date and set of pillars
// This function mimics the original calculateScores signature for compatibility with existing logic.
function calculateGenericScores(entries, pillarsToConsider, dateFilter = null) {
  const scores = {};
  const filteredEntries = dateFilter
    ? entries.filter((e) => e.date === dateFilter)
    : entries;

  pillarsToConsider.forEach((pillar) => {
    const entry = filteredEntries.find((e) => e.pillar === pillar.id);
    scores[pillar.id] = entry?.score || 0;
  });

  const lifeScore =
    pillarsToConsider.length > 0
      ? Math.round(
          Object.values(scores).reduce((sum, score) => sum + score, 0) /
            pillarsToConsider.length
        )
      : 0;

  return { lifeScore, pillarScores: scores };
}

// This `calculateScores` function is from the outline and replaces the original one.
// It calculates scores for *all* 8 pillars (0 if not logged), but the lifeScore average
// only includes pillars that actually have an entry for today.
const calculateScores = (entries) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const todaysEntries = entries.filter((e) => e.date === today);

  let totalScore = 0;
  let pillarCount = 0;

  const pillarScores = {};
  Object.keys(PILLARS).forEach((pillarId) => {
    const entry = todaysEntries.find((e) => e.pillar === pillarId);
    pillarScores[pillarId] = entry?.score || 0;

    // Only count pillars that have an entry today for the lifeScore average
    if (entry) {
      totalScore += entry.score;
      pillarCount++;
    }
  });

  const lifeScore = pillarCount > 0 ? Math.round(totalScore / pillarCount) : 0;

  return { lifeScore, pillarScores };
};

const ORBIT_PILLAR_COLORS = Object.freeze({
  sleep: "#22d3ee",
  mental: "#a855f7",
  exercise: "#22c55e",
  physical: "#0ea5e9",
  finances: "#f97316",
  social: "#ec4899",
  diet: "#84cc16",
  spiritual: "#6366f1",
});

function DashboardContent({ user }) {
  const queryClient = useQueryClient();
  const [showTour, setShowTour] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const {
    subscription,
    hasPremiumAccess,
    isTrial,
    daysRemaining,
    isLoading: subscriptionLoading,
  } = useSubscriptionStatus();

  const getFirstName = (value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.split(/\s+/)[0];
  };

  const welcomeFirstName =
    getFirstName(user?.full_name) ||
    getFirstName(user?.fullName) ||
    getFirstName(user?.displayName) ||
    getFirstName(user?.raw?.displayName) ||
    getFirstName(user?.email?.split("@")[0]) ||
    "Traveler";

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["entries", user?.email],
    queryFn: () => api.getEntries({ created_by: user?.email }, "-date", 90),
    enabled: !!user?.email,
    staleTime: 30000,
    initialData: [],
  });

  const streak = useStreak(entries, user);

  useEffect(() => {
    async function refreshUserState() {
      if (!user || subscriptionLoading) return;

      const isPremiumAccess = hasPremiumAccess;

      // Show tour for new users who haven't seen it
      if (!user.tour_completed && user.onboarding_completed) {
        setShowTour(true);
      }

      let updateData = {};

      // Calculate and award pillar score bonuses
      const allEntries = await api.getEntries(
        { created_by: user.email },
        "-date",
        100
      );
      const todayEntries = allEntries.filter((e) => e.date === today);

      let bonusPoints = 0;
      const bonusesAwarded = user.streak_milestones_awarded || {};

      todayEntries.forEach((entry) => {
        const bonusKey = `pillar_${entry.pillar}_${today}`;
        if (entry.score > 80 && !bonusesAwarded[bonusKey]) {
          bonusPoints += 100;
          bonusesAwarded[bonusKey] = true;
        }
      });

      if (bonusPoints > 0) {
        updateData.points = (user.points || 0) + bonusPoints;
        updateData.streak_milestones_awarded = bonusesAwarded;
        updateData.last_points_calculation = new Date().toISOString();
      }

      // Check for streak milestones
      const milestones = [7, 14, 30, 60, 100, 365];
      const currentStreak = streak.currentStreak;
      const lastCelebrated = user.last_celebrated_milestone || 0;

      const newMilestone = milestones.find(
        (m) => currentStreak >= m && m > lastCelebrated
      );

      if (newMilestone) {
        updateData.last_celebrated_milestone = newMilestone;
        setCelebrationMilestone(newMilestone);
      }

      // Update longest streak
      if (currentStreak > (user.longest_streak || 0)) {
        updateData.longest_streak = currentStreak;
      }

      // Initialize streak freezes for new month
      const currentMonth = new Date().getMonth();
      const lastResetMonth = user.freeze_reset_month || -1;
      if (currentMonth !== lastResetMonth) {
        updateData.streak_freezes_available = isPremiumAccess ? 3 : 1;
        updateData.freeze_reset_month = currentMonth;
      }

      if (Object.keys(updateData).length > 0) {
        await api.authUpdateMe(updateData);
        queryClient.invalidateQueries(["auth-user"]);
      }
    }
    refreshUserState();
  }, [
    user,
    today,
    queryClient,
    showTour,
    streak.currentStreak,
    hasPremiumAccess,
    subscriptionLoading,
  ]);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["lifePlans", user?.email],
    queryFn: () =>
      api.getPlans(
        {
          created_by: user?.email,
          isActive: true,
        },
        "-created_date",
        10
      ),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: pillarApi = { data: [] } } = useQuery({
    queryKey: ["pillarScores", user?.email],
    queryFn: () => api.getPillars(),
    enabled: !!user,
    initialData: { data: [] },
  });

  const pillarScoreMap = (pillarApi?.data || []).reduce((acc, p) => {
    acc[p.pillar] = p;
    return acc;
  }, {});

  const { data: goals = [] } = useQuery({
    queryKey: ["smartGoals", user?.email],
    queryFn: () =>
      api.getGoals(
        {
          created_by: user?.email,
          status: "active",
        },
        "-created_date",
        10
      ),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: habits = [] } = useQuery({
    queryKey: ["habits", user?.email],
    queryFn: () =>
      api.getHabits(
        {
          userId: user?.email,
          isActive: true,
        },
        "-created_date",
        10
      ),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: recentMood = null } = useQuery({
    queryKey: ["recentMood", user?.email],
    queryFn: async () => {
      const moods = await api.getMoods(
        { userId: user?.email },
        "-timestamp",
        1
      );
      return moods[0] || null;
    },
    enabled: !!user?.email,
  });

  // Calculate today's scores using the outline's `calculateScores` function
  // This will give a life score based on TODAY's *logged* entries, and 0 for unlogged pillars today.
  const { pillarScores: todayLoggedPillarScores } = calculateScores(entries);

  // Check which pillars have today's entry
  const pillarsLoggedToday = PILLARS_ARRAY.map((p) => p.id).filter((pillarId) =>
    entries.some((e) => e.pillar === pillarId && e.date === today)
  );

  const hasFullAccess = hasPremiumAccess;

  // Use server-provided allowedPillars when available; fall back to legacy selected_pillars
  const allowedPillarsIds = Array.isArray(subscription?.allowedPillars)
    ? subscription.allowedPillars
    : Array.isArray(user?.allowedPillars)
    ? user.allowedPillars
    : user?.selected_pillars || [];
  const accessiblePillars = hasFullAccess
    ? PILLARS_ARRAY
    : PILLARS_ARRAY.filter((p) => allowedPillarsIds.includes(p.id));

  // Calculate accessible scores using the generic helper, filtering for today's entries
  const {
    lifeScore: accessibleLifeScore,
    pillarScores: accessiblePillarScores,
  } = calculateGenericScores(entries, accessiblePillars, today);

  const accessiblePillarArray = accessiblePillars.map((p) => ({
    ...p,
    score: accessiblePillarScores[p.id] || 0,
  }));
  const orbitPillars = accessiblePillarArray.map((pillar) => ({
    id: pillar.id,
    name: pillar.name,
    color:
      ORBIT_PILLAR_COLORS[pillar.id] ||
      pillar.color ||
      pillar.accentColor ||
      "#22d3ee",
    score: pillar.score ?? 0,
  }));
  const strongest =
    accessiblePillarArray.length > 0
      ? accessiblePillarArray.reduce(
          (max, p) => (p.score > max.score ? p : max),
          accessiblePillarArray[0]
        )
      : { name: "N/A", score: 0 };
  const weakest =
    accessiblePillarArray.length > 0
      ? accessiblePillarArray.reduce(
          (min, p) => (p.score < min.score && p.score > 0 ? p : min),
          accessiblePillarArray[0]
        )
      : { name: "N/A", score: 0 };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekAgoStr = format(oneWeekAgo, "yyyy-MM-dd");

  // Calculate accessible scores for a week ago using the generic helper
  const { lifeScore: accessibleWeekAgoLifeScore } = calculateGenericScores(
    entries,
    accessiblePillars,
    weekAgoStr
  );
  const weeklyChange = accessibleLifeScore - accessibleWeekAgoLifeScore;

  const comBScores = useMemo(() => {
    const fallback = { motivation: 58, opportunity: 55, capability: 57 };
    const profile = user?.behavior_profile || user?.behaviorProfile || {};
    const onboardingProfile = user?.onboarding_profile || {};
    const stored = user?.com_b_scores || user?.comB || {};
    const parseScore = (value, fallbackValue) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallbackValue;
    };

    return {
      motivation: parseScore(
        stored.motivation ??
          profile.motivation ??
          onboardingProfile.motivation ??
          user?.motivation_score,
        fallback.motivation
      ),
      opportunity: parseScore(
        stored.opportunity ??
          profile.opportunity ??
          onboardingProfile.opportunity ??
          user?.opportunity_score ??
          profile.environment,
        fallback.opportunity
      ),
      capability: parseScore(
        stored.capability ??
          profile.capability ??
          onboardingProfile.capability ??
          user?.capability_score ??
          profile.skill,
        fallback.capability
      ),
    };
  }, [user]);

  const latestEntryByPillar = useMemo(() => {
    const map = {};
    entries.forEach((entry) => {
      if (!entry?.pillar || !entry.date) return;
      const existing = map[entry.pillar];
      if (!existing || entry.date > existing.date) {
        map[entry.pillar] = entry;
      }
    });
    return map;
  }, [entries]);

  const habitConsistencyByPillar = useMemo(() => {
    const map = {};
    habits.forEach((habit) => {
      const pillarId = habit?.pillar || habit?.pillarId;
      if (!pillarId) return;
      const value =
        typeof habit?.consistency === "number"
          ? habit.consistency
          : typeof habit?.completionRate === "number"
          ? habit.completionRate
          : typeof habit?.progress === "number"
          ? habit.progress
          : habit?.streak
          ? Math.min(100, (habit.streak / 21) * 100)
          : 0;
      if (!map[pillarId]) {
        map[pillarId] = { total: 0, count: 0 };
      }
      map[pillarId].total += value;
      map[pillarId].count += 1;
    });
    return Object.keys(map).reduce((acc, pillarId) => {
      const stats = map[pillarId];
      acc[pillarId] = Math.round(stats.total / stats.count || 0);
      return acc;
    }, {});
  }, [habits]);

  const comBPillarMetrics = useMemo(() => {
    const now = new Date();
    return accessiblePillarArray.map((pillar) => {
      /** @type {PillarMetric} */
      const metric = {
        id: pillar.id,
        name: pillar.name,
        score: pillarScoreMap[pillar.id]?.score ?? pillar.score ?? 0,
        trend:
          typeof pillarScoreMap[pillar.id]?.trendScore === "number"
            ? pillarScoreMap[pillar.id].trendScore
            : undefined,
        trendLabel:
          pillarScoreMap[pillar.id]?.trendLabel ||
          pillarScoreMap[pillar.id]?.trend,
        lastEntryDays: null,
        habitConsistency: habitConsistencyByPillar[pillar.id] ?? null,
        blockers: pillarScoreMap[pillar.id]?.blockers || [],
        focus: pillarScoreMap[pillar.id]?.focus,
      };

      const latestEntry = latestEntryByPillar[pillar.id];
      if (latestEntry?.date) {
        const difference = differenceInCalendarDays(
          now,
          new Date(latestEntry.date)
        );
        metric.lastEntryDays = Number.isFinite(difference)
          ? Math.max(0, Math.min(365, difference))
          : null;
      }

      return metric;
    });
  }, [
    accessiblePillarArray,
    habitConsistencyByPillar,
    latestEntryByPillar,
    pillarScoreMap,
  ]);

  const comBEngineInput = useMemo(() => {
    if (!comBPillarMetrics.length) return null;
    return createComBInput({
      motivation: comBScores.motivation,
      opportunity: comBScores.opportunity,
      capability: comBScores.capability,
      pillarMetrics: comBPillarMetrics,
      focusPillarId: recommendation?.pillarId,
    });
  }, [
    comBScores.motivation,
    comBScores.opportunity,
    comBScores.capability,
    comBPillarMetrics,
    recommendation?.pillarId,
  ]);

  const comBInsights = useMemo(() => {
    if (!comBEngineInput) return null;
    return computeComBRecommendations(comBEngineInput, {
      limit: hasFullAccess ? 4 : 2,
      focusPillarId: recommendation?.pillarId,
    });
  }, [comBEngineInput, hasFullAccess, recommendation?.pillarId]);

  const comBPrimaryFocus = comBInsights?.primaryFocus || null;
  const comBRecommendedActions = comBInsights?.recommendedActions || [];
  const comBDeficits = comBInsights?.deficits || null;

  const adaptiveCoachProfile = useMemo(() => {
    if (!user) return null;
    return buildAdaptiveCoachProfile({
      user,
      comBInsights,
      accessiblePillars: accessiblePillarArray,
    });
  }, [user, comBInsights, accessiblePillarArray]);

  const adaptiveCoachContext = useMemo(
    () => buildAdaptiveCoachContext(adaptiveCoachProfile),
    [adaptiveCoachProfile]
  );

  const coachPanelBody = useMemo(() => {
    const payload = {
      prompt:
        "Give a short coaching recommendation for today and 3 concrete action items.",
      userContext: { email: user?.email },
    };
    if (adaptiveCoachContext) {
      payload.adaptiveContext = adaptiveCoachContext;
    }
    return payload;
  }, [user?.email, adaptiveCoachContext]);

  const handleTourComplete = async () => {
    setShowTour(false);
    await api.authUpdateMe({ tour_completed: true });
    // Invalidate user query to refresh AuthGuard's user state
    queryClient.invalidateQueries(["auth-user"]);
  };

  // Load recommendation data after state is initialized
  useEffect(() => {
    let mounted = true;
    const loadRecommendation = async () => {
      if (!user) return;
      try {
        const res = await api.ai("coach", {
          prompt:
            "Recommend a single primary focus pillar for today with a short reason.",
          userContext: { email: user.email },
        });
        const data = res.data || res;
        const chosen = data?.chosen || data?.data?.chosen;
        const primary = Array.isArray(chosen?.primaryPillars)
          ? chosen.primaryPillars[0]
          : chosen?.primaryPillars || null;
        const reason =
          chosen?.reason ||
          data?.reason ||
          (data?.data && data.data.reason) ||
          "";
        if (!mounted) return;
        setRecommendation({ pillarId: primary, reason });
      } catch (e) {
        console.debug("recommendation error", e);
      }
    };
    loadRecommendation();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (entriesLoading || plansLoading) {
    return (
      <div className="ns-auth-shell" aria-live="polite">
        <div className="ns-card text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#D4AF37]/15 animate-pulse" />
          <p className="text-white/70">Plotting your constellation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-page">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="ns-page__header">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, {welcomeFirstName}
          </h1>
          <p className="text-white/60">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <DailySummary
            entries={entries}
            lifeScore={accessibleLifeScore}
            pillarScores={accessiblePillarScores}
            accessiblePillars={accessiblePillars}
            user={user}
          />
        </div>

        <section className="ns-card mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            Orbit Map
          </p>
          <LifeOrbitVisualizer pillars={orbitPillars} />
          <p className="text-white/60 text-sm max-w-xl">
            Each pillar orbits your average life score. Watch for low-flying
            planets—they highlight where to focus today.
          </p>
        </section>

        {/* Trial/Free Banner */}
        {!hasFullAccess && (
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F4D03F]/20 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl p-4 mb-6 mt-6 text-center">
            <p className="text-white text-sm mb-2">
              📊 You&apos;re tracking{" "}
              <span className="font-bold text-[#F4D03F]">
                {accessiblePillars.length}/8
              </span>{" "}
              pillars on the Free plan
            </p>
            <Link
              to={createPageUrl("Upgrade")}
              className="text-[#F4D03F] hover:text-[#D4AF37] text-sm font-bold flex items-center justify-center gap-1"
            >
              Unlock all pillars with a free trial
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
        {/* Today's Focus display (uses recommendation fetched above) */}
        {recommendation && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-[#7C3AED]/10 to-[#4CC9F0]/10 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-sm text-white/60">Today&apos;s Focus</div>
              <div className="text-xl font-bold text-white mt-1">
                {PILLARS[recommendation.pillarId]?.label ||
                  recommendation.pillarId}
              </div>
              {recommendation.reason && (
                <div className="text-sm text-white/70 mt-2">
                  {recommendation.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {comBPrimaryFocus && comBRecommendedActions.length > 0 && (
          <section className="ns-card mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                  COM-B Guidance
                </p>
                <h2 className="text-2xl font-semibold text-white mt-2">
                  {PILLARS[comBPrimaryFocus.pillarId]?.label ||
                    comBPrimaryFocus.pillarId}
                </h2>
                {comBPrimaryFocus.reasoning && (
                  <p className="text-white/70 text-sm mt-2 max-w-2xl">
                    {comBPrimaryFocus.reasoning}
                  </p>
                )}
              </div>
              {comBDeficits && (
                <div className="bg-white/5 rounded-2xl px-4 py-3 min-w-[220px]">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Gap Radar
                  </p>
                  <div className="flex items-end justify-between gap-4 mt-3">
                    {["motivation", "opportunity", "capability"].map((key) => {
                      const gapValue =
                        typeof comBDeficits[key] === "number"
                          ? Math.max(0, Math.round(comBDeficits[key] * 100))
                          : null;
                      return (
                        <div key={key} className="text-center">
                          <div className="text-white text-lg font-semibold">
                            {gapValue !== null ? `${gapValue}%` : "--"}
                          </div>
                          <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                            {key.slice(0, 3)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {comBRecommendedActions.map((action) => (
                <div
                  key={action.id}
                  className="bg-white/5 border border-white/5 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>
                      {PILLARS[action.pillarId]?.label || action.pillarId}
                    </span>
                    {action.intensity && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                        {action.intensity}
                      </span>
                    )}
                  </div>
                  <div className="text-white font-semibold mt-1">
                    {action.label || action.title}
                  </div>
                  {(action.description || action.rationale) && (
                    <p className="text-white/70 text-sm mt-1">
                      {action.description || action.rationale}
                    </p>
                  )}
                  {action.microActions?.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {action.microActions.slice(0, 2).map((micro) => (
                        <li
                          key={micro.id}
                          className="flex items-start gap-2 text-sm text-white/70"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#4CC9F0] mt-0.5 shrink-0" />
                          <span>
                            {micro.label || micro.description || micro.action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {adaptiveCoachProfile && (
          <section className="ns-card mb-6 border border-white/10 bg-gradient-to-br from-[#0A1628]/80 to-[#111b34]/80">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                  Adaptive Coach Persona
                </p>
                <h2 className="text-2xl font-semibold text-white mt-2">
                  {adaptiveCoachProfile.persona}
                </h2>
                {adaptiveCoachProfile.personaTagline && (
                  <p className="text-white/60 text-sm mt-1">
                    {adaptiveCoachProfile.personaTagline}
                  </p>
                )}
                {adaptiveCoachProfile.summary && (
                  <p className="text-white/70 text-sm mt-2 max-w-2xl">
                    {adaptiveCoachProfile.summary}
                  </p>
                )}
              </div>
              <div className="bg-white/5 rounded-2xl px-4 py-3 min-w-[220px]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Primary Focus
                </p>
                <div className="text-white font-semibold text-lg mt-1">
                  {adaptiveCoachProfile.focusAreaLabel}
                </div>
                <p className="text-white/60 text-xs mt-1">
                  Gap pressure:&#160;
                  {Math.round(
                    (adaptiveCoachProfile.comBDeficits?.[
                      adaptiveCoachProfile.focusArea
                    ] || 0) * 100
                  )}
                  %
                </p>
              </div>
            </div>
            {adaptiveCoachProfile.priorityPillars?.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {adaptiveCoachProfile.priorityPillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    className="bg-white/5 border border-white/5 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{pillar.name}</span>
                      {pillar.intensity && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          {pillar.intensity}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold mt-1">
                      Focus: {pillar.focusArea}
                    </div>
                    {pillar.summary && (
                      <p className="text-white/70 text-sm mt-1">
                        {pillar.summary}
                      </p>
                    )}
                    {pillar.alert?.severityLabel && (
                      <p className="text-xs text-white/50 mt-2">
                        Psychometric: {pillar.alert.label} (
                        {pillar.alert.severityLabel})
                      </p>
                    )}
                    {pillar.microActions?.length > 0 && (
                      <ul className="mt-2 text-xs text-white/60 space-y-1">
                        {pillar.microActions.slice(0, 2).map((micro) => (
                          <li key={micro.id}>
                            • {micro.label || micro.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            {adaptiveCoachProfile.alerts?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                {adaptiveCoachProfile.alerts.map((alert) => (
                  <span
                    key={alert.id}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10"
                  >
                    {alert.label}: {alert.severityLabel || "elevated"}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {isTrial && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-md border border-green-500/40 rounded-2xl p-4 mb-6 mt-6 text-center">
            <p className="text-white text-sm">
              🎉 Free Trial:{" "}
              <span className="font-bold text-green-400">
                {typeof daysRemaining === "number"
                  ? daysRemaining
                  : subscription?.trialEndsAt
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(subscription.trialEndsAt) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0}{" "}
                days left
              </span>
            </p>
            {subscription?.trialEndsAt && (
              <p className="text-xs text-white/60 mt-1">
                Ends {format(new Date(subscription.trialEndsAt), "PPP")}
              </p>
            )}
          </div>
        )}

        {/* STREAK DISPLAY - Prominent position */}
        <div className="mb-8">
          <StreakDisplay streak={streak} user={user} />
          {/* Minimal badges row */}
          <div className="mt-3 flex items-center gap-2">
            {(user?.badges || []).length > 0 ? (
              (user.badges || []).slice(0, 6).map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 text-sm"
                >
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span>{b.replace(/_/g, " ")}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/60">
                No badges yet — keep logging to earn badges!
              </div>
            )}
          </div>
        </div>

        {/* Life Constellation Orb */}
        <div className="flex justify-center mb-12 mt-8">
          <ScoreOrb
            lifeScore={accessibleLifeScore}
            pillarScores={accessiblePillarScores}
          />
        </div>

        {/* Life Score Display */}
        <div className="text-center mb-8">
          <div
            className="inline-block bg-[#1a1f35] border border-white/20 rounded-2xl px-8 py-4"
            style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.3)" }}
          >
            <div className="text-5xl font-bold text-[#F4D03F] mb-1">
              {accessibleLifeScore}/100
            </div>
            <div className="text-white/80 text-sm font-medium">
              Your Life Score
            </div>
            <div className="text-white/60 text-xs mt-1">
              {hasFullAccess
                ? "Average of 8 life pillars"
                : `Average of ${accessiblePillars.length} selected pillars`}
            </div>
          </div>
        </div>

        <AIErrorBoundary showHelp={true}>
          <AIInsights
            entries={entries}
            lifeScore={accessibleLifeScore}
            pillarScores={accessiblePillarScores}
            accessiblePillars={accessiblePillars}
            plans={plans}
            user={user}
          />
        </AIErrorBoundary>

        {/* Talk to NorthStar */}
        <div className="my-8">
          <CoachPanel
            label="Talk to NorthStar"
            path="coach"
            body={coachPanelBody}
          />
          <div className="mt-2 text-right">
            <Link
              to="/weekly-report"
              className="text-sm text-blue-300 hover:underline"
            >
              View Weekly Report
            </Link>
          </div>
        </div>

        {/* Mood Check-in Widget */}
        {recentMood && (
          <div
            className="bg-gradient-to-br from-[#4CC9F0]/20 to-[#7C3AED]/20 border border-[#4CC9F0]/40 rounded-2xl p-5 mb-6"
            style={{ boxShadow: "0 0 25px rgba(76, 201, 240, 0.3)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#4CC9F0]/30 flex items-center justify-center">
                  <Smile className="w-7 h-7 text-[#4CC9F0]" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Latest Mood Check</h3>
                  <p className="text-white/70 text-sm">
                    {format(new Date(recentMood.timestamp), "h:mm a")} • Mood:{" "}
                    {recentMood.moodScore}/100
                  </p>
                  {recentMood.emotions && recentMood.emotions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {recentMood.emotions.slice(0, 3).map((emotion) => (
                        <span
                          key={emotion}
                          className="px-2 py-0.5 bg-[#4CC9F0]/30 text-[#4CC9F0] text-xs rounded-full"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Link
                to={createPageUrl("MoodTracker")}
                className="text-[#4CC9F0] hover:text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        )}

        {/* Active Plans, Goals & Habits Widget */}
        <div className="mb-8">
          <ActiveItemsWidget plans={plans} goals={goals} habits={habits} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            className="bg-[#1a1f35] border border-white/20 rounded-xl p-4"
            style={{ boxShadow: "0 0 15px rgba(212, 175, 55, 0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-white/70 text-sm font-medium">
                Strongest
              </span>
            </div>
            <div className="text-white font-bold">{strongest.name}</div>
            <div className="text-[#F4D03F] text-xl font-bold">
              {strongest.score}
            </div>
          </div>

          <div
            className="bg-[#1a1f35] border border-white/20 rounded-xl p-4"
            style={{ boxShadow: "0 0 15px rgba(255, 107, 53, 0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-white/70 text-sm font-medium">
                Focus On
              </span>
            </div>
            <div className="text-white font-bold">{weakest.name}</div>
            <div className="text-[#FF6B35] text-xl font-bold">
              {weakest.score}
            </div>
          </div>

          <div
            className="bg-[#1a1f35] border border-white/20 rounded-xl p-4"
            style={{ boxShadow: "0 0 15px rgba(76, 201, 240, 0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              {weeklyChange >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className="text-white/70 text-sm font-medium">
                This Week
              </span>
            </div>
            <div className="text-white font-bold">
              {weeklyChange >= 0 ? "+" : ""}
              {weeklyChange} points
            </div>
            <div className="text-white/60 text-xs">vs last week</div>
          </div>

          <div
            className="bg-[#1a1f35] border border-white/20 rounded-xl p-4"
            style={{ boxShadow: "0 0 15px rgba(124, 58, 237, 0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📝</span>
              <span className="text-white/70 text-sm font-medium">
                Total Logs
              </span>
            </div>
            <div className="text-white font-bold">All Time</div>
            <div className="text-[#7C3AED] text-xl font-bold">
              {user?.total_check_ins || entries.length}
            </div>
          </div>
        </div>

        {/* Pillar Quick Access */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>Your Pillars</span>
            <span className="text-white/60 text-sm font-normal">
              Tap to track or view
            </span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PILLARS_ARRAY.map((pillar) => {
              // prefer server pillar score for current value/trend when available
              const serverP = pillarScoreMap[pillar.id];
              const score = serverP
                ? serverP.score
                : todayLoggedPillarScores[pillar.id] || 0;
              const trend = serverP ? serverP.trend : "stable";
              const status =
                score >= 75
                  ? "🌟"
                  : score >= 50
                  ? "👍"
                  : score > 0
                  ? "📈"
                  : "🎯";
              const hasAccess =
                hasFullAccess || allowedPillarsIds.includes(pillar.id);
              const isLoggedToday = pillarsLoggedToday.includes(pillar.id);
              const pillarStreak = streak.pillarStreaks[pillar.id] || 0;

              const CardWrapper = hasAccess ? Link : "div";
              const wrapperProps = hasAccess
                ? { to: createPageUrl("Track") + `?pillar=${pillar.id}` }
                : {};

              return (
                <CardWrapper
                  key={pillar.id}
                  {...wrapperProps}
                  className={`bg-[#1a1f35] border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-all duration-200 hover:-translate-y-1 relative ${
                    !hasAccess ? "opacity-60" : ""
                  }`}
                  style={{ boxShadow: `0 0 15px ${pillar.color}40` }}
                >
                  {!hasAccess && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
                      <div className="text-center text-white">
                        <div className="text-2xl mb-2">🔒</div>
                        <div className="font-bold">
                          Upgrade to unlock this pillar
                        </div>
                      </div>
                    </div>
                  )}
                  {hasAccess && isLoggedToday && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                      style={{ boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)" }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {hasAccess && pillarStreak > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-bold text-orange-400">
                        {pillarStreak}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{pillar.icon}</span>
                    <span className="text-xl">{status}</span>
                  </div>
                  <div className="text-white font-bold text-sm mb-1">
                    {pillar.name}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: pillar.color }}
                    >
                      {hasAccess ? score : "–"}
                    </span>
                    {hasAccess && (
                      <span className="text-white/60 text-sm">/100</span>
                    )}
                    {hasAccess && (
                      <span className="text-sm ml-2" style={{ opacity: 0.9 }}>
                        {trend === "improving"
                          ? "📈"
                          : trend === "declining"
                          ? "📉"
                          : "➖"}
                      </span>
                    )}
                  </div>
                  {!hasAccess && (
                    <div className="mt-3 flex justify-center z-0">
                      <a
                        href="/pricing"
                        className="px-3 py-1 bg-yellow-400 rounded font-bold text-sm"
                      >
                        Upgrade
                      </a>
                    </div>
                  )}
                </CardWrapper>
              );
            })}
          </div>

          {!hasFullAccess && (
            <div className="mt-4 text-center">
              <p className="text-white/60 text-sm">
                🔒 Unlock {8 - accessiblePillars.length} more pillars with
                Premium
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div
          className="text-center bg-[#1a1f35] border border-white/20 rounded-2xl p-8"
          style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.2)" }}
        >
          <h3 className="text-2xl font-bold text-white mb-2">
            Start Today&apos;s Journey
          </h3>
          <p className="text-white/70 mb-6">
            Track a pillar, view insights, or chat with your AI coach
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={createPageUrl("Analytics")}
              className="px-6 py-3 bg-[#1a1f35] border border-white/20 rounded-xl text-white font-bold hover:bg-white/5 transition-all inline-flex items-center justify-center"
            >
              View Analytics 📊
            </Link>
            <Link
              to={createPageUrl("CoachSelect")}
              className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-xl text-[#0A1628] font-bold hover:shadow-lg transition-all inline-flex items-center justify-center"
              style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
            >
              Talk to Coach 💬
            </Link>
          </div>
        </div>
      </div>

      {/* Guided Tour */}
      {showTour && (
        <ErrorBoundary>
          <GuidedTour
            onComplete={handleTourComplete}
            onSkip={() => setShowTour(false)}
          />
        </ErrorBoundary>
      )}

      {/* Milestone Celebration */}
      {celebrationMilestone && (
        <MilestoneCelebration
          milestone={celebrationMilestone}
          onClose={() => setCelebrationMilestone(null)}
        />
      )}
    </div>
  );
}

DashboardContent.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    full_name: PropTypes.string,
    fullName: PropTypes.string,
    displayName: PropTypes.string,
    raw: PropTypes.shape({
      displayName: PropTypes.string,
    }),
    behavior_profile: PropTypes.object,
    behaviorProfile: PropTypes.object,
    onboarding_profile: PropTypes.object,
    com_b_scores: PropTypes.object,
    comB: PropTypes.object,
    motivation_score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    opportunity_score: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
    capability_score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tour_completed: PropTypes.bool,
    onboarding_completed: PropTypes.bool,
    streak_milestones_awarded: PropTypes.object,
    points: PropTypes.number,
    last_points_calculation: PropTypes.string,
    last_celebrated_milestone: PropTypes.number,
    longest_streak: PropTypes.number,
    freeze_reset_month: PropTypes.number,
    streak_freezes_available: PropTypes.number,
    selected_pillars: PropTypes.arrayOf(PropTypes.string),
    allowedPillars: PropTypes.arrayOf(PropTypes.string),
    badges: PropTypes.array,
    total_check_ins: PropTypes.number,
  }),
};

export default function Dashboard() {
  return (
    <AuthGuard>
      {(user) => (
        <ErrorBoundary>
          <DashboardContent user={user} />
        </ErrorBoundary>
      )}
    </AuthGuard>
  );
}
