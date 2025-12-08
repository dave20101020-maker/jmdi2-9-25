import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PILLARS } from "@/utils";
import {
  Sparkles,
  Plus,
  Heart,
  Compass,
  BookOpen,
  Bell,
  Target,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInHours, differenceInDays } from "date-fns";
import GratitudeLogger from "@/components/shared/GratitudeLogger";
import ValuesExercise from "@/components/shared/ValuesExercise";
import ReflectionPrompt from "@/components/shared/ReflectionPrompt";
import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import PillarTip from "@/components/shared/PillarTip";
import { getTipsForPillar } from "@/utils/pillarTips";

const PILLAR = PILLARS.spirituality;

export default function Spirituality() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [showGratitudeLogger, setShowGratitudeLogger] = useState(false);
  const [showValuesExercise, setShowValuesExercise] = useState(false);
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [reflectionType, setReflectionType] = useState("daily");
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalType, setDetailModalType] = useState(null);

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: gratitudeEntries = [] } = useQuery({
    queryKey: ["gratitudeEntries", user?.email],
    queryFn: () =>
      api.getGratitudeEntries({ userId: user?.email }, "-date", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: valuesExercises = [] } = useQuery({
    queryKey: ["valuesExercises", user?.email],
    queryFn: () =>
      api.getValuesExercises({ userId: user?.email }, "-date", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: reflections = [] } = useQuery({
    queryKey: ["reflections", user?.email],
    queryFn: () =>
      api.getReflectionEntries({ userId: user?.email }, "-date", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: meditationLogs = [] } = useQuery({
    queryKey: ["meditationLogs", user?.email],
    queryFn: () =>
      api.getMeditationLogs(
        {
          userId: user?.email,
          pillar: "spirituality",
        },
        "-created_date",
        100
      ),
    enabled: !!user,
    initialData: [],
  });

  const saveGratitudeMutation = useMutation({
    mutationFn: (data) =>
      api.createGratitudeEntry({
        userId: user.email,
        date: today,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gratitudeEntries", user?.email],
      });
      setShowGratitudeLogger(false);
    },
  });

  const saveValuesExerciseMutation = useMutation({
    mutationFn: (data) =>
      api.createValuesExercise({
        userId: user.email,
        date: today,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valuesExercises", user?.email],
      });
      setShowValuesExercise(false);
    },
  });

  const saveReflectionMutation = useMutation({
    mutationFn: (data) =>
      api.createReflectionEntry({
        userId: user.email,
        date: today,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections", user?.email] });
      setShowReflectionPrompt(false);
    },
  });

  const gratitudeStreak = (() => {
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasEntry = gratitudeEntries.some((g) => g.date === dateStr);

      if (hasEntry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  })();

  const totalGratitudes = gratitudeEntries.reduce(
    (sum, entry) => sum + (entry.gratitudes?.length || 0),
    0
  );

  const avgMeaningScore =
    reflections.slice(0, 7).length > 0
      ? Math.round(
          (reflections
            .slice(0, 7)
            .reduce((sum, r) => sum + (r.meaningScore || 0), 0) /
            Math.min(reflections.length, 7)) *
            10
        ) / 10
      : 0;

  const todayGratitude = gratitudeEntries.find((g) => g.date === today);

  const latestGratitude =
    gratitudeEntries.length > 0 ? gratitudeEntries[0] : null;
  const hoursAgoGratitude = latestGratitude
    ? Math.round(
        differenceInHours(
          new Date(),
          new Date(latestGratitude.updated_date || latestGratitude.created_date)
        )
      )
    : null;

  const meaningTrend =
    reflections.length >= 2
      ? (reflections[0].meaningScore || 0) > (reflections[1].meaningScore || 0)
        ? "up"
        : (reflections[0].meaningScore || 0) <
          (reflections[1].meaningScore || 0)
        ? "down"
        : "stable"
      : "stable";

  // NEW: Top 3 values from most recent values exercise
  const latestValuesExercise = valuesExercises.find(
    (v) => v.topValues && v.topValues.length > 0
  );
  const top3Values = latestValuesExercise?.topValues?.slice(0, 3) || [];

  // NEW: Gratitude entries this week
  const weeklyGratitudes = gratitudeEntries.filter((g) => {
    const daysDiff = differenceInDays(new Date(), new Date(g.date));
    return daysDiff <= 7;
  }).length;

  // NEW: Latest reflection intention
  const latestReflection = reflections.length > 0 ? reflections[0] : null;

  const atAGlanceMetrics = [
    {
      icon: <Heart />,
      label: "Gratitude Streak",
      value: gratitudeStreak,
      subtitle: `day${gratitudeStreak !== 1 ? "s" : ""} consecutive`,
      trend:
        gratitudeStreak >= 7 ? "up" : gratitudeStreak >= 3 ? "stable" : "down",
      lastUpdated: hoursAgoGratitude
        ? `${hoursAgoGratitude}h ago`
        : "No entries",
      message: !todayGratitude
        ? "💫 Log today's gratitude to keep the streak!"
        : null,
    },
    {
      icon: <Sparkles />,
      label: "Meaning & Purpose",
      value: avgMeaningScore > 0 ? `${avgMeaningScore}/10` : "—",
      subtitle: "7-day average",
      trend: meaningTrend,
      progress: avgMeaningScore * 10,
    },
    {
      icon: <Compass />,
      label: "Values Clarity",
      value: valuesExercises.length,
      subtitle: "exercises completed",
      trend:
        valuesExercises.length >= 3
          ? "up"
          : valuesExercises.length >= 1
          ? "stable"
          : "down",
      message:
        valuesExercises.length === 0
          ? "🧭 Start your first values exercise"
          : null,
    },
  ];

  const recentActivityData = [
    ...gratitudeEntries.slice(0, 2).map((g) => ({
      id: g.id,
      type: "gratitude",
      icon: Heart,
      title: "Gratitude Practice",
      summary: `${g.gratitudes?.length || 0} things appreciated • Mood: ${
        g.mood
      }/10`,
      timestamp: g.date,
      color: "#FFD700",
      badges: [
        { text: `${g.gratitudes?.length || 0} entries`, color: "#FFD700" },
        { text: `Mood ${g.mood}/10`, color: "#FF69B4" },
      ],
      data: g,
    })),
    ...valuesExercises.slice(0, 2).map((v) => ({
      id: v.id,
      type: "values",
      icon: Compass,
      title: "Values Exercise",
      summary: `${v.exerciseType.replace("_", " ")} - ${
        v.topValues?.length || 0
      } values identified`,
      timestamp: v.date,
      color: "#7C3AED",
      badges: [{ text: v.exerciseType.replace("_", " "), color: "#7C3AED" }],
      data: v,
    })),
    ...reflections.slice(0, 1).map((r) => ({
      id: r.id,
      type: "reflection",
      icon: BookOpen,
      title: "Reflection",
      summary: `${r.reflectionType} reflection • Meaning: ${r.meaningScore}/10`,
      timestamp: r.date,
      color: "#4CC9F0",
      badges: [
        { text: r.reflectionType, color: "#4CC9F0" },
        { text: `Meaning ${r.meaningScore}/10`, color: "#52B788" },
      ],
      data: r,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse"
            style={{
              backgroundColor: `${PILLAR.color}20`,
              boxShadow: `0 0 30px ${PILLAR.color}40`,
            }}
          />
          <p className="text-white/60">Loading spiritual journey...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Gratitude",
      value: totalGratitudes,
      subtitle: `${gratitudeStreak} day streak`,
      color: "#FFD700",
    },
    {
      icon: <Compass className="w-4 h-4" />,
      label: "Values Work",
      value: valuesExercises.length,
      subtitle: "exercises",
      color: "#7C3AED",
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Reflections",
      value: reflections.length,
      subtitle: "entries",
      color: "#4CC9F0",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Meaning",
      value: avgMeaningScore,
      subtitle: "avg score",
      color: "#52B788",
    },
  ];

  return (
    <PillarPage
      pillar={PILLAR}
      title="Spirituality"
      subtitle="Gratitude, values, and reflection"
      stats={stats}
    >
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      <PillarTip
        tips={getTipsForPillar("spirituality")}
        color={PILLAR.color}
        icon={Sparkles}
        title="Spiritual Wisdom"
      />

      {(top3Values.length > 0 || weeklyGratitudes >= 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* NEW: Top 3 Values Highlight */}
          {top3Values.length > 0 && (
            <div
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
              style={{ boxShadow: `0 0 30px #7C3AED20` }}
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#7C3AED]" />
                Your Core Values
              </h3>

              <div className="space-y-3">
                {top3Values.map((value, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl p-4"
                    style={{ boxShadow: "0 0 15px rgba(124, 58, 237, 0.3)" }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center font-bold text-white">
                        {value.rank || idx + 1}
                      </div>
                      <div className="text-white font-bold text-lg capitalize">
                        {value.value}
                      </div>
                    </div>
                    {value.why && (
                      <p className="text-white/70 text-sm pl-11">{value.why}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-white/40 text-xs text-center mt-3">
                From{" "}
                {format(new Date(latestValuesExercise.date), "MMM d, yyyy")}
              </div>
            </div>
          )}

          {/* NEW: Gratitude Counter This Week */}
          <div
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
            style={{ boxShadow: `0 0 30px #FFD70020` }}
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#FFD700]" />
              Gratitude This Week
            </h3>

            <div className="text-center py-6">
              <div className="text-6xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                {weeklyGratitudes}
              </div>
              <div className="text-white/60 text-sm mb-4">
                {weeklyGratitudes === 7
                  ? "Perfect week! 🌟"
                  : weeklyGratitudes >= 5
                  ? "Great consistency! 💫"
                  : weeklyGratitudes >= 3
                  ? "Keep it up! ✨"
                  : "Start your practice today"}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const dateStr = format(date, "yyyy-MM-dd");
                  const hasEntry = gratitudeEntries.some(
                    (g) => g.date === dateStr
                  );

                  return (
                    <div key={i} className="text-center">
                      <div
                        className="w-full h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: hasEntry
                            ? "#FFD70030"
                            : "rgba(255,255,255,0.05)",
                          border: hasEntry
                            ? "2px solid #FFD700"
                            : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {hasEntry ? "✨" : ""}
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        {format(date, "EEE")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Latest Reflection Intention */}
      {latestReflection?.intentionForward && (
        <div
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{ boxShadow: `0 0 30px #4CC9F020` }}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#4CC9F0] to-[#4169E1]" />

          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "#4CC9F020",
                border: "1px solid #4CC9F040",
              }}
            >
              <Target className="w-6 h-6 text-[#4CC9F0]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-bold">Your Latest Intention</h3>
                <span className="text-white/40 text-xs">
                  {format(new Date(latestReflection.date), "MMM d")}
                </span>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-4">
                <Quote className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-white text-sm leading-relaxed">
                  {latestReflection.intentionForward}
                </p>
              </div>

              {latestReflection.meaningScore && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="text-white/60 text-xs">Meaning score:</div>
                  <div className="text-lg font-bold text-[#52B788]">
                    {latestReflection.meaningScore}/10
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No spiritual practices logged yet"
        emptyIcon={Sparkles}
        emptyAction={
          <Button
            onClick={() => setShowGratitudeLogger(true)}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Gratitude Practice
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "gratitude", label: "Gratitude" },
          { id: "values", label: "Values" },
          { id: "reflections", label: "Reflect" },
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

      {activeView === "overview" && (
        <div className="space-y-4 md:space-y-6">
          {!todayGratitude && (
            <div
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl p-4 md:p-6 backdrop-blur-sm"
              style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.2)" }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-white font-bold text-base md:text-lg mb-1 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    Daily Gratitude
                  </h3>
                  <p className="text-white/70 text-sm">
                    Take a moment to appreciate today
                  </p>
                </div>
                <Button
                  onClick={() => setShowGratitudeLogger(true)}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold w-full sm:w-auto whitespace-nowrap"
                >
                  Practice Now
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <ActionCard
              icon={Heart}
              title="Gratitude Journal"
              description="Daily appreciation"
              stats={`${gratitudeEntries.length} entries`}
              color="#FFD700"
              onClick={() => setShowGratitudeLogger(true)}
            />
            <ActionCard
              icon={Compass}
              title="Values Work"
              description="AI-guided clarity"
              stats={`${valuesExercises.length} exercises`}
              color="#7C3AED"
              onClick={() => setShowValuesExercise(true)}
            />
            <ActionCard
              icon={BookOpen}
              title="Reflection"
              description="Daily/weekly prompts"
              stats={`${reflections.length} entries`}
              color="#4CC9F0"
              onClick={() => {
                setReflectionType("daily");
                setShowReflectionPrompt(true);
              }}
            />
          </div>

          {gratitudeEntries.length > 0 && (
            <DataCard
              title="Recent Gratitude"
              titleIcon={<Heart />}
              color="#FFD700"
            >
              <div className="space-y-3">
                {gratitudeEntries.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-white/70 text-sm">
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </div>
                      {entry.mood && (
                        <div className="text-yellow-400 font-bold">
                          ✨ {entry.mood}/10
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {entry.gratitudes?.slice(0, 3).map((g, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-400">•</span>
                          <span className="text-white/80 text-sm">
                            {g.text}
                          </span>
                        </div>
                      ))}
                      {entry.gratitudes?.length > 3 && (
                        <div className="text-white/60 text-xs">
                          +{entry.gratitudes.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          )}

          {valuesExercises.length > 0 && (
            <DataCard
              title="Latest Values Work"
              titleIcon={<Compass />}
              color="#7C3AED"
            >
              <div className="space-y-3">
                {valuesExercises.slice(0, 2).map((exercise) => (
                  <div
                    key={exercise.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="text-white/70 text-sm mb-2">
                      {format(new Date(exercise.date), "MMM d, yyyy")} •{" "}
                      {exercise.exerciseType.replace("_", " ")}
                    </div>
                    {exercise.topValues?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exercise.topValues.map((v, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full capitalize"
                          >
                            {v.value}
                          </span>
                        ))}
                      </div>
                    )}
                    {exercise.lifePurpose && (
                      <p className="text-white/80 text-sm mt-2 italic line-clamp-2">
                        "{exercise.lifePurpose}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </DataCard>
          )}
        </div>
      )}

      {activeView === "gratitude" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Gratitude Journal
            </h2>
            <Button
              onClick={() => setShowGratitudeLogger(true)}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              New Entry
            </Button>
          </div>

          {gratitudeEntries.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <Heart className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Start Gratitude Practice
              </h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Daily gratitude shifts your perspective and cultivates joy
              </p>
              <Button
                onClick={() => setShowGratitudeLogger(true)}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {gratitudeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="text-white font-bold text-base md:text-lg">
                        {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                      </div>
                      <div className="text-white/60 text-sm">
                        {entry.gratitudes?.length || 0} things appreciated
                      </div>
                    </div>
                    {entry.mood && (
                      <div className="text-yellow-400 font-bold text-2xl">
                        {entry.mood}/10
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {entry.gratitudes?.map((g, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">✨</span>
                        <div className="flex-1">
                          <p className="text-white/90 text-sm">{g.text}</p>
                          <span className="text-white/60 text-xs capitalize">
                            {g.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {entry.reflectionNote && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-white/70 text-sm italic">
                        {entry.reflectionNote}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "values" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Values Exercises
            </h2>
            <Button
              onClick={() => setShowValuesExercise(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              New Exercise
            </Button>
          </div>

          {valuesExercises.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <Compass className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Clarify Your Values
              </h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                AI-guided exercises to discover what truly matters
              </p>
              <Button
                onClick={() => setShowValuesExercise(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
              >
                Start First Exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {valuesExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-white font-bold text-base md:text-lg capitalize">
                        {exercise.exerciseType.replace("_", " ")}
                      </div>
                      <div className="text-white/60 text-sm">
                        {format(new Date(exercise.date), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>

                  {exercise.topValues?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-white/70 text-sm mb-2">
                        Core Values:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exercise.topValues.map((v, idx) => (
                          <div
                            key={idx}
                            className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-2"
                          >
                            <div className="text-purple-400 font-bold capitalize text-sm">
                              {v.rank}. {v.value}
                            </div>
                            {v.why && (
                              <div className="text-white/70 text-xs mt-1">
                                {v.why}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {exercise.lifePurpose && (
                    <div className="mb-4">
                      <div className="text-white/70 text-sm mb-2">
                        Life Purpose:
                      </div>
                      <p className="text-white/90 text-sm italic">
                        "{exercise.lifePurpose}"
                      </p>
                    </div>
                  )}

                  {exercise.aiInsights && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                      <div className="text-purple-400 text-sm mb-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        AI Insights:
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-line">
                        {exercise.aiInsights}
                      </p>
                    </div>
                  )}

                  {exercise.actionCommitments?.length > 0 && (
                    <div>
                      <div className="text-white/70 text-sm mb-2">
                        Commitments:
                      </div>
                      <ul className="space-y-1">
                        {exercise.actionCommitments.map((action, idx) => (
                          <li
                            key={idx}
                            className="text-white/80 text-sm flex items-start gap-2"
                          >
                            <span className="text-green-400">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "reflections" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Reflections
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  setReflectionType("daily");
                  setShowReflectionPrompt(true);
                }}
                size="sm"
                className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex-1 sm:flex-initial"
              >
                Daily
              </Button>
              <Button
                onClick={() => {
                  setReflectionType("weekly");
                  setShowReflectionPrompt(true);
                }}
                size="sm"
                className="bg-purple-500/20 text-purple-400 border border-purple-500/40 flex-1 sm:flex-initial"
              >
                Weekly
              </Button>
            </div>
          </div>

          {reflections.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <BookOpen className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Begin Reflecting
              </h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Regular reflection helps you find meaning and set intentions
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setReflectionType("daily");
                    setShowReflectionPrompt(true);
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
                >
                  Daily Reflection
                </Button>
                <Button
                  onClick={() => {
                    setReflectionType("weekly");
                    setShowReflectionPrompt(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
                >
                  Weekly Reflection
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {reflections.map((reflection) => (
                <div
                  key={reflection.id}
                  className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="text-white font-bold text-base md:text-lg">
                        {format(
                          new Date(reflection.date),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </div>
                      <div className="text-white/60 text-sm capitalize">
                        {reflection.reflectionType} Reflection
                      </div>
                    </div>
                    {reflection.meaningScore && (
                      <div className="text-center">
                        <div className="text-purple-400 font-bold text-2xl">
                          {reflection.meaningScore}
                        </div>
                        <div className="text-white/60 text-xs">meaning</div>
                      </div>
                    )}
                  </div>

                  {reflection.prompt && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-3">
                      <div className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Prompt
                      </div>
                      <p className="text-white/80 text-sm italic">
                        "{reflection.prompt}"
                      </p>
                    </div>
                  )}

                  <p className="text-white/80 text-sm leading-relaxed mb-3">
                    {reflection.response}
                  </p>

                  {(reflection.gratefulFor?.length > 0 ||
                    reflection.challenges?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                      {reflection.gratefulFor?.length > 0 && (
                        <div>
                          <div className="text-green-400 text-sm mb-2">
                            Grateful For:
                          </div>
                          <ul className="space-y-1">
                            {reflection.gratefulFor.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-white/80 text-sm flex gap-2"
                              >
                                <span className="text-green-400">✓</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reflection.challenges?.length > 0 && (
                        <div>
                          <div className="text-orange-400 text-sm mb-2">
                            Challenges:
                          </div>
                          <ul className="space-y-1">
                            {reflection.challenges.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-white/80 text-sm flex gap-2"
                              >
                                <span className="text-orange-400">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {reflection.intentionForward && (
                    <div className="pt-3 border-t border-white/10 mt-3">
                      <div className="text-blue-400 text-sm mb-1">
                        Intention Forward:
                      </div>
                      <p className="text-white/80 text-sm">
                        {reflection.intentionForward}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showGratitudeLogger && (
        <GratitudeLogger
          onClose={() => setShowGratitudeLogger(false)}
          onSave={(data) => saveGratitudeMutation.mutateAsync(data)}
        />
      )}

      {showValuesExercise && (
        <ValuesExercise
          onClose={() => setShowValuesExercise(false)}
          onSave={(data) => saveValuesExerciseMutation.mutateAsync(data)}
        />
      )}

      {showReflectionPrompt && (
        <ReflectionPrompt
          onClose={() => setShowReflectionPrompt(false)}
          onSave={(data) => saveReflectionMutation.mutateAsync(data)}
          reflectionType={reflectionType}
        />
      )}

      {/* NEW: Detail Modals */}
      {selectedLog && detailModalType === "gratitude" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#FFD700"
          icon={Heart}
          title="Gratitude Entry"
          fields={[
            {
              key: "gratitudes",
              label: "What You Appreciated",
              icon: Sparkles,
              color: "#FFD700",
              render: (gratitudes) => (
                <div className="space-y-2">
                  {gratitudes.map((g, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 text-lg">✨</span>
                      <div>
                        <p className="text-white/90 text-sm">{g.text}</p>
                        <span className="text-white/60 text-xs capitalize">
                          {g.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: "mood",
              label: "Mood After",
              icon: Heart,
              color: "#FF69B4",
              unit: "/10",
            },
            {
              key: "reflectionNote",
              label: "Reflection",
              icon: BookOpen,
              color: "#7C3AED",
            },
          ]}
        />
      )}

      {selectedLog && detailModalType === "values" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#7C3AED"
          icon={Compass}
          title="Values Exercise"
          fields={[
            {
              key: "exerciseType",
              label: "Exercise Type",
              icon: Compass,
              color: "#7C3AED",
              render: (value) => (
                <span className="text-lg capitalize text-white/90">
                  {value.replace("_", " ")}
                </span>
              ),
            },
            {
              key: "topValues",
              label: "Core Values",
              icon: Heart,
              color: "#FFD700",
              render: (values) =>
                values && values.length > 0 ? (
                  <div className="space-y-2">
                    {values.map((v, i) => (
                      <div
                        key={i}
                        className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-3"
                      >
                        <div className="text-purple-400 font-bold capitalize">
                          {v.rank}. {v.value}
                        </div>
                        {v.why && (
                          <div className="text-white/70 text-sm mt-1">
                            {v.why}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null,
            },
            {
              key: "lifePurpose",
              label: "Life Purpose",
              icon: Sparkles,
              color: "#FFD700",
            },
            {
              key: "aiInsights",
              label: "AI Insights",
              icon: Sparkles,
              color: "#4CC9F0",
            },
            {
              key: "actionCommitments",
              label: "Action Commitments",
              icon: BookOpen,
              color: "#52B788",
            },
          ]}
        />
      )}

      {selectedLog && detailModalType === "reflection" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#4CC9F0"
          icon={BookOpen}
          title="Reflection Entry"
          fields={[
            {
              key: "reflectionType",
              label: "Type",
              icon: BookOpen,
              color: "#4CC9F0",
              render: (value) => (
                <span className="text-lg capitalize text-white/90">
                  {value}
                </span>
              ),
            },
            {
              key: "prompt",
              label: "Prompt",
              icon: Sparkles,
              color: "#7C3AED",
              render: (value) => (
                <p className="text-white/80 text-sm italic">"{value}"</p>
              ),
            },
            {
              key: "response",
              label: "Your Reflection",
              icon: Heart,
              color: "#FFD700",
            },
            {
              key: "gratefulFor",
              label: "Grateful For",
              icon: Heart,
              color: "#52B788",
            },
            {
              key: "challenges",
              label: "Challenges Faced",
              icon: Heart,
              color: "#FF5733",
            },
            {
              key: "intentionForward",
              label: "Intention Forward",
              icon: Sparkles,
              color: "#4CC9F0",
            },
            {
              key: "meaningScore",
              label: "Meaning Score",
              icon: Heart,
              color: "#FF69B4",
              unit: "/10",
            },
          ]}
        />
      )}
    </PillarPage>
  );
}
