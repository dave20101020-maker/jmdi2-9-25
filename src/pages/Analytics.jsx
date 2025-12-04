import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { format, subDays, differenceInDays, parseISO } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  GripVertical,
  X,
  Maximize2,
  Flame,
  Trophy,
  Smile,
  Lightbulb,
  Calendar,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import NSButton from "@/components/ui/NSButton";
import InputField from "@/components/ui/InputField";
import AIThinkingOverlay from "@/ai/AIThinkingOverlay";
import HelpTooltip from "@/components/shared/HelpTooltip";
import { toast } from "sonner";

const PILLARS = [
  { id: "sleep", name: "Sleep", color: "#6B46C1", icon: "🌙" },
  { id: "diet", name: "Diet", color: "#52B788", icon: "🥗" },
  { id: "exercise", name: "Exercise", color: "#FF5733", icon: "💪" },
  {
    id: "physical_health",
    name: "Physical Health",
    color: "#FF7F50",
    icon: "❤️",
  },
  { id: "mental_health", name: "Mental Health", color: "#4CC9F0", icon: "🧠" },
  { id: "finances", name: "Finances", color: "#2E8B57", icon: "💰" },
  { id: "social", name: "Social", color: "#FFD700", icon: "👥" },
  { id: "spirituality", name: "Spirituality", color: "#7C3AED", icon: "✨" },
  { id: "overall", name: "Life Score", color: "#D4AF37", icon: "⭐" },
];

const TIME_RANGES = [
  { id: "7", label: "7 Days" },
  { id: "30", label: "30 Days" },
  { id: "90", label: "90 Days" },
  { id: "365", label: "1 Year" },
  { id: "custom", label: "Custom Range" },
];

function TrendChart({
  entries,
  selectedPillar,
  timeRange,
  customStartDate,
  customEndDate,
  accessiblePillars,
}) {
  let chartData = [];
  let days;

  if (timeRange === "custom" && customStartDate && customEndDate) {
    // Custom date range
    const start = parseISO(customStartDate);
    const end = parseISO(customEndDate);
    days = differenceInDays(end, start) + 1;

    if (days > 365) {
      return (
        <div className="flex items-center justify-center h-64 text-white/60">
          <p>Please select a range of 365 days or less</p>
        </div>
      );
    }

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const date = format(currentDate, "yyyy-MM-dd");
      const dayEntries = entries.filter((e) => e.date === date);

      if (selectedPillar === "overall") {
        let totalScore = 0;
        let count = 0;
        accessiblePillars.forEach((p) => {
          const entry = dayEntries.find((e) => e.pillar === p.id);
          if (entry) {
            totalScore += entry.score;
            count++;
          }
        });
        chartData.push({
          date: format(currentDate, "MMM d"),
          score: count > 0 ? Math.round(totalScore / count) : null,
        });
      } else {
        const entry = dayEntries.find((e) => e.pillar === selectedPillar);
        chartData.push({
          date: format(currentDate, "MMM d"),
          score: entry?.score || null,
        });
      }
    }
  } else {
    // Predefined range
    days = parseInt(timeRange);

    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
      const dayEntries = entries.filter((e) => e.date === date);

      if (selectedPillar === "overall") {
        let totalScore = 0;
        let count = 0;
        accessiblePillars.forEach((p) => {
          const entry = dayEntries.find((e) => e.pillar === p.id);
          if (entry) {
            totalScore += entry.score;
            count++;
          }
        });
        chartData.push({
          date: format(new Date(date), "MMM d"),
          score: count > 0 ? Math.round(totalScore / count) : null,
        });
      } else {
        const entry = dayEntries.find((e) => e.pillar === selectedPillar);
        chartData.push({
          date: format(new Date(date), "MMM d"),
          score: entry?.score || null,
        });
      }
    }
  }

  // Calculate week-over-week change
  const lastWeekData = chartData.slice(-7).filter((d) => d.score !== null);
  const prevWeekData = chartData.slice(-14, -7).filter((d) => d.score !== null);

  const lastWeekAvg =
    lastWeekData.length > 0
      ? lastWeekData.reduce((sum, d) => sum + d.score, 0) / lastWeekData.length
      : 0;
  const prevWeekAvg =
    prevWeekData.length > 0
      ? prevWeekData.reduce((sum, d) => sum + d.score, 0) / prevWeekData.length
      : 0;

  const weekChange =
    prevWeekAvg > 0 ? ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100 : 0;

  const pillar = PILLARS.find((p) => p.id === selectedPillar);

  return (
    <div className="relative">
      {Math.abs(weekChange) > 0.1 && chartData.length >= 14 && (
        <div
          className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
            weekChange > 0
              ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "bg-red-500/20 text-red-400 border border-red-500/40"
          }`}
        >
          {weekChange > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(weekChange).toFixed(1)}% WoW
        </div>
      )}

      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1f35",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={pillar?.color}
            strokeWidth={3}
            dot={{ fill: pillar?.color, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CorrelationCard({ correlation, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all text-left"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{correlation.pillar1Icon}</span>
          <TrendingUp className="w-4 h-4 text-green-400" />
          <ArrowRight className="w-4 h-4 text-white/60" />
          <span className="text-2xl">{correlation.pillar2Icon}</span>
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-bold ${
            correlation.strength > 0.7
              ? "bg-green-500/20 text-green-400"
              : correlation.strength > 0.5
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-orange-500/20 text-orange-400"
          }`}
        >
          {correlation.strength.toFixed(2)}
        </div>
      </div>

      <p className="text-white font-semibold mb-3">
        {correlation.pillar1} → {correlation.pillar2}
      </p>

      <p className="text-white/70 text-sm mb-3">{correlation.insight}</p>

      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={correlation.sparklineData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={correlation.color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-1 text-xs text-white/60 mt-2">
        <Maximize2 className="w-3 h-3" />
        Tap to view details
      </div>
    </button>
  );
}

function ScatterPlotModal({ correlation, onClose, entries }) {
  const scatterData = entries
    .filter(
      (e) =>
        e.pillar === correlation.pillar1Id || e.pillar === correlation.pillar2Id
    )
    .reduce((acc, entry) => {
      const existing = acc.find((d) => d.date === entry.date);
      if (existing) {
        if (entry.pillar === correlation.pillar1Id) existing.x = entry.score;
        if (entry.pillar === correlation.pillar2Id) existing.y = entry.score;
      } else {
        acc.push({
          date: entry.date,
          x: entry.pillar === correlation.pillar1Id ? entry.score : null,
          y: entry.pillar === correlation.pillar2Id ? entry.score : null,
        });
      }
      return acc;
    }, [])
    .filter((d) => d.x !== null && d.y !== null);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scatter-title"
    >
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-2xl w-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              id="scatter-title"
              className="text-2xl font-bold text-white mb-2"
            >
              {correlation.pillar1} vs {correlation.pillar2}
            </h2>
            <p className="text-white/70">{correlation.insight}</p>
            <div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold inline-block">
              Correlation: {correlation.strength.toFixed(2)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scatter plot"
            className="text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              type="number"
              dataKey="x"
              name={correlation.pillar1}
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              label={{
                value: correlation.pillar1,
                position: "bottom",
                fill: "rgba(255,255,255,0.7)",
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={correlation.pillar2}
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              label={{
                value: correlation.pillar2,
                angle: -90,
                position: "left",
                fill: "rgba(255,255,255,0.7)",
              }}
            />
            <ZAxis range={[100, 100]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "#1a1f35",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Scatter data={scatterData} fill={correlation.color} />
          </ScatterChart>
        </ResponsiveContainer>

        <NSButton
          fullWidth
          variant="secondary"
          className="mt-4"
          onClick={onClose}
        >
          Close
        </NSButton>
      </div>
    </div>
  );
}

function WidgetStreak({ user }) {
  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-orange-500/30 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Current Streak</h3>
          <p className="text-white/60 text-sm">Keep it going!</p>
        </div>
      </div>
      <div className="text-5xl font-bold text-orange-400">
        {user?.streak_days || 0}
      </div>
      <p className="text-white/70 text-sm mt-2">consecutive days</p>
    </div>
  );
}

function WidgetPoints({ user }) {
  return (
    <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#D4AF37]/30 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-white font-bold">Total Points</h3>
          <p className="text-white/60 text-sm">Your achievements</p>
        </div>
      </div>
      <div className="text-5xl font-bold text-[#F4D03F]">
        {user?.points || 0}
      </div>
      <p className="text-white/70 text-sm mt-2">points earned</p>
    </div>
  );
}

function WidgetMood({ recentMoods }) {
  const avgMood =
    recentMoods.length > 0
      ? Math.round(
          recentMoods.reduce((sum, m) => sum + m.moodScore, 0) /
            recentMoods.length
        )
      : 50;

  const moodEmoji =
    avgMood > 75 ? "😄" : avgMood > 50 ? "🙂" : avgMood > 25 ? "😐" : "😟";

  return (
    <div className="bg-gradient-to-br from-[#4CC9F0]/20 to-[#7C3AED]/20 border border-[#4CC9F0]/40 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#4CC9F0]/30 flex items-center justify-center">
          <Smile className="w-6 h-6 text-[#4CC9F0]" />
        </div>
        <div>
          <h3 className="text-white font-bold">Mood Average</h3>
          <p className="text-white/60 text-sm">Last 7 days</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-5xl">{moodEmoji}</div>
        <div>
          <div className="text-4xl font-bold text-[#4CC9F0]">{avgMood}</div>
          <p className="text-white/70 text-sm">out of 100</p>
        </div>
      </div>
    </div>
  );
}

function WidgetRadar({ entries, accessiblePillars }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const radarData = accessiblePillars.map((pillar) => {
    const entry = entries.find(
      (e) => e.pillar === pillar.id && e.date === today
    );
    return {
      pillar: pillar.name.split(" ")[0],
      score: entry?.score || 0,
      fullMark: 100,
    };
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-white font-bold mb-4">Today's Balance</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.5)" }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#D4AF37"
            fill="#D4AF37"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const AVAILABLE_WIDGETS = [
  { id: "streak", label: "Streak", icon: "🔥" },
  { id: "points", label: "Points", icon: "🏆" },
  { id: "mood", label: "Mood Ring", icon: "😊" },
  { id: "radar", label: "Pillar Radar", icon: "📊" },
];

export default function Analytics() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState("overall");
  const [timeRange, setTimeRange] = useState("30");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCorrelation, setSelectedCorrelation] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [loadingCorrelations, setLoadingCorrelations] = useState(false);
  const [widgets, setWidgets] = useState(["streak", "points", "mood", "radar"]);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [authError, setAuthError] = useState(false); // New state variable

  useEffect(() => {
    async function getUser() {
      try {
        const currentUser = await api.authMe();
        setUser(currentUser);
        setWidgets(
          currentUser.dashboard_widgets || ["streak", "points", "mood", "radar"]
        );
      } catch (error) {
        console.error("Auth error:", error);
        setAuthError(true);
        // Redirect to login
        // TODO: Redirect to login
        // api.logout();(window.location.pathname);
      }
    }
    getUser();
  }, []);

  // Set default custom dates when switching to custom range
  useEffect(() => {
    if (timeRange === "custom" && !customStartDate && !customEndDate) {
      const end = format(new Date(), "yyyy-MM-dd");
      const start = format(subDays(new Date(), 29), "yyyy-MM-dd"); // Default 30 days
      setCustomStartDate(start);
      setCustomEndDate(end);
    }
  }, [timeRange]);

  const { data: entries = [] } = useQuery({
    queryKey: ["entries"],
    queryFn: () => api.getEntries({ created_by: user?.email }, "-date", 365),
    enabled: !!user,
    initialData: [],
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const subs = await api.getSubscription({ userId: user?.email });
      return subs[0] || null;
    },
    enabled: !!user,
  });

  const { data: recentMoods = [] } = useQuery({
    queryKey: ["recentMoods"],
    queryFn: () => api.getMoods({ userId: user?.email }, "-timestamp", 7),
    enabled: !!user,
    initialData: [],
  });

  const isPremium =
    subscription?.tier === "Premium" && subscription?.status === "active";
  const isTrial =
    subscription?.tier === "Trial" && subscription?.status === "trial";
  const hasFullAccess = isPremium || isTrial;

  const selectedPillarsIds = user?.selected_pillars || [];
  const accessiblePillars = hasFullAccess
    ? PILLARS.filter((p) => p.id !== "overall")
    : PILLARS.filter((p) => selectedPillarsIds.includes(p.id));

  const generateCorrelations = async () => {
    if (entries.length < 14) {
      toast.error("Need at least 14 days of data to calculate correlations");
      return;
    }

    setLoadingCorrelations(true);

    try {
      const pillarPairs = [];
      for (let i = 0; i < accessiblePillars.length; i++) {
        for (let j = i + 1; j < accessiblePillars.length; j++) {
          const p1 = accessiblePillars[i];
          const p2 = accessiblePillars[j];

          const dates = [...new Set(entries.map((e) => e.date))];
          const pairs = dates
            .map((date) => {
              const e1 = entries.find(
                (e) => e.date === date && e.pillar === p1.id
              );
              const e2 = entries.find(
                (e) => e.date === date && e.pillar === p2.id
              );
              return e1 && e2 ? { x: e1.score, y: e2.score } : null;
            })
            .filter(Boolean);

          if (pairs.length >= 7) {
            const n = pairs.length;
            const sumX = pairs.reduce((s, p) => s + p.x, 0);
            const sumY = pairs.reduce((s, p) => s + p.y, 0);
            const sumXY = pairs.reduce((s, p) => s + p.x * p.y, 0);
            const sumX2 = pairs.reduce((s, p) => s + p.x * p.x, 0);
            const sumY2 = pairs.reduce((s, p) => s + p.y * p.y, 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt(
              (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
            );
            const correlation = denominator !== 0 ? numerator / denominator : 0;

            if (Math.abs(correlation) > 0.4) {
              pillarPairs.push({
                pillar1: p1.name,
                pillar2: p2.name,
                pillar1Id: p1.id,
                pillar2Id: p2.id,
                pillar1Icon: p1.icon,
                pillar2Icon: p2.icon,
                strength: Math.abs(correlation),
                color: p1.color,
                sparklineData: pairs.slice(-30).map((p, i) => ({ value: p.x })),
              });
            }
          }
        }
      }

      pillarPairs.sort((a, b) => b.strength - a.strength);
      const topPairs = pillarPairs.slice(0, 5);

      for (const pair of topPairs) {
        try {
          const prompt = `Generate a brief, actionable insight (max 100 chars) about the correlation between ${
            pair.pillar1
          } and ${pair.pillar2} with strength ${pair.strength.toFixed(
            2
          )}. Focus on what the user can do.`;

          const result = await api.aiCoach({ prompt });
          pair.insight =
            result.output ||
            result ||
            `${pair.pillar1} and ${pair.pillar2} are strongly connected`;
        } catch (error) {
          pair.insight = `${pair.pillar1} and ${pair.pillar2} show a strong connection`;
        }
      }

      setCorrelations(topPairs);
      toast.success("Correlations calculated!");
    } catch (error) {
      console.error("Error generating correlations:", error);
      toast.error("Failed to generate correlations");
    }

    setLoadingCorrelations(false);
  };

  useEffect(() => {
    if (entries.length >= 14 && correlations.length === 0) {
      generateCorrelations();
    }
  }, [entries]);

  const saveWidgetsMutation = useMutation({
    mutationFn: (newWidgets) =>
      api.authUpdateMe({ dashboard_widgets: newWidgets }),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      toast.success("Dashboard updated!");
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
    saveWidgetsMutation.mutate(items);
  };

  const addWidget = (widgetId) => {
    if (!widgets.includes(widgetId)) {
      const newWidgets = [...widgets, widgetId];
      setWidgets(newWidgets);
      saveWidgetsMutation.mutate(newWidgets);
    }
    setShowAddWidget(false);
  };

  const removeWidget = (widgetId) => {
    const newWidgets = widgets.filter((w) => w !== widgetId);
    setWidgets(newWidgets);
    saveWidgetsMutation.mutate(newWidgets);
  };

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case "streak":
        return <WidgetStreak user={user} />;
      case "points":
        return <WidgetPoints user={user} />;
      case "mood":
        return <WidgetMood recentMoods={recentMoods} />;
      case "radar":
        return (
          <WidgetRadar
            entries={entries}
            accessiblePillars={accessiblePillars}
          />
        );
      default:
        return null;
    }
  };

  const handleQuickRange = (range) => {
    setTimeRange(range);
    if (range !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const validateCustomDates = () => {
    if (!customStartDate || !customEndDate) {
      toast.error("Please select both start and end dates");
      return false;
    }

    const start = parseISO(customStartDate);
    const end = parseISO(customEndDate);

    if (start > end) {
      toast.error("Start date must be before end date");
      return false;
    }

    const days = differenceInDays(end, start) + 1;
    if (days > 365) {
      toast.error("Maximum range is 365 days");
      return false;
    }

    if (days < 2) {
      toast.error("Minimum range is 2 days");
      return false;
    }

    return true;
  };

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-white/60">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 animate-pulse" />
          <p className="text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-page pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header with Help */}
        <header className="ns-page__header text-left md:text-center">
          <div className="flex items-center justify-start md:justify-center gap-3 mb-3">
            <h1 className="ns-page__title">Insights</h1>
            <HelpTooltip
              title="Analytics & Insights"
              content="Track your progress over time, discover patterns with correlation analysis, and customize your dashboard with widgets that matter most to you."
              position="bottom"
            />
          </div>
          <p className="ns-page__subtitle">
            Discover patterns in your growth journey
          </p>
        </header>

        {/* Section 1: Trend Carousel */}
        <section className="mb-8" aria-labelledby="trends-heading">
          <div className="flex items-center gap-2 mb-4">
            <h2 id="trends-heading" className="text-xl font-bold text-white">
              Trends
            </h2>
            <HelpTooltip
              title="Trend Charts"
              content="Visualize your progress over time. The 'WoW' badge shows week-over-week change - helping you spot improvements or areas needing attention. Use custom date ranges to analyze specific periods!"
              position="bottom"
            />
          </div>

          {/* Time Range Chips */}
          <div
            className="flex gap-2 mb-4 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Time range selection"
          >
            {TIME_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => handleQuickRange(range.id)}
                role="tab"
                aria-selected={timeRange === range.id}
                aria-label={`View ${range.label} of data`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  timeRange === range.id
                    ? "bg-[#D4AF37] text-[#0A1628]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {range.id === "custom" && <Calendar className="w-4 h-4" />}
                {range.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Selector */}
          {timeRange === "custom" && (
            <div className="ns-data-panel mb-4 animate-in slide-in-from-top duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1 w-full">
                  <InputField
                    id="custom-start-date"
                    label={
                      <span className="flex items-center gap-2">
                        Start Date
                        <HelpTooltip
                          content="Select the beginning of your custom date range. You can analyze up to 365 days at a time."
                          position="top"
                        />
                      </span>
                    }
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate || format(new Date(), "yyyy-MM-dd")}
                    className="w-full"
                  />
                </div>

                <div className="flex-1 w-full">
                  <InputField
                    id="custom-end-date"
                    label="End Date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="w-full"
                  />
                </div>

                <NSButton
                  size="pill"
                  onClick={() => {
                    if (validateCustomDates()) {
                      toast.success("Custom range applied!");
                    }
                  }}
                >
                  Apply Range
                </NSButton>
              </div>

              {customStartDate && customEndDate && (
                <div className="mt-3 text-sm text-white/60 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Showing{" "}
                  {differenceInDays(
                    parseISO(customEndDate),
                    parseISO(customStartDate)
                  ) + 1}{" "}
                  days ({format(parseISO(customStartDate), "MMM d")} -{" "}
                  {format(parseISO(customEndDate), "MMM d, yyyy")})
                </div>
              )}
            </div>
          )}

          {/* Pillar Chips */}
          <div
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Pillar selection"
          >
            {PILLARS.map((pillar) => {
              if (
                pillar.id !== "overall" &&
                !accessiblePillars.find((p) => p.id === pillar.id)
              ) {
                return null;
              }
              return (
                <button
                  key={pillar.id}
                  onClick={() => setSelectedPillar(pillar.id)}
                  role="tab"
                  aria-selected={selectedPillar === pillar.id}
                  aria-label={`View ${pillar.name} trend`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedPillar === pillar.id
                      ? "border-2"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  style={
                    selectedPillar === pillar.id
                      ? {
                          backgroundColor: `${pillar.color}20`,
                          borderColor: pillar.color,
                          color: pillar.color,
                        }
                      : { color: "#fff" }
                  }
                >
                  <span aria-hidden="true">{pillar.icon}</span>
                  {pillar.name}
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6">
            <TrendChart
              entries={entries}
              selectedPillar={selectedPillar}
              timeRange={timeRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              accessiblePillars={accessiblePillars}
            />
          </div>
        </section>

        {/* Section 2: Correlation Cards */}
        {correlations.length > 0 && (
          <section className="mb-8" aria-labelledby="discoveries-heading">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2
                  id="discoveries-heading"
                  className="text-xl font-bold text-white"
                >
                  AI Discoveries
                </h2>
                <HelpTooltip
                  title="Correlation Analysis"
                  content="AI identifies connections between your pillars. A correlation of 0.7+ is strong - meaning when one improves, the other often does too. Use these insights to leverage your strongest areas!"
                  position="bottom"
                />
              </div>
              <button
                onClick={generateCorrelations}
                disabled={loadingCorrelations}
                aria-label="Refresh correlations"
                className="text-sm text-[#F4D03F] hover:text-[#D4AF37] font-bold"
              >
                {loadingCorrelations ? "Analyzing..." : "Refresh"}
              </button>
            </div>

            <div
              className="flex gap-4 overflow-x-auto pb-4"
              role="list"
              aria-label="Correlation insights"
            >
              {correlations.map((corr, idx) => (
                <div key={idx} role="listitem">
                  <CorrelationCard
                    correlation={corr}
                    onClick={() => setSelectedCorrelation(corr)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Custom Dashboard */}
        <section className="mb-8" aria-labelledby="dashboard-heading">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2
                id="dashboard-heading"
                className="text-xl font-bold text-white"
              >
                Your Dashboard
              </h2>
              <HelpTooltip
                title="Custom Dashboard"
                content="Drag to reorder widgets and click the X to remove them. Add new widgets with the button. Your layout is saved automatically!"
                position="bottom"
              />
            </div>
            <NSButton
              size="pill"
              icon={<Plus className="w-4 h-4" aria-hidden="true" />}
              aria-label="Add a widget to dashboard"
              onClick={() => setShowAddWidget(true)}
            >
              Add Widget
            </NSButton>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid md:grid-cols-2 gap-4"
                  role="list"
                  aria-label="Dashboard widgets"
                >
                  {widgets.map((widgetId, index) => (
                    <Draggable
                      key={widgetId}
                      draggableId={widgetId}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative group"
                          role="listitem"
                        >
                          <div
                            {...provided.dragHandleProps}
                            aria-label="Drag to reorder widget"
                            className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical
                              className="w-5 h-5 text-white/60"
                              aria-hidden="true"
                            />
                          </div>
                          <button
                            onClick={() => removeWidget(widgetId)}
                            aria-label="Remove widget"
                            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500/20 rounded-full hover:bg-red-500/40"
                          >
                            <X
                              className="w-4 h-4 text-red-400"
                              aria-hidden="true"
                            />
                          </button>
                          {renderWidget(widgetId)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>

        {/* Help Section */}
        <section className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                Understanding Your Analytics
              </h3>
              <div className="space-y-3 text-sm text-white/80">
                <div>
                  <strong className="text-white">Trends:</strong> Track how each
                  pillar changes over time. Look for upward trends as signs of
                  progress!
                </div>
                <div>
                  <strong className="text-white">Custom Date Ranges:</strong>{" "}
                  Select specific periods to analyze (e.g., a vacation,
                  stressful work week, or training period). Max 365 days.
                </div>
                <div>
                  <strong className="text-white">Correlations:</strong> When two
                  pillars move together, improving one often helps the other.
                  Use your strongest areas to boost weaker ones.
                </div>
                <div>
                  <strong className="text-white">Week-over-Week (WoW):</strong>{" "}
                  Shows percentage change from last week. Green = improvement,
                  Red = needs attention.
                </div>
                <div>
                  <strong className="text-white">Radar Chart:</strong> Shows
                  balance across all pillars. A balanced shape means
                  well-rounded growth!
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div
          className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-widget-title"
        >
          <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <h2
                id="add-widget-title"
                className="text-2xl font-bold text-white"
              >
                Add Widget
              </h2>
              <button
                onClick={() => setShowAddWidget(false)}
                aria-label="Close add widget dialog"
                className="text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div
              className="grid grid-cols-2 gap-3"
              role="list"
              aria-label="Available widgets"
            >
              {AVAILABLE_WIDGETS.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  disabled={widgets.includes(widget.id)}
                  aria-label={`Add ${widget.label} widget`}
                  aria-disabled={widgets.includes(widget.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    widgets.includes(widget.id)
                      ? "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                      : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-[#D4AF37]"
                  }`}
                >
                  <div className="text-3xl mb-2" aria-hidden="true">
                    {widget.icon}
                  </div>
                  <div className="text-white font-bold text-sm">
                    {widget.label}
                  </div>
                  {widgets.includes(widget.id) && (
                    <div className="text-xs text-white/60 mt-1">Added</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scatter Plot Modal */}
      {selectedCorrelation && (
        <ScatterPlotModal
          correlation={selectedCorrelation}
          onClose={() => setSelectedCorrelation(null)}
          entries={entries}
        />
      )}

      {loadingCorrelations && (
        <AIThinkingOverlay
          isVisible={true}
          message="Analyzing patterns in your data..."
        />
      )}
    </div>
  );
}
