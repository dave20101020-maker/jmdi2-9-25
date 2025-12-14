import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import CircularProgress from "@/components/shared/CircularProgress";
import MilestonesSection from "@/components/shared/MilestonesSection";
import PillarTip from "@/components/shared/PillarTip";
import AIContentButtons from "@/ai/AIContentButtons";
import { getTipsForPillar } from "@/utils/pillarTips";
import SleepJournalEntry from "@/components/shared/SleepJournalEntry";
import RoutineBuilder from "@/components/shared/RoutineBuilder";
import EnvironmentAudit from "@/components/shared/EnvironmentAudit";
import {
  Moon,
  Plus,
  BookOpen,
  Clock,
  BedDouble,
  CheckCircle2,
  Flame,
  TrendingUp,
  Sparkles,
  Target,
  Sun,
  Thermometer,
  Volume2,
  Wind,
  Award,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  subDays,
  startOfWeek,
  differenceInHours,
  addDays,
  startOfMonth,
  differenceInDays,
} from "date-fns";
import { PILLARS } from "@/utils";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PILLAR = PILLARS.sleep;

const AUDIT_FACTORS = [
  { key: "darkness", label: "Darkness", icon: Sun, color: "#6B46C1" },
  {
    key: "temperature",
    label: "Temperature",
    icon: Thermometer,
    color: "#FF5733",
  },
  { key: "noise", label: "Noise", icon: Volume2, color: "#4CC9F0" },
  {
    key: "mattressComfort",
    label: "Comfort",
    icon: BedDouble,
    color: "#52B788",
  },
  { key: "airQuality", label: "Air Quality", icon: Wind, color: "#7C3AED" },
];

export default function Sleep() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalType, setDetailModalType] = useState(null);

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const { data: sleepEntries = [] } = useQuery({
    queryKey: ["sleepEntries", user?.email],
    queryFn: () =>
      api.getEntries(
        {
          created_by: user?.email,
          pillar: "sleep",
        },
        "-date",
        100
      ),
    enabled: !!user,
    initialData: [],
  });

  const { data: journals = [] } = useQuery({
    queryKey: ["sleepJournals", user?.email],
    queryFn: () => api.getSleepJournals({ userId: user?.email }, "-date", 50),
    enabled: !!user,
    initialData: [],
  });

  const { data: routines = [] } = useQuery({
    queryKey: ["bedtimeRoutines", user?.email],
    queryFn: () =>
      api.getBedtimeRoutines({ userId: user?.email }, "-created_date", 20),
    enabled: !!user,
    initialData: [],
  });

  const { data: audits = [] } = useQuery({
    queryKey: ["sleepAudits", user?.email],
    queryFn: () =>
      api.getSleepEnvironmentAudits({ userId: user?.email }, "-date", 20),
    enabled: !!user,
    initialData: [],
  });

  const saveJournalMutation = useMutation({
    mutationFn: (data) =>
      api.createSleepJournal({
        userId: user.email,
        date: format(new Date(), "yyyy-MM-dd"),
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sleepJournals", user?.email],
      });
      setShowJournalModal(false);
    },
  });

  const saveRoutineMutation = useMutation({
    mutationFn: (data) => {
      if (editingRoutine) {
        return api.updateBedtimeRoutine(editingRoutine.id, data);
      }
      return api.createBedtimeRoutine({
        userId: user.email,
        adherenceDates: [],
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bedtimeRoutines", user?.email],
      });
      setShowRoutineModal(false);
      setEditingRoutine(null);
    },
  });

  const updateRoutineMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateBedtimeRoutine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bedtimeRoutines", user?.email],
      });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: (id) => api.deleteBedtimeRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bedtimeRoutines", user?.email],
      });
      toast.success("Routine deleted");
    },
  });

  const saveAuditMutation = useMutation({
    mutationFn: (data) =>
      api.createSleepEnvironmentAudit({
        userId: user.email,
        date: format(new Date(), "yyyy-MM-dd"),
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleepAudits", user?.email] });
      setShowAuditModal(false);
    },
  });

  const handleToggleRoutineAdherence = (routine) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const adherenceDates = routine.adherenceDates || [];
    const isFollowedToday = adherenceDates.includes(today);

    let newAdherenceDates;
    let newStreak = routine.currentStreak || 0;
    let newTotal = routine.totalFollowed || 0;
    let newBestStreak = routine.bestStreak || 0;

    if (isFollowedToday) {
      newAdherenceDates = adherenceDates.filter((d) => d !== today);
      newStreak = Math.max(0, newStreak - 1);
      newTotal = Math.max(0, newTotal - 1);
    } else {
      newAdherenceDates = [...adherenceDates, today];
      newTotal = newTotal + 1;

      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (adherenceDates.includes(yesterday)) {
        newStreak = newStreak + 1;
      } else {
        newStreak = 1;
      }

      newBestStreak = Math.max(newBestStreak, newStreak);
      toast.success(
        `Routine followed — momentum: ${newStreak} day${
          newStreak !== 1 ? "s" : ""
        }`
      );
    }

    updateRoutineMutation.mutate({
      id: routine.id,
      data: {
        adherenceDates: newAdherenceDates,
        currentStreak: newStreak,
        totalFollowed: newTotal,
        bestStreak: newBestStreak,
      },
    });
  };

  if (!user) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const recentEntries = sleepEntries.slice(0, 7);
  const avgSleepHours =
    recentEntries.length > 0
      ? Math.round(
          (recentEntries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) /
            recentEntries.length) *
            10
        ) / 10
      : 0;
  const avgQuality =
    recentEntries.length > 0
      ? Math.round(
          (recentEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) /
            recentEntries.length) *
            10
        ) / 10
      : 0;

  const activeRoutines = routines.filter((r) => r.isActive);
  const latestAudit = audits.length > 0 ? audits[0] : null;

  const routinesFollowedToday = activeRoutines.filter((r) =>
    r.adherenceDates?.includes(today)
  ).length;

  const latestEntry = sleepEntries.length > 0 ? sleepEntries[0] : null;
  const hoursAgo = latestEntry
    ? Math.round(
        differenceInHours(
          new Date(),
          new Date(latestEntry.updated_date || latestEntry.created_date)
        )
      )
    : null;

  const qualityTrend =
    sleepEntries.length >= 2
      ? (sleepEntries[0].sleep_quality || 0) >
        (sleepEntries[1].sleep_quality || 0)
        ? "up"
        : (sleepEntries[0].sleep_quality || 0) <
          (sleepEntries[1].sleep_quality || 0)
        ? "down"
        : "stable"
      : "stable";

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const thisMonthEntries = sleepEntries.filter((e) => e.date >= monthStart);
  const bestMonthScore =
    thisMonthEntries.length > 0
      ? Math.max(...thisMonthEntries.map((e) => e.score || 0))
      : 0;

  const perfectNights = thisMonthEntries.filter(
    (e) => e.sleep_hours >= 7 && e.sleep_hours <= 9 && e.sleep_quality >= 8
  ).length;

  const bestRoutineStreak =
    activeRoutines.length > 0
      ? Math.max(...activeRoutines.map((r) => r.bestStreak || 0))
      : 0;

  const recentAuditScore = latestAudit?.overallScore || 0;

  const sleepTrendData = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const entry = sleepEntries.find((e) => e.date === dateStr);
    return {
      date: format(date, "MMM d"),
      hours: entry?.sleep_hours || null,
      quality: entry?.sleep_quality || null,
    };
  });

  const milestones = [
    bestMonthScore >= 80 && {
      id: "best-score",
      type: "achievement",
      icon: Award,
      title: "Best Sleep Score",
      description: "Highest score this month",
      value: bestMonthScore,
      color: PILLAR.color,
      date: format(new Date(), "MMM yyyy"),
      isNew: thisMonthEntries[0]?.score === bestMonthScore,
    },
    perfectNights >= 3 && {
      id: "perfect-nights",
      type: "streak",
      icon: Moon,
      title: `${perfectNights} Perfect Nights`,
      description: "7-9h sleep with 8+ quality",
      value: `${perfectNights}🌟`,
      color: "#9370DB",
      date: "This month",
      isNew: perfectNights >= 7,
    },
    bestRoutineStreak >= 7 && {
      id: "routine-master",
      type: "streak",
      icon: Flame,
      title: "Routine Master",
      description: "Best bedtime routine streak",
      value: `${bestRoutineStreak} days`,
      color: "#FF5733",
      isNew: activeRoutines.some((r) => r.currentStreak === bestRoutineStreak),
    },
    recentAuditScore >= 85 && {
      id: "optimal-environment",
      type: "award",
      icon: Sparkles,
      title: "Optimal Environment",
      description: "Sleep environment score",
      value: `${recentAuditScore}/100`,
      color: "#52B788",
      date: latestAudit ? format(new Date(latestAudit.date), "MMM d") : null,
      isNew:
        differenceInHours(
          new Date(),
          new Date(latestAudit?.created_date || new Date())
        ) <= 48,
    },
  ].filter(Boolean);

  const atAGlanceMetrics = [
    {
      icon: <Moon />,
      label: "Avg Sleep (7 days)",
      value: `${avgSleepHours}h`,
      subtitle: "per night",
      trend: avgSleepHours >= 7 ? "up" : avgSleepHours >= 6 ? "stable" : "down",
      lastUpdated: hoursAgo ? `${hoursAgo}h ago` : "No data",
      message:
        avgSleepHours < 6
          ? "😴 Try to get more sleep - aim for 7-9h"
          : avgSleepHours >= 7 && avgSleepHours <= 9
          ? "✨ You're in the optimal range!"
          : null,
    },
    {
      icon: <Sparkles />,
      label: "Sleep Quality",
      value: avgQuality > 0 ? `${avgQuality}/10` : "—",
      subtitle: "average rating",
      trend: qualityTrend,
      progress: avgQuality * 10,
    },
    {
      icon: <CheckCircle2 />,
      label: "Routine Adherence",
      value: routinesFollowedToday,
      subtitle: `of ${activeRoutines.length} today`,
      progress:
        activeRoutines.length > 0
          ? (routinesFollowedToday / activeRoutines.length) * 100
          : 0,
      message:
        routinesFollowedToday === activeRoutines.length &&
        activeRoutines.length > 0
          ? "🌟 All routines followed today!"
          : activeRoutines.length === 0
          ? "Create a routine to track consistency"
          : null,
    },
  ];

  const recentActivityData = [
    ...journals.slice(0, 2).map((j) => ({
      id: j.id,
      type: "journal",
      icon: BookOpen,
      title: "Sleep Journal",
      summary: j.dreams
        ? `Dreamed: "${j.dreams.substring(0, 60)}${
            j.dreams.length > 60 ? "..." : ""
          }"`
        : `Quality: ${j.sleepQuality}/10`,
      timestamp: j.date,
      color: "#9370DB",
      badges: [
        { text: `Quality ${j.sleepQuality}/10`, color: "#9370DB" },
        ...(j.wokeUpFeeling
          ? [{ text: j.wokeUpFeeling, color: "#4CC9F0" }]
          : []),
      ],
      data: j,
    })),
    ...sleepEntries.slice(0, 2).map((e) => ({
      id: e.id,
      type: "entry",
      icon: Moon,
      title: "Sleep Logged",
      summary: `${e.sleep_hours}h sleep with ${e.sleep_quality}/10 quality`,
      timestamp: e.date,
      color: PILLAR.color,
      badges: [
        { text: `${e.sleep_hours}h`, color: PILLAR.color },
        { text: `Quality ${e.sleep_quality}/10`, color: "#7C3AED" },
      ],
      data: e,
    })),
    ...audits.slice(0, 1).map((a) => ({
      id: a.id,
      type: "audit",
      icon: BedDouble,
      title: "Environment Audit",
      summary: `Overall score: ${a.overallScore}/100`,
      timestamp: a.date,
      color: "#52B788",
      badges: [
        {
          text: `Score ${a.overallScore}`,
          color:
            a.overallScore >= 80
              ? "#52B788"
              : a.overallScore >= 60
              ? "#FFD700"
              : "#FF5733",
        },
      ],
      data: a,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  const stats = [
    {
      icon: <Moon className="w-4 h-4" />,
      label: "Avg Hours",
      value: avgSleepHours,
      subtitle: "per night",
      color: PILLAR.color,
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Avg Quality",
      value: avgQuality,
      subtitle: "/10",
      color: "#7C3AED",
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Journals",
      value: journals.length,
      subtitle: "entries",
      color: "#9370DB",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Routines",
      value: activeRoutines.length,
      subtitle: "active",
      color: "#52B788",
    },
  ];

  return (
    <PillarPage
      pillar={PILLAR}
      title="Sleep Hub"
      subtitle="Track, journal, and optimize your sleep"
      stats={stats}
    >
      <AIContentButtons
        pillar="sleep"
        pillarName="Sleep"
        color={PILLAR.color}
      />

      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      <MilestonesSection
        milestones={milestones}
        color={PILLAR.color}
        title="Sleep Achievements"
        compact={true}
      />

      <PillarTip
        tips={getTipsForPillar("sleep")}
        color={PILLAR.color}
        icon={Sparkles}
        title="Sleep Pro Tip"
      />

      {/* NEW: 14-Day Sleep Trend */}
      {sleepTrendData.some((d) => d.hours !== null) && (
        <div
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: PILLAR.color }} />
            Sleep Patterns (14 Days)
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={sleepTrendData}>
              <defs>
                <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={PILLAR.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={PILLAR.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: "11px" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 10]}
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: "11px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1f35",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value, name) => {
                  if (name === "hours") return [`${value}h`, "Sleep"];
                  if (name === "quality") return [`${value}/10`, "Quality"];
                  return [value, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke={PILLAR.color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sleepGradient)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-white/60">Optimal Zone</div>
              <div className="text-white font-bold">7-9 hours</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-white/60">Nights Tracked</div>
              <div className="text-white font-bold">
                {sleepTrendData.filter((d) => d.hours !== null).length}/14
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Progress Rings */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
        style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
      >
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: PILLAR.color }} />
          Sleep Metrics This Week
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          <CircularProgress
            value={avgSleepHours}
            max={8}
            size={140}
            strokeWidth={10}
            color={PILLAR.color}
            label="Avg Hours"
            subtitle="Goal: 7-8h"
            showPercentage={false}
            icon={<Moon />}
          />

          <CircularProgress
            value={avgQuality}
            max={10}
            size={140}
            strokeWidth={10}
            color="#7C3AED"
            label="Avg Quality"
            subtitle="Last 7 days"
            showPercentage={false}
            icon={<Sparkles />}
          />

          {activeRoutines.length > 0 && (
            <CircularProgress
              value={activeRoutines.reduce(
                (sum, r) => sum + (r.currentStreak || 0),
                0
              )}
              max={activeRoutines.length * 7}
              size={140}
              strokeWidth={10}
              color="#52B788"
              label="Consistency"
              subtitle="Routine streaks"
              icon={<CheckCircle2 />}
            />
          )}
        </div>
      </div>

      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No sleep activity logged yet"
        emptyIcon={Moon}
        emptyAction={
          <Button
            onClick={() => setShowJournalModal(true)}
            className="bg-gradient-to-r from-[#6B46C1] to-purple-600 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Entry
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <ActionCard
          icon={BookOpen}
          title="Sleep Journal"
          description="Log dreams & disturbances"
          stats={`${journals.length} entries`}
          color="#9370DB"
          onClick={() => setShowJournalModal(true)}
        />
        <ActionCard
          icon={Clock}
          title="Bedtime Routine"
          description="Build consistent habits"
          stats={`${activeRoutines.length} active`}
          color="#4CC9F0"
          onClick={() => {
            setEditingRoutine(null);
            setShowRoutineModal(true);
          }}
        />
        <ActionCard
          icon={BedDouble}
          title="Environment Audit"
          description="Optimize your bedroom"
          stats={
            latestAudit
              ? `Score: ${latestAudit.overallScore}/100`
              : "Not audited"
          }
          color="#52B788"
          onClick={() => setShowAuditModal(true)}
        />
      </div>

      {/* Active Routines Overview */}
      {activeRoutines.length > 0 && (
        <DataCard
          title="Your Bedtime Routines"
          titleIcon={<Clock />}
          color="#4CC9F0"
        >
          <div className="space-y-3">
            {activeRoutines.slice(0, 2).map((routine) => {
              const isFollowedToday = routine.adherenceDates?.includes(today);

              return (
                <div
                  key={routine.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-bold">
                        {routine.routineName}
                      </h4>
                      <div className="text-white/60 text-xs flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {routine.targetBedtime}
                        <span>•</span>
                        <Flame className="w-3 h-3 text-orange-400" />
                        {routine.currentStreak || 0} day streak
                      </div>
                    </div>
                    <Button
                      onClick={() => handleToggleRoutineAdherence(routine)}
                      size="sm"
                      className={
                        isFollowedToday
                          ? "bg-green-500/20 text-green-400 border-2 border-green-500/60"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {isFollowedToday ? "Done" : "Mark"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {routine.steps?.slice(0, 3).map((step, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg"
                      >
                        {step.action}
                      </span>
                    ))}
                    {routine.steps?.length > 3 && (
                      <span className="text-white/40">
                        +{routine.steps.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DataCard>
      )}

      {/* Modals */}
      {showJournalModal && (
        <SleepJournalEntry
          onClose={() => setShowJournalModal(false)}
          onSave={(data) => saveJournalMutation.mutateAsync(data)}
        />
      )}

      {showRoutineModal && (
        <RoutineBuilder
          onClose={() => {
            setShowRoutineModal(false);
            setEditingRoutine(null);
          }}
          onSave={(data) => saveRoutineMutation.mutateAsync(data)}
          initialRoutine={editingRoutine}
        />
      )}

      {showAuditModal && (
        <EnvironmentAudit
          onClose={() => setShowAuditModal(false)}
          onSave={(data) => saveAuditMutation.mutateAsync(data)}
        />
      )}

      {selectedLog && detailModalType === "journal" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#9370DB"
          icon={BookOpen}
          title="Sleep Journal Entry"
          fields={[
            {
              key: "sleepQuality",
              label: "Sleep Quality",
              icon: Sparkles,
              color: "#9370DB",
              unit: "/10",
            },
            {
              key: "wokeUpFeeling",
              label: "Woke Up Feeling",
              icon: Sun,
              color: "#FFD700",
              render: (value) => (
                <span className="text-lg capitalize text-white/90">
                  {value}
                </span>
              ),
            },
            { key: "dreams", label: "Dreams", icon: Moon, color: "#6B46C1" },
            {
              key: "disturbances",
              label: "Disturbances",
              icon: Volume2,
              color: "#FF5733",
            },
          ]}
        />
      )}

      {selectedLog && detailModalType === "audit" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#52B788"
          icon={BedDouble}
          title="Sleep Environment Audit"
          fields={[
            {
              key: "overallScore",
              label: "Overall Score",
              icon: Target,
              color:
                selectedLog.overallScore >= 80
                  ? "#52B788"
                  : selectedLog.overallScore >= 60
                  ? "#FFD700"
                  : "#FF5733",
              unit: "/100",
            },
            ...AUDIT_FACTORS.map((factor) => ({
              key: factor.key,
              label: factor.label,
              icon: factor.icon,
              color: factor.color,
              unit: "/10",
            })),
            {
              key: "issuesIdentified",
              label: "Issues Identified",
              icon: AlertCircle,
              color: "#FF5733",
            },
            {
              key: "improvements",
              label: "Suggested Improvements",
              icon: Sparkles,
              color: "#4CC9F0",
            },
          ]}
        />
      )}

      {selectedLog && detailModalType === "entry" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color={PILLAR.color}
          icon={Moon}
          title="Sleep Log"
          fields={[
            {
              key: "sleep_hours",
              label: "Hours Slept",
              icon: Moon,
              color: PILLAR.color,
              unit: "h",
            },
            {
              key: "sleep_quality",
              label: "Sleep Quality",
              icon: Sparkles,
              color: "#7C3AED",
              unit: "/10",
            },
            {
              key: "score",
              label: "Overall Score",
              icon: Target,
              color: "#D4AF37",
              unit: "/100",
            },
          ]}
        />
      )}
    </PillarPage>
  );
}
