import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wind,
  Plus,
  Sparkles,
  TrendingUp,
  Calendar,
  Heart,
  Target,
  CheckCircle2,
  Award,
  Flame,
  Clock,
  Brain,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  differenceInHours,
  differenceInDays,
  startOfMonth,
} from "date-fns";
import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import CircularProgress from "@/components/shared/CircularProgress";
import MilestonesSection from "@/components/shared/MilestonesSection";
import MeditationPlayer from "@/components/shared/MeditationPlayer";
import MeditationLogger from "@/components/shared/MeditationLogger";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PILLAR = {
  id: "meditation",
  name: "Meditation",
  color: "#7C3AED",
  icon: "🧘",
};

export default function Meditation() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showLogger, setShowLogger] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: sessions = [] } = useQuery({
    queryKey: ["meditationSessions", user?.email],
    queryFn: () =>
      api.getMeditationLogs({ userId: user?.email }, "-timestamp", 100),
    enabled: !!user,
    initialData: [],
  });

  const saveSessionMutation = useMutation({
    mutationFn: (data) =>
      api.logMeditation({
        userId: user.email,
        date: today,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meditationSessions", user?.email],
      });
      setShowLogger(false);
      toast.success("Meditation logged! 🧘");
    },
  });

  if (!user) return null;

  const recentSessions = sessions.slice(0, 7);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgCalmImprovement =
    recentSessions.length > 0
      ? Math.round(
          (recentSessions.reduce(
            (sum, s) => sum + ((s.calmAfter || 0) - (s.calmBefore || 0)),
            0
          ) /
            recentSessions.length) *
            10
        ) / 10
      : 0;

  const meditationStreak = (() => {
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasSession = sessions.some((s) => s.date === dateStr);

      if (hasSession) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  })();

  const avgFocusQuality =
    recentSessions.length > 0
      ? Math.round(
          (recentSessions.reduce((sum, s) => sum + (s.focusQuality || 0), 0) /
            recentSessions.length) *
            10
        ) / 10
      : 0;

  const latestSession = sessions.length > 0 ? sessions[0] : null;
  const hoursAgo = latestSession
    ? Math.round(
        differenceInHours(new Date(), new Date(latestSession.timestamp))
      )
    : null;

  // 14-day calm improvement trend
  const calmTrendData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const dateStr = format(date, "yyyy-MM-dd");
    const daySessions = sessions.filter((s) => s.date === dateStr);
    const avgImprovement =
      daySessions.length > 0
        ? daySessions.reduce(
            (sum, s) => sum + ((s.calmAfter || 0) - (s.calmBefore || 0)),
            0
          ) / daySessions.length
        : null;

    return {
      date: format(date, "MMM d"),
      improvement: avgImprovement,
      sessions: daySessions.length,
    };
  });

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const thisMonthSessions = sessions.filter((s) => s.date >= monthStart);
  const thisMonthMinutes = thisMonthSessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0
  );

  const milestones = [
    meditationStreak >= 7 && {
      id: "meditation-streak",
      type: "streak",
      icon: Flame,
      title: `${meditationStreak} Day Streak`,
      description: "Daily meditation practice",
      value: `${meditationStreak}🔥`,
      color: "#FF5733",
      isNew: meditationStreak <= 14,
    },
    totalMinutes >= 100 && {
      id: "total-minutes",
      type: "achievement",
      icon: Clock,
      title: "Meditation Master",
      description: "Total minutes meditated",
      value: `${totalMinutes} min`,
      color: "#7C3AED",
      isNew: false,
    },
    thisMonthMinutes >= 200 && {
      id: "monthly-dedication",
      type: "award",
      icon: Award,
      title: "Monthly Dedication",
      description: `${thisMonthMinutes} minutes this month`,
      value: `${thisMonthSessions.length} sessions`,
      color: "#52B788",
      date: format(new Date(), "MMM yyyy"),
      isNew: true,
    },
  ].filter(Boolean);

  const atAGlanceMetrics = [
    {
      icon: <Flame />,
      label: "Meditation Streak",
      value: meditationStreak,
      subtitle: "day" + (meditationStreak !== 1 ? "s" : ""),
      trend:
        meditationStreak >= 7
          ? "up"
          : meditationStreak >= 3
          ? "stable"
          : "down",
      lastUpdated: hoursAgo ? `${hoursAgo}h ago` : "No sessions",
      message:
        meditationStreak === 0
          ? "🧘 Start your meditation journey today"
          : null,
    },
    {
      icon: <Sparkles />,
      label: "Calm Improvement",
      value: avgCalmImprovement > 0 ? `+${avgCalmImprovement}` : "—",
      subtitle: "avg increase (7d)",
      progress: Math.max(0, avgCalmImprovement * 20),
      trend:
        avgCalmImprovement >= 2
          ? "up"
          : avgCalmImprovement >= 1
          ? "stable"
          : "down",
    },
    {
      icon: <Target />,
      label: "Focus Quality",
      value: avgFocusQuality > 0 ? `${avgFocusQuality}/10` : "—",
      subtitle: "average (7d)",
      progress: avgFocusQuality * 10,
      trend: avgFocusQuality >= 7 ? "up" : "stable",
    },
  ];

  const recentActivityData = sessions.slice(0, 5).map((s) => {
    const calmChange = (s.calmAfter || 0) - (s.calmBefore || 0);

    return {
      id: s.id,
      type: "session",
      icon: Wind,
      title:
        s.guidedSessionName || `${s.technique.replace("_", " ")} Meditation`,
      summary: `${s.duration} min • Calm: ${s.calmBefore}→${s.calmAfter} (+${calmChange})`,
      timestamp: s.timestamp,
      color:
        calmChange >= 3 ? "#52B788" : calmChange >= 1 ? "#4CC9F0" : "#7C3AED",
      badges: [
        { text: `${s.duration} min`, color: "#7C3AED" },
        { text: s.technique.replace("_", " "), color: "#4CC9F0" },
        ...(calmChange >= 3
          ? [{ text: `+${calmChange} calm`, color: "#52B788" }]
          : []),
      ],
      data: s,
    };
  });

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
  };

  const stats = [
    {
      icon: <Wind className="w-4 h-4" />,
      label: "Sessions",
      value: sessions.length,
      subtitle: "total",
      color: "#7C3AED",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Total Time",
      value: totalMinutes,
      subtitle: "minutes",
      color: "#4CC9F0",
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Streak",
      value: meditationStreak,
      subtitle: "days",
      color: "#FF5733",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Avg Calm ↑",
      value: avgCalmImprovement > 0 ? `+${avgCalmImprovement}` : "—",
      subtitle: "increase",
      color: "#52B788",
    },
  ];

  return (
    <PillarPage
      pillar={PILLAR}
      title="Meditation Practice"
      subtitle="Build mindfulness and inner peace"
      stats={stats}
    >
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      <MilestonesSection
        milestones={milestones}
        color={PILLAR.color}
        title="Meditation Achievements"
        compact={true}
      />

      {/* Quick Start Meditation */}
      <div className="mb-6">
        <button
          onClick={() => setShowPlayer(true)}
          className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D2FDD] hover:to-[#9845E7] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-3 group"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}40` }}
        >
          <Wind className="w-6 h-6 group-hover:animate-pulse" />
          <span className="text-lg">Start Guided Meditation</span>
          <div className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
            5-20 min
          </div>
        </button>
      </div>

      {/* Calm Improvement Trend */}
      {calmTrendData.some((d) => d.improvement !== null) && (
        <div
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: PILLAR.color }} />
            Calm Level Improvement (14 Days)
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={calmTrendData}>
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: "11px" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[-3, 5]}
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
                formatter={(value) => [`+${value}`, "Calm Change"]}
              />
              <Line
                type="monotone"
                dataKey="improvement"
                stroke={PILLAR.color}
                strokeWidth={3}
                dot={{ fill: PILLAR.color, r: 5 }}
                activeDot={{ r: 7, fill: "#52B788" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="text-center text-white/60 text-sm mt-2">
            {calmTrendData.filter((d) => d.sessions > 0).length} of 14 days
            practiced
          </div>
        </div>
      )}

      {/* Meditation Progress Rings */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
        style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
      >
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: PILLAR.color }} />
          Meditation Metrics
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          <CircularProgress
            value={recentSessions.length}
            max={7}
            size={140}
            strokeWidth={10}
            color={PILLAR.color}
            label={`${recentSessions.length}/7 days`}
            subtitle="This week"
            showPercentage={false}
            icon={<Calendar />}
          />

          <CircularProgress
            value={avgFocusQuality}
            max={10}
            size={140}
            strokeWidth={10}
            color="#4CC9F0"
            label="Focus Quality"
            subtitle="Average (7d)"
            showPercentage={false}
            icon={<Brain />}
          />

          <CircularProgress
            value={meditationStreak}
            max={Math.max(meditationStreak, 30)}
            size={140}
            strokeWidth={10}
            color="#FF5733"
            label={`${meditationStreak} days`}
            subtitle="Current streak"
            showPercentage={false}
            icon={<Flame />}
          />
        </div>
      </div>

      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No meditation sessions yet"
        emptyIcon={Wind}
        emptyAction={
          <Button
            onClick={() => setShowPlayer(true)}
            className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start First Session
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard
          icon={Wind}
          title="Guided Meditation"
          description="5-20 minute sessions"
          stats={`${
            sessions.filter((s) => s.durationType === "guided").length
          } completed`}
          color={PILLAR.color}
          onClick={() => setShowPlayer(true)}
        />
        <ActionCard
          icon={Clock}
          title="Timed Practice"
          description="Custom duration"
          stats={`${totalMinutes} total minutes`}
          color="#4CC9F0"
          onClick={() => setShowLogger(true)}
        />
      </div>

      {showLogger && (
        <MeditationLogger
          onClose={() => setShowLogger(false)}
          onSave={(data) => saveSessionMutation.mutateAsync(data)}
        />
      )}

      {showPlayer && (
        <MeditationPlayer
          onClose={() => setShowPlayer(false)}
          onComplete={(data) => saveSessionMutation.mutateAsync(data)}
        />
      )}

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          color={PILLAR.color}
          icon={Wind}
          title="Meditation Session"
          fields={[
            {
              key: "duration",
              label: "Duration",
              icon: Clock,
              color: "#7C3AED",
              unit: " min",
            },
            {
              key: "technique",
              label: "Technique",
              icon: Sparkles,
              color: "#4CC9F0",
              render: (value) => (
                <span className="text-lg capitalize text-white/90">
                  {value.replace("_", " ")}
                </span>
              ),
            },
            {
              key: "calmBefore",
              label: "Calm Before",
              icon: Brain,
              color: "#FFD700",
              unit: "/10",
            },
            {
              key: "calmAfter",
              label: "Calm After",
              icon: Heart,
              color: "#52B788",
              unit: "/10",
            },
            {
              key: "focusQuality",
              label: "Focus Quality",
              icon: Target,
              color: "#4CC9F0",
              unit: "/10",
            },
            {
              key: "mood",
              label: "Mood After",
              icon: Heart,
              color: "#FF69B4",
              render: (value) => (
                <span className="text-lg capitalize text-white/90">
                  {value}
                </span>
              ),
            },
            {
              key: "distractions",
              label: "Distractions",
              icon: AlertCircle,
              color: "#FF5733",
            },
            {
              key: "insights",
              label: "Insights",
              icon: Sparkles,
              color: "#FFD700",
            },
          ]}
        />
      )}
    </PillarPage>
  );
}
