import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PILLARS } from "@/utils";
import {
  Brain,
  BookOpen,
  Wind,
  Lightbulb,
  Heart,
  TrendingUp,
  Sparkles,
  Plus,
  Quote,
} from "lucide-react"; // Added Quote
import { Button } from "@/components/ui/button";
import { format, differenceInDays, differenceInHours, subDays } from "date-fns"; // Added subDays
import GuidedJournal from "@/ai/GuidedJournal";
import ErrorBoundary from "@/components/ErrorBoundary";
import AIErrorBoundary from "@/components/AIErrorBoundary";
import BreathingExercise from "@/components/shared/BreathingExercise";
import ThoughtRecorder from "@/components/shared/ThoughtRecorder";
import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import PillarTip from "@/components/shared/PillarTip";
import { getTipsForPillar } from "@/utils/pillarTips";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"; // Added Recharts imports

const PILLAR = PILLARS.mental_health;

export default function MentalHealth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [showJournal, setShowJournal] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showThoughtRecorder, setShowThoughtRecorder] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalType, setDetailModalType] = useState(null);
  const [riskLogs, setRiskLogs] = useState([]);
  const [riskNote, setRiskNote] = useState("");
  const [riskSeverity, setRiskSeverity] = useState("medium");

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: journals = [] } = useQuery({
    queryKey: ["journalEntries", user?.email],
    queryFn: () => api.getJournals({ userId: user?.email }, "-date", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: thoughtRecords = [] } = useQuery({
    queryKey: ["thoughtRecords", user?.email],
    queryFn: () => api.getJournals({ userId: user?.email }, "-timestamp", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: moodEntries = [] } = useQuery({
    queryKey: ["moodEntries", user?.email],
    queryFn: () => api.getMoods({ userId: user?.email }, "-date", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: meditationLogs = [] } = useQuery({
    queryKey: ["mentalMeditations", user?.email],
    queryFn: () =>
      api.getMeditationLogs(
        {
          userId: user?.email,
          pillar: "mental_health",
        },
        "-created_date",
        100
      ),
    enabled: !!user,
    initialData: [],
  });

  const saveJournalMutation = useMutation({
    mutationFn: (data) =>
      api.createJournal({
        userId: user.email,
        date: today,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["journalEntries", user?.email],
      });
      setShowJournal(false);
    },
  });

  const saveThoughtMutation = useMutation({
    mutationFn: (data) =>
      api.createJournal({
        userId: user.email,
        date: today,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["thoughtRecords", user?.email],
      });
      setShowThoughtRecorder(false);
    },
  });

  if (!user) return null;

  const recentMoods = moodEntries.slice(0, 7);
  const avgMood =
    recentMoods.length > 0
      ? Math.round(
          (recentMoods.reduce((sum, m) => sum + (m.rating || 0), 0) /
            recentMoods.length) *
            10
        ) / 10
      : 0;

  const cognitiveRiskScore = Math.min(100, Math.max(0, 100 - avgMood * 10));

  const journalStreak = (() => {
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasEntry = journals.some((j) => j.date === dateStr);

      if (hasEntry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  })();

  // Calculate "At a Glance" metrics
  const latestJournal = journals.length > 0 ? journals[0] : null;
  const hoursAgoJournal = latestJournal
    ? Math.round(
        differenceInHours(
          new Date(),
          new Date(latestJournal.updated_date || latestJournal.created_date)
        )
      )
    : null;

  const moodTrend =
    moodEntries.length >= 2
      ? (moodEntries[0].rating || 0) > (moodEntries[1].rating || 0)
        ? "up"
        : (moodEntries[0].rating || 0) < (moodEntries[1].rating || 0)
        ? "down"
        : "stable"
      : "stable";

  const thoughtRecordConsistency =
    thoughtRecords.length >= 7
      ? Math.round(
          (thoughtRecords.filter((t) => {
            const daysDiff = differenceInDays(new Date(), new Date(t.date));
            return daysDiff <= 7;
          }).length /
            7) *
            100
        )
      : 0;

  // NEW: Weekly mood data for graph
  const weeklyMoodData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const mood = moodEntries.find((m) => m.date === dateStr);
    return {
      date: format(date, "EEE"),
      fullDate: dateStr,
      mood: mood?.rating || null,
      count: mood ? 1 : 0,
    };
  });

  // NEW: Last balanced thought
  const lastBalancedThought = thoughtRecords.find((t) => t.balancedThought);

  const addRiskLog = () => {
    if (!riskNote.trim()) return;
    const entry = {
      id: crypto.randomUUID(),
      note: riskNote.trim(),
      severity: riskSeverity,
      date: format(new Date(), "yyyy-MM-dd"),
    };
    setRiskLogs((prev) => [entry, ...prev].slice(0, 12));
    setRiskNote("");
  };

  const atAGlanceMetrics = [
    {
      icon: <Heart />,
      label: "Mood Trend (7d avg)",
      value: avgMood > 0 ? `${avgMood}/10` : "—",
      subtitle: "average mood",
      trend: moodTrend,
      progress: avgMood * 10,
      message:
        avgMood >= 7
          ? "😊 Mood is positive!"
          : avgMood <= 4
          ? "💙 Consider reaching out for support"
          : null,
    },
    {
      icon: <BookOpen />,
      label: "Journal Consistency",
      value: journalStreak,
      subtitle: `day streak`,
      trend: journalStreak >= 7 ? "up" : journalStreak >= 3 ? "stable" : "down",
      lastUpdated: hoursAgoJournal ? `${hoursAgoJournal}h ago` : "No entries",
    },
    {
      icon: <Lightbulb />,
      label: "Thought Records",
      value: `${thoughtRecordConsistency}%`,
      subtitle: "weekly consistency",
      progress: thoughtRecordConsistency,
      trend: thoughtRecordConsistency >= 50 ? "up" : "stable",
    },
  ];

  // NEW: Recent Activity Data
  const recentActivityData = [
    ...journals.slice(0, 2).map((j) => ({
      id: j.id,
      type: "journal",
      icon: BookOpen,
      title: "Journal Entry",
      summary: `"${j.response?.substring(0, 60)}${
        j.response?.length > 60 ? "..." : ""
      }" • Mood: ${j.mood}/10`,
      timestamp: j.date,
      color: "#4CC9F0",
      badges: [
        { text: `Mood ${j.mood}/10`, color: "#4CC9F0" },
        ...(j.tags || [])
          .slice(0, 2)
          .map((tag) => ({ text: tag, color: "#7C3AED" })),
      ],
      data: j,
    })),
    ...thoughtRecords.slice(0, 2).map((t) => ({
      id: t.id,
      type: "thought",
      icon: Lightbulb,
      title: "Thought Record (CBT)",
      summary: `Situation: "${t.situation?.substring(0, 50)}${
        t.situation?.length > 50 ? "..." : ""
      }"`,
      timestamp: t.timestamp,
      color: "#FFD700",
      badges: [
        { text: `${t.emotions?.length || 0} emotions`, color: "#FF69B4" },
        ...(t.balancedThought ? [{ text: "Reframed", color: "#52B788" }] : []),
      ],
      data: t,
    })),
    ...meditationLogs.slice(0, 1).map((m) => ({
      id: m.id,
      type: "meditation",
      icon: Wind,
      title: m.sessionName || "Meditation",
      summary: `${m.duration} min${
        m.completedFully ? " • Completed" : " • Partial"
      }`,
      timestamp: m.created_date,
      color: "#7C3AED",
      badges: [
        { text: `${m.duration} min`, color: "#7C3AED" },
        {
          text: m.completedFully ? "Complete" : "Partial",
          color: m.completedFully ? "#52B788" : "#FFD700",
        },
      ],
      data: m,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  const stats = [
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Journals",
      value: journals.length,
      subtitle: `${journalStreak} day streak`,
      color: "#4CC9F0",
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      label: "Thoughts",
      value: thoughtRecords.length,
      subtitle: "reframed",
      color: "#FFD700",
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Avg Mood",
      value: avgMood,
      subtitle: "/10",
      color: "#FF69B4",
    },
    {
      icon: <Wind className="w-4 h-4" />,
      label: "Mindfulness",
      value: meditationLogs.length,
      subtitle: "sessions",
      color: "#7C3AED",
    },
  ];

  return (
    <PillarPage
      pillar={PILLAR}
      title="Mental Health"
      subtitle="Journal, reflect, and reframe thoughts"
      stats={stats}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "journal", label: "Journal" },
          { id: "thoughts", label: "Thoughts" },
          { id: "tools", label: "Tools" },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`py-2.5 px-2 rounded-xl font-bold transition-all text-sm ${
              activeView === view.id
                ? "text-white"
                : "bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5"
            }`}
            style={
              activeView === view.id
                ? {
                    background: `linear-gradient(to right, ${PILLAR.color}, ${PILLAR.color}CC)`,
                    boxShadow: `0 0 20px ${PILLAR.color}40`,
                  }
                : {}
            }
          >
            {view.label}
          </button>
        ))}
      </div>

      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      {/* NEW: Pro Tip Section */}
      <PillarTip
        tips={getTipsForPillar("mental_health")}
        color={PILLAR.color}
        icon={Brain}
        title="Mental Health Tip"
      />

      {/* NeuroShield: cognitive risk overview */}
      <div
        className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-ns-card"
        style={{ boxShadow: `0 0 20px ${PILLAR.color}25` }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              NeuroShield
            </p>
            <h3 className="text-lg font-semibold text-white">Cognitive risk</h3>
            <p className="text-sm text-white/70">
              Passive indicator only. No clinical inference.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {cognitiveRiskScore}
            </div>
            <div className="text-xs text-white/60">risk score</div>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${cognitiveRiskScore}%`,
              background:
                cognitiveRiskScore >= 70
                  ? "linear-gradient(90deg, #ef4444, #f97316)"
                  : "linear-gradient(90deg, #22d3ee, #4CC9F0)",
            }}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
          <span
            className={`h-2 w-2 rounded-full ${
              cognitiveRiskScore >= 70
                ? "bg-red-400 animate-pulse"
                : "bg-emerald-300"
            }`}
            aria-hidden
          />
          {cognitiveRiskScore >= 70
            ? "Warning: elevated cognitive risk language. Consider using the Emergency Toolkit."
            : "Stable: no elevated risk signals detected in recent mood logs."}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Manual log</p>
            <textarea
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Add a note about triggers, sleep, stressors..."
              value={riskNote}
              onChange={(e) => setRiskNote(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <select
                className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white"
                value={riskSeverity}
                onChange={(e) => setRiskSeverity(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Button
                type="button"
                className="bg-ns-gold text-ns-navy hover:brightness-95"
                onClick={addRiskLog}
              >
                Save log
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Recent log</p>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2 max-h-40 overflow-y-auto">
              {riskLogs.length === 0 ? (
                <p className="text-sm text-white/60">No manual entries yet.</p>
              ) : (
                riskLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-white/60">
                      <span>{log.date}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                          log.severity === "high"
                            ? "bg-red-500/20 text-red-200"
                            : log.severity === "medium"
                            ? "bg-amber-500/20 text-amber-100"
                            : "bg-emerald-500/20 text-emerald-100"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-white/90">{log.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Prominent Breathing Exercise Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowBreathing(true)}
          className="w-full bg-gradient-to-r from-[#4CC9F0] to-[#4169E1] hover:from-[#3BB8E0] hover:to-[#3659D1] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-3 group"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}40` }}
        >
          <Wind className="w-6 h-6 group-hover:animate-pulse" />
          <span className="text-lg">Start Breathing Exercise</span>
          <div className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
            4-7-8 technique
          </div>
        </button>
      </div>

      {/* NEW: Weekly Mood Trend Graph */}
      {weeklyMoodData.some((d) => d.mood !== null) && (
        <div
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: PILLAR.color }} />
            Weekly Mood Trend
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyMoodData}>
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1f35",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value) => [`${value}/10`, "Mood"]}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke={PILLAR.color}
                strokeWidth={3}
                dot={{ fill: PILLAR.color, r: 5 }}
                activeDot={{ r: 7, fill: "#FFD700" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="text-center text-white/60 text-sm mt-2">
            {weeklyMoodData.filter((d) => d.mood !== null).length} of 7 days
            tracked
          </div>
        </div>
      )}

      {/* NEW: Last Balanced Thought Highlight */}
      {lastBalancedThought && (
        <div
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ boxShadow: `0 0 30px #FFD70020` }}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#FFD700] to-[#FFA500]" />

          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "#FFD70020",
                border: "1px solid #FFD70040",
              }}
            >
              <Lightbulb className="w-6 h-6 text-[#FFD700]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-bold">
                  Latest Reframed Thought
                </h3>
                <span className="text-white/40 text-xs">
                  {format(new Date(lastBalancedThought.timestamp), "MMM d")}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
                <div className="text-white/60 text-xs mb-1">Original:</div>
                <p className="text-white/90 text-sm italic">
                  "{lastBalancedThought.automaticThought}"
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 text-xs mb-1 flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  Balanced Perspective:
                </div>
                <p className="text-white text-sm font-medium">
                  "{lastBalancedThought.balancedThought}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Recent Activity Section */}
      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No mental health activity logged yet"
        emptyIcon={Brain}
        emptyAction={
          <Button
            onClick={() => setShowJournal(true)}
            className="bg-gradient-to-r from-[#4CC9F0] to-[#4169E1] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Journaling
          </Button>
        }
      />

      {activeView === "overview" && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <ActionCard
              icon={BookOpen}
              title="Guided Journal"
              description="AI-powered prompts"
              stats={`${journals.length} entries`}
              color="#4CC9F0"
              onClick={() => setShowJournal(true)}
            />
            <ActionCard
              icon={Wind}
              title="Breathing Exercise"
              description="Calm your mind"
              stats="Interactive guide"
              color="#52B788"
              onClick={() => setShowBreathing(true)}
            />
            <ActionCard
              icon={Brain}
              title="Thought Record"
              description="Challenge negative thoughts"
              stats={`${thoughtRecords.length} records`}
              color="#7C3AED"
              onClick={() => setShowThoughtRecorder(true)}
            />
          </div>

          {journals.length > 0 && (
            <DataCard
              title="Recent Journal Entries"
              titleIcon={<BookOpen />}
              color="#4CC9F0"
            >
              <div className="space-y-3">
                {journals.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-white/70 text-sm mb-1">
                          {format(new Date(entry.date), "MMM d, yyyy")}
                        </div>
                        <p className="text-white/60 text-sm italic line-clamp-2">
                          "{entry.prompt}"
                        </p>
                      </div>
                      {entry.mood && (
                        <div className="text-blue-400 font-bold">
                          😊 {entry.mood}/10
                        </div>
                      )}
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2 mt-2">
                      {entry.response}
                    </p>
                    {entry.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </DataCard>
          )}

          {thoughtRecords.length > 0 && (
            <DataCard
              title="Recent Thought Records"
              titleIcon={<Brain />}
              color="#7C3AED"
            >
              <div className="space-y-3">
                {thoughtRecords.slice(0, 3).map((thought) => {
                  const emotionsBefore = thought.emotions || [];
                  const emotionsAfter = thought.emotionsAfter || [];
                  const avgBefore =
                    emotionsBefore.length > 0
                      ? emotionsBefore.reduce(
                          (sum, e) => sum + e.intensity,
                          0
                        ) / emotionsBefore.length
                      : 0;
                  const avgAfter =
                    emotionsAfter.length > 0
                      ? emotionsAfter.reduce((sum, e) => sum + e.intensity, 0) /
                        emotionsAfter.length
                      : avgBefore;
                  const improved = avgAfter < avgBefore;

                  return (
                    <div
                      key={thought.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-white/70 text-sm mb-1">
                            {format(
                              new Date(thought.timestamp),
                              "MMM d - h:mm a"
                            )}
                          </div>
                          <p className="text-white/80 text-sm line-clamp-2 italic">
                            "{thought.automaticThought}"
                          </p>
                        </div>
                        {improved && (
                          <div className="flex items-center gap-1 text-green-400 text-xs">
                            <TrendingUp className="w-4 h-4" />
                            Better
                          </div>
                        )}
                      </div>
                      {thought.balancedThought && (
                        <p className="text-white/70 text-sm mt-2 pt-2 border-t border-white/10 line-clamp-2">
                          ➜ {thought.balancedThought}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </DataCard>
          )}
        </div>
      )}

      {activeView === "journal" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Journal Entries
            </h2>
            <Button
              onClick={() => setShowJournal(true)}
              className="bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold w-full sm:w-auto"
            >
              <Lightbulb className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              New Entry
            </Button>
          </div>

          {journals.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <BookOpen className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Start Journaling
              </h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Get daily AI-generated prompts to explore your thoughts and
                emotions
              </p>
              <Button
                onClick={() => setShowJournal(true)}
                className="bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold"
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                Start First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {journals.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="text-white font-bold text-base md:text-lg">
                        {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                      </div>
                      {entry.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {entry.mood && (
                      <div className="text-center">
                        <Heart className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                        <div className="text-blue-400 font-bold">
                          {entry.mood}/10
                        </div>
                      </div>
                    )}
                  </div>

                  {entry.prompt && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-3">
                      <div className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Prompt
                      </div>
                      <p className="text-white/80 text-sm italic">
                        "{entry.prompt}"
                      </p>
                    </div>
                  )}

                  <p className="text-white/80 text-sm md:text-base leading-relaxed">
                    {entry.response}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "thoughts" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Thought Records (CBT)
            </h2>
            <Button
              onClick={() => setShowThoughtRecorder(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold w-full sm:w-auto"
            >
              <Lightbulb className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              New Record
            </Button>
          </div>

          {thoughtRecords.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <Brain className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Challenge Negative Thoughts
              </h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Use CBT techniques to identify, examine, and reframe unhelpful
                thinking patterns
              </p>
              <Button
                onClick={() => setShowThoughtRecorder(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start First Record
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {thoughtRecords.map((thought) => {
                const emotionsBefore = thought.emotions || [];
                const emotionsAfter = thought.emotionsAfter || [];
                const avgBefore =
                  emotionsBefore.length > 0
                    ? Math.round(
                        emotionsBefore.reduce(
                          (sum, e) => sum + e.intensity,
                          0
                        ) / emotionsBefore.length
                      )
                    : 0;
                const avgAfter =
                  emotionsAfter.length > 0
                    ? Math.round(
                        emotionsAfter.reduce((sum, e) => sum + e.intensity, 0) /
                          emotionsAfter.length
                      )
                    : avgBefore;
                const improved = avgAfter < avgBefore;

                return (
                  <div
                    key={thought.id}
                    className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="text-white/60 text-xs md:text-sm mb-1">
                          {format(
                            new Date(thought.timestamp),
                            "MMM d, yyyy - h:mm a"
                          )}
                        </div>
                        <div className="text-white/70 text-sm">
                          Situation:{" "}
                          <span className="text-white">
                            {thought.situation}
                          </span>
                        </div>
                      </div>
                      {improved && (
                        <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full flex items-center gap-1 self-start">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-green-400 text-sm font-bold">
                            Improved
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <div className="text-red-400 text-xs mb-1">
                          Automatic Thought:
                        </div>
                        <p className="text-white/90 text-sm italic">
                          "{thought.automaticThought}"
                        </p>
                      </div>

                      {thought.balancedThought && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="text-green-400 text-xs mb-1">
                            Balanced Thought:
                          </div>
                          <p className="text-white/90 text-sm">
                            "{thought.balancedThought}"
                          </p>
                        </div>
                      )}

                      {emotionsBefore.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-white/60 text-xs mb-2">
                              Emotions Before:
                            </div>
                            {emotionsBefore.map((em, idx) => (
                              <div
                                key={idx}
                                className="text-white/80 capitalize"
                              >
                                {em.emotion}: {em.intensity}/10
                              </div>
                            ))}
                          </div>
                          {emotionsAfter.length > 0 && (
                            <div>
                              <div className="text-white/60 text-xs mb-2">
                                After Reframing:
                              </div>
                              {emotionsAfter.map((em, idx) => (
                                <div
                                  key={idx}
                                  className="text-green-400 capitalize"
                                >
                                  {em.emotion}: {em.intensity}/10
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div
            className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 backdrop-blur-sm"
            style={{ boxShadow: "0 0 25px rgba(82, 183, 136, 0.15)" }}
          >
            <Wind
              className="w-12 h-12 text-green-400 mb-4"
              style={{ filter: "drop-shadow(0 0 8px rgba(82, 183, 136, 0.6))" }}
            />
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              Breathing Exercises
            </h3>
            <p className="text-white/70 text-sm mb-6">
              Guided breathing patterns to reduce anxiety and increase calm
            </p>
            <ul className="space-y-2 text-sm text-white/80 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Box Breathing (4-4-4-4)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>4-7-8 for Sleep & Calm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Deep Calm Breathing</span>
              </li>
            </ul>
            <Button
              onClick={() => setShowBreathing(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
            >
              Start Exercise
            </Button>
          </div>

          <div
            className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 backdrop-blur-sm"
            style={{ boxShadow: "0 0 25px rgba(124, 58, 237, 0.15)" }}
          >
            <Brain
              className="w-12 h-12 text-purple-400 mb-4"
              style={{ filter: "drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))" }}
            />
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              CBT Thought Records
            </h3>
            <p className="text-white/70 text-sm mb-6">
              Challenge and reframe negative thinking patterns with proven CBT
              techniques
            </p>
            <ul className="space-y-2 text-sm text-white/80 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Identify automatic thoughts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Examine evidence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Create balanced perspectives</span>
              </li>
            </ul>
            <Button
              onClick={() => setShowThoughtRecorder(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
            >
              Start Record
            </Button>
          </div>
        </div>
      )}

      {showJournal && (
        <AIErrorBoundary showHelp={true}>
          <GuidedJournal
            onClose={() => setShowJournal(false)}
            onSave={(data) => saveJournalMutation.mutateAsync(data)}
          />
        </AIErrorBoundary>
      )}

      {showBreathing && (
        <BreathingExercise onClose={() => setShowBreathing(false)} />
      )}

      {showThoughtRecorder && (
        <ThoughtRecorder
          onClose={() => setShowThoughtRecorder(false)}
          onSave={(data) => saveThoughtMutation.mutateAsync(data)}
        />
      )}

      {/* NEW: Detail Modals */}
      {selectedLog && detailModalType === "journal" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#4CC9F0"
          icon={BookOpen}
          title="Journal Entry"
          fields={[
            {
              key: "prompt",
              label: "Prompt",
              icon: Sparkles,
              color: "#7C3AED",
            },
            {
              key: "response",
              label: "Your Reflection",
              icon: BookOpen,
              color: "#4CC9F0",
            },
            {
              key: "mood",
              label: "Mood After",
              icon: Heart,
              color: "#FF69B4",
              unit: "/10",
            },
          ]}
        />
      )}

      {selectedLog && detailModalType === "thought" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#FFD700"
          icon={Lightbulb}
          title="Thought Record"
          fields={[
            // The timestamp field is intentionally omitted as per the outline's change.
            {
              key: "situation",
              label: "Situation",
              icon: Brain,
              color: "#FF5733",
            },
            {
              key: "automaticThought",
              label: "Automatic Thought",
              icon: Brain,
              color: "#FFD700",
            },
            {
              key: "emotions",
              label: "Emotions",
              icon: Heart,
              color: "#FF69B4",
              render: (emotions) =>
                emotions && emotions.length > 0 ? (
                  <div className="space-y-1">
                    {emotions.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white/5 rounded-lg p-2"
                      >
                        <span className="text-white/90 text-sm">
                          {e.emotion}
                        </span>
                        <span className="text-pink-400 font-bold">
                          {e.intensity}/10
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null,
            },
            {
              key: "evidence",
              label: "Evidence For",
              icon: TrendingUp,
              color: "#FF5733",
            },
            {
              key: "counterEvidence",
              label: "Evidence Against",
              icon: TrendingUp,
              color: "#52B788",
            },
            {
              key: "balancedThought",
              label: "Balanced Thought",
              icon: Lightbulb,
              color: "#4CC9F0",
            },
            {
              key: "aiSuggestion",
              label: "AI Suggestion",
              icon: Sparkles,
              color: "#7C3AED",
            },
          ]}
        />
      )}
    </PillarPage>
  );
}
