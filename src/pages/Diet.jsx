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
import { getTipsForPillar } from "@/utils/pillarTips";
import MealLogger from "@/components/shared/MealLogger";
import WaterTracker from "@/components/shared/WaterTracker";
import {
  Utensils,
  Plus,
  Droplets,
  TrendingUp,
  Award,
  BarChart,
  Calendar,
  CheckCircle2,
  Target,
  Flame,
  Apple,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  differenceInHours,
  differenceInDays,
  startOfMonth,
} from "date-fns";
import { PILLARS } from "@/utils";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const PILLAR = PILLARS.diet;

const MEAL_TYPES = [
  { value: "breakfast", emoji: "🍳", color: "#FFD700" },
  { value: "lunch", emoji: "🍱", color: "#52B788" },
  { value: "dinner", emoji: "🍽️", color: "#FF5733" },
  { value: "snack", emoji: "🍿", color: "#4CC9F0" },
];

export default function Diet() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showMealLogger, setShowMealLogger] = useState(false);
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

  const { data: meals = [] } = useQuery({
    queryKey: ["meals", user?.email],
    queryFn: () => api.getMeals({ userId: user?.email }, "-date", 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: waterLogs = [] } = useQuery({
    queryKey: ["waterIntake", user?.email],
    queryFn: () => api.getWaterLogs({ userId: user?.email }, "-date", 30),
    enabled: !!user,
    initialData: [],
  });

  const saveMealMutation = useMutation({
    mutationFn: (data) =>
      api.createMeal({
        userId: user.email,
        date: today,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals", user?.email] });
      setShowMealLogger(false);
    },
  });

  const updateWaterMutation = useMutation({
    mutationFn: async (data) => {
      const todayWater = waterLogs.find((w) => w.date === today);
      if (todayWater) {
        return api.updateWater(todayWater.id, data);
      } else {
        return api.logWater({
          userId: user.email,
          date: today,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waterIntake", user?.email] });
    },
  });

  if (!user) return null;

  const todayMeals = meals.filter((m) => m.date === today);
  const todayWater = waterLogs.find((w) => w.date === today);

  const recentMeals = meals.slice(0, 7);
  const healthyMeals = recentMeals.filter(
    (m) => m.quality === "healthy"
  ).length;
  const mealQualityRate =
    recentMeals.length > 0
      ? Math.round((healthyMeals / recentMeals.length) * 100)
      : 0;

  const last7Days = waterLogs.slice(0, 7);
  const avgWater =
    last7Days.length > 0
      ? Math.round(
          (last7Days.reduce((sum, w) => sum + (w.glassesConsumed || 0), 0) /
            last7Days.length) *
            10
        ) / 10
      : 0;

  const todayWaterGoal = todayWater?.dailyGoal || 8;
  const todayWaterGlasses = todayWater?.glassesConsumed || 0;

  const latestMeal = meals.length > 0 ? meals[0] : null;
  const hoursAgoMeal = latestMeal
    ? Math.round(
        differenceInHours(
          new Date(),
          new Date(latestMeal.updated_date || latestMeal.created_date)
        )
      )
    : null;

  const qualityTrend =
    meals.length >= 2
      ? meals.slice(0, 7).filter((m) => m.quality === "healthy").length >
        meals.slice(7, 14).filter((m) => m.quality === "healthy").length
        ? "up"
        : meals.slice(0, 7).filter((m) => m.quality === "healthy").length <
          meals.slice(7, 14).filter((m) => m.quality === "healthy").length
        ? "down"
        : "stable"
      : "stable";

  const waterStreak = (() => {
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const water = waterLogs.find((w) => w.date === dateStr);

      if (water && water.glassesConsumed >= water.dailyGoal) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  })();

  const mealTypeData = MEAL_TYPES.map((type) => ({
    name: type.value,
    value: meals.filter((m) => m.mealType === type.value).length,
    color: type.color,
    emoji: type.emoji,
  })).filter((d) => d.value > 0);

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const thisMonthMeals = meals.filter((m) => m.date >= monthStart);
  const monthlyHealthyRate =
    thisMonthMeals.length > 0
      ? Math.round(
          (thisMonthMeals.filter((m) => m.quality === "healthy").length /
            thisMonthMeals.length) *
            100
        )
      : 0;

  const milestones = [
    waterStreak >= 7 && {
      id: "hydration-streak",
      type: "streak",
      icon: Droplets,
      title: `${waterStreak} Day Hydration Streak`,
      description: "Met water goal consistently",
      value: `${waterStreak}💧`,
      color: "#4CC9F0",
      isNew: waterStreak <= 10,
    },
    monthlyHealthyRate >= 80 && {
      id: "healthy-month",
      type: "achievement",
      icon: Apple,
      title: "Nutrition Champion",
      description: `${monthlyHealthyRate}% healthy meals this month`,
      value: `${monthlyHealthyRate}%`,
      color: "#52B788",
      date: format(new Date(), "MMM yyyy"),
      isNew: true,
    },
    meals.length >= 50 && {
      id: "meal-tracker",
      type: "award",
      icon: Award,
      title: "Meal Tracking Milestone",
      description: "Total meals logged",
      value: meals.length,
      color: PILLAR.color,
      isNew: false,
    },
  ].filter(Boolean);

  const atAGlanceMetrics = [
    {
      icon: <Utensils />,
      label: "Healthy Meals (7d)",
      value: `${mealQualityRate}%`,
      subtitle: `${healthyMeals} of ${recentMeals.length}`,
      trend: qualityTrend,
      progress: mealQualityRate,
      lastUpdated: hoursAgoMeal ? `${hoursAgoMeal}h ago` : "No meals",
    },
    {
      icon: <Droplets />,
      label: "Hydration Today",
      value: `${todayWaterGlasses}/${todayWaterGoal}`,
      subtitle: "glasses",
      progress: (todayWaterGlasses / todayWaterGoal) * 100,
      trend: todayWaterGlasses >= todayWaterGoal ? "up" : "stable",
      message:
        todayWaterGlasses >= todayWaterGoal
          ? "💧 Hydration goal reached!"
          : `${todayWaterGoal - todayWaterGlasses} glasses to go`,
    },
    {
      icon: <Flame />,
      label: "Water Streak",
      value: waterStreak,
      subtitle: "days consecutive",
      trend: waterStreak >= 7 ? "up" : waterStreak >= 3 ? "stable" : "down",
      message: waterStreak >= 7 ? "🔥 Amazing consistency!" : null,
    },
  ];

  const recentActivityData = [
    ...meals.slice(0, 4).map((m) => {
      const mealType = MEAL_TYPES.find((t) => t.value === m.mealType);
      const qualityColor =
        m.quality === "healthy"
          ? "#52B788"
          : m.quality === "moderate"
          ? "#FFD700"
          : "#FF5733";

      return {
        id: m.id,
        type: "meal",
        icon: Utensils,
        title: `${mealType?.emoji || "🍽️"} ${
          m.mealType.charAt(0).toUpperCase() + m.mealType.slice(1)
        }`,
        summary: `${m.quality} • ${m.description?.substring(0, 50)}${
          m.description?.length > 50 ? "..." : ""
        }`,
        timestamp: m.date,
        color: qualityColor,
        badges: [
          { text: m.quality, color: qualityColor },
          ...(m.satisfactionLevel
            ? [
                {
                  text: `${m.satisfactionLevel}/10 satisfaction`,
                  color: "#FF69B4",
                },
              ]
            : []),
        ],
        data: m,
      };
    }),
    ...waterLogs
      .slice(0, 1)
      .filter((w) => w.glassesConsumed >= w.dailyGoal)
      .map((w) => ({
        id: w.id,
        type: "water",
        icon: Droplets,
        title: "Hydration Goal Met",
        summary: `${w.glassesConsumed} glasses logged`,
        timestamp: w.date,
        color: "#4CC9F0",
        badges: [
          { text: `${w.glassesConsumed}/${w.dailyGoal}`, color: "#4CC9F0" },
          { text: "✓ Goal", color: "#52B788" },
        ],
        data: w,
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
      icon: <Utensils className="w-4 h-4" />,
      label: "Meals Logged",
      value: meals.length,
      subtitle: "total",
      color: PILLAR.color,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Quality Rate",
      value: `${mealQualityRate}%`,
      subtitle: "healthy",
      color: "#52B788",
    },
    {
      icon: <Droplets className="w-4 h-4" />,
      label: "Avg Water",
      value: avgWater,
      subtitle: "glasses/day",
      color: "#4CC9F0",
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Hydration",
      value: waterStreak,
      subtitle: "day streak",
      color: "#FF5733",
    },
  ];

  return (
    <PillarPage
      pillar={PILLAR}
      title="Diet & Nutrition"
      subtitle="Track meals, water, and nutrition"
      stats={stats}
    >
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      <MilestonesSection
        milestones={milestones}
        color={PILLAR.color}
        title="Nutrition Achievements"
        compact={true}
      />

      <PillarTip
        tips={getTipsForPillar("diet")}
        color={PILLAR.color}
        icon={Apple}
        title="Nutrition Tip"
      />

      {mealTypeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
            style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" style={{ color: PILLAR.color }} />
              Meal Distribution
            </h3>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mealTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1f35",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {mealTypeData.map((meal) => (
                <div
                  key={meal.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-xl">{meal.emoji}</span>
                  <span className="text-white/90 capitalize">{meal.name}</span>
                  <span className="text-white/60 ml-auto">{meal.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
            style={{ boxShadow: `0 0 30px #4CC9F020` }}
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#4CC9F0]" />
              Hydration This Week
            </h3>

            <div className="space-y-3">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = format(date, "yyyy-MM-dd");
                const water = waterLogs.find((w) => w.date === dateStr);
                const consumed = water?.glassesConsumed || 0;
                const goal = water?.dailyGoal || 8;
                const percentage = (consumed / goal) * 100;

                return (
                  <div key={dateStr}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-white/70">
                        {format(date, "EEE, MMM d")}
                      </span>
                      <span className="text-white/90 font-bold">
                        {consumed}/{goal}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor:
                            percentage >= 100
                              ? "#52B788"
                              : percentage >= 70
                              ? "#4CC9F0"
                              : "#FFD700",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
        style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
      >
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: PILLAR.color }} />
          Nutrition Metrics Today
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          <CircularProgress
            value={todayWaterGlasses}
            max={todayWaterGoal}
            size={140}
            strokeWidth={10}
            color="#4CC9F0"
            label={`${todayWaterGlasses}/${todayWaterGoal}`}
            subtitle="Water today"
            showPercentage={false}
            icon={<Droplets />}
          />

          <CircularProgress
            value={mealQualityRate}
            max={100}
            size={140}
            strokeWidth={10}
            color={PILLAR.color}
            label="Healthy Meals"
            subtitle="Last 7 days"
            icon={<Utensils />}
          />

          <CircularProgress
            value={todayMeals.length}
            max={4}
            size={140}
            strokeWidth={10}
            color="#FFD700"
            label={`${todayMeals.length} meals`}
            subtitle="Logged today"
            showPercentage={false}
            icon={<Calendar />}
          />
        </div>
      </div>

      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No nutrition activity logged yet"
        emptyIcon={Utensils}
        emptyAction={
          <Button
            onClick={() => setShowMealLogger(true)}
            className="bg-gradient-to-r from-[#52B788] to-[#3CB371] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Meal
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard
          icon={Utensils}
          title="Log Meal"
          description="Track what you're eating"
          stats={`${meals.length} total meals`}
          color={PILLAR.color}
          onClick={() => setShowMealLogger(true)}
        />
        <ActionCard
          icon={Droplets}
          title="Water Tracker"
          description={`${todayWaterGlasses}/${todayWaterGoal} glasses today`}
          stats={`${waterStreak} day streak`}
          color="#4CC9F0"
          onClick={() => {}}
        />
      </div>

      {showMealLogger && (
        <MealLogger
          onClose={() => setShowMealLogger(false)}
          onSave={(data) => saveMealMutation.mutateAsync(data)}
        />
      )}

      {selectedLog && detailModalType === "meal" && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color={PILLAR.color}
          icon={Utensils}
          title="Meal Details"
          fields={[
            {
              key: "mealType",
              label: "Meal Type",
              icon: Calendar,
              color: "#FFD700",
              render: (value) => {
                const type = MEAL_TYPES.find((t) => t.value === value);
                return (
                  <span className="text-lg capitalize text-white/90">
                    {type?.emoji} {value}
                  </span>
                );
              },
            },
            {
              key: "quality",
              label: "Quality",
              icon: TrendingUp,
              color:
                selectedLog.quality === "healthy"
                  ? "#52B788"
                  : selectedLog.quality === "moderate"
                  ? "#FFD700"
                  : "#FF5733",
              render: (value) => (
                <span className="text-lg capitalize text-white/90">
                  {value}
                </span>
              ),
            },
            {
              key: "description",
              label: "Description",
              icon: Utensils,
              color: "#4CC9F0",
            },
            {
              key: "portionSize",
              label: "Portion Size",
              icon: BarChart,
              color: "#7C3AED",
            },
            {
              key: "satisfactionLevel",
              label: "Satisfaction",
              icon: CheckCircle2,
              color: "#FF69B4",
              unit: "/10",
            },
            {
              key: "ingredients",
              label: "Key Ingredients",
              icon: Apple,
              color: "#52B788",
            },
          ]}
        />
      )}
    </PillarPage>
  );
}
