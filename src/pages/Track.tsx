import { api } from "@/utils/apiClient";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PillarAccessGuard from "@/components/shared/PillarAccessGuard";
import QuickLogDiet from "@/components/shared/QuickLogDiet";
import QuickLogExercise from "@/components/shared/QuickLogExercise";
import AuthGuard from "@/components/shared/AuthGuard";
import { useReliableMutation } from "@/hooks/useReliableMutation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  EntrySchema,
  UserSchema,
  type EntryProps,
  type UserProps,
} from "@/models";
import { arrayFromPayload, parseArrayAs, parseAs } from "@/models/runtime";
import { sanitizeText } from "@/utils/security";

const PILLARS = {
  sleep: {
    name: "Sleep",
    color: "#6B46C1",
    icon: "🌙",
    coach: "Dr. Luna",
    quickQuestions: [
      "Why am I tired?",
      "Improve sleep quality",
      "Best bedtime for me",
    ],
  },
  diet: {
    name: "Diet",
    color: "#52B788",
    icon: "🥗",
    coach: "Chef Nourish",
    quickQuestions: ["Meal ideas", "Nutrition tips", "Calorie guidance"],
  },
  exercise: {
    name: "Exercise",
    color: "#FF5733",
    icon: "💪",
    coach: "Coach Phoenix",
    quickQuestions: ["Workout plan", "Form check", "Motivation boost"],
  },
  physical_health: {
    name: "Physical Health",
    color: "#FF7F50",
    icon: "❤️",
    coach: "Dr. Vita",
    quickQuestions: ["Check symptoms", "Health tips", "Preventive care"],
  },
  mental_health: {
    name: "Mental Health",
    color: "#4CC9F0",
    icon: "🧠",
    coach: "Dr. Serenity",
    quickQuestions: ["Reduce stress", "Improve mood", "Mindfulness guide"],
  },
  finances: {
    name: "Finances",
    color: "#2E8B57",
    icon: "💰",
    coach: "Advisor Prosper",
    quickQuestions: ["Budget help", "Savings tips", "Financial plan"],
  },
  social: {
    name: "Social",
    color: "#FFD700",
    icon: "👥",
    coach: "Coach Connect",
    quickQuestions: ["Improve relationships", "Social tips", "Make friends"],
  },
  spirituality: {
    name: "Spirituality",
    color: "#7C3AED",
    icon: "✨",
    coach: "Guide Zenith",
    quickQuestions: ["Find purpose", "Meditation guide", "Spiritual growth"],
  },
} as const;

type PillarId = keyof typeof PILLARS;
type PillarEntryInput = Record<string, number | string | boolean | undefined>;

type TrackContentProps = {
  user: UserProps;
};

const safeText = (value: unknown, fallback = "") =>
  sanitizeText(value, fallback);

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function calculatePillarScore(pillar: PillarId, data: PillarEntryInput) {
  let score = 0;

  switch (pillar) {
    case "sleep": {
      const hours = toNumber(data.sleep_hours, 0);
      const quality = toNumber(data.sleep_quality, 5);
      const hoursScore =
        hours >= 7 && hours <= 9
          ? 100
          : hours >= 6 && hours < 7
          ? 70
          : hours > 9
          ? 75
          : Math.min(hours * 15, 60);
      const qualityScore = quality * 10;
      score = Math.round(hoursScore * 0.5 + qualityScore * 0.5);
      break;
    }
    case "diet": {
      const mealQuality = toNumber(data.meal_quality, 5);
      score = Math.round(mealQuality * 10);
      const water = toNumber(data.water_glasses, 0);
      if (water >= 8) score = Math.min(score + 10, 100);
      else if (water >= 5) score = Math.min(score + 5, 100);
      break;
    }
    case "exercise": {
      const minutes = toNumber(data.exercise_minutes, 0);
      const minutesScore =
        minutes >= 30
          ? 100
          : minutes >= 20
          ? 70
          : Math.round((minutes / 30) * 100);
      const intensity =
        typeof data.exercise_intensity === "string"
          ? data.exercise_intensity
          : "moderate";
      const intensityMultiplier =
        intensity === "intense" ? 1.1 : intensity === "light" ? 0.9 : 1.0;
      score = Math.min(Math.round(minutesScore * intensityMultiplier), 100);
      break;
    }
    case "physical_health":
      score = Math.round(toNumber(data.physical_feeling, 5) * 10);
      break;
    case "mental_health": {
      const moodScore = toNumber(data.mood_rating, 5) * 10;
      const stressScore = (10 - toNumber(data.stress_level, 5)) * 10;
      const mindfulnessBonus = data.mindfulness_practiced ? 10 : 0;
      score = Math.min(
        Math.round(moodScore * 0.5 + stressScore * 0.4 + mindfulnessBonus),
        100
      );
      break;
    }
    case "finances": {
      const confidenceScore = toNumber(data.financial_confidence, 5) * 10;
      const budgetBonus = data.budget_adherence ? 10 : -5;
      const savingsBonus = data.saved_money ? 5 : 0;
      score = Math.max(
        0,
        Math.min(confidenceScore + budgetBonus + savingsBonus, 100)
      );
      break;
    }
    case "social": {
      const quality = toNumber(data.social_quality, 5);
      const interactions = toNumber(data.social_interactions, 0);
      score = Math.round(quality * 10);
      if (interactions >= 3) score = Math.min(score + 10, 100);
      else if (interactions >= 1) score = Math.min(score + 5, 100);
      break;
    }
    case "spirituality": {
      const connectionScore = toNumber(data.spiritual_connection, 5) * 10;
      const practiceBonus = data.spiritual_practice ? 15 : 0;
      const gratitudeBonus = data.gratitude_logged ? 10 : 0;
      score = Math.min(connectionScore + practiceBonus + gratitudeBonus, 100);
      break;
    }
  }

  return Math.max(0, Math.min(Math.round(score), 100));
}

function TrackContent({ user }: TrackContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const paramPillar = urlParams.get("pillar");
  const fallbackPillar: PillarId = "sleep";
  const pillarId = (
    paramPillar && paramPillar in PILLARS ? paramPillar : fallbackPillar
  ) as PillarId;
  const pillar = PILLARS[pillarId];

  const [formData, setFormData] = useState<PillarEntryInput>({});
  const [notes, setNotes] = useState("");
  const [showQuickLog, setShowQuickLog] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const { data: entries = [], isLoading: entriesLoading } = useQuery<
    ReadonlyArray<EntryProps>
  >({
    queryKey: ["entries", user?.email, pillarId],
    queryFn: async () => {
      if (!user?.email) {
        return [];
      }
      const response = await api.getEntries({
        pillar: pillarId,
        created_by: user.email,
      });
      const normalized = arrayFromPayload(response);
      return parseArrayAs(EntrySchema, normalized);
    },
    enabled: !!user?.email,
    staleTime: 30000,
    initialData: [] as EntryProps[],
  });

  const todayEntry = entries.find((e) => e.date === today);
  const yesterdayEntry = entries.find((e) => e.date === yesterday);
  const recentEntries = entries.slice(0, 7);
  const weekAgo = entries.find(
    (e) => e.date === format(subDays(new Date(), 7), "yyyy-MM-dd")
  );
  const trend = todayEntry && weekAgo ? todayEntry.score - weekAgo.score : 0;

  const saveMutation = useReliableMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) {
        throw new Error("You're offline. Please check your connection.");
      }

      const score = calculatePillarScore(pillarId, data);
      const entryData = {
        pillar: pillarId,
        date: today,
        score: score,
        notes: notes,
        ...data,
      };

      let pointsToAward = 0;

      if (todayEntry) {
        return await api.updateEntry(todayEntry.id, entryData);
      } else {
        pointsToAward += 10;
        if (score > 80) pointsToAward += 100;

        await api.authUpdateMe({
          total_check_ins: (user?.total_check_ins || 0) + 1,
          points: (user?.points || 0) + pointsToAward,
          last_points_calculation: new Date().toISOString(),
        });

        return await api.createEntry(entryData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({
        queryKey: ["entries", user?.email, pillarId],
      });
      setFormData({});
      setNotes("");
    },
    successMessage: "✓ Entry saved successfully",
    maxRetries: 3,
  });

  const handleSubmit = () => {
    if (Object.keys(formData).length === 0) {
      toast.error("Please fill in at least one field");
      return;
    }
    saveMutation.mutate(formData);
  };

  if (!pillar) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center text-white">
          <p>Pillar not found</p>
          <Button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusMessage = todayEntry
    ? todayEntry.score >= 90
      ? "Excellent! 🌟"
      : todayEntry.score >= 75
      ? "Great work! 💫"
      : todayEntry.score >= 60
      ? "Good progress 👍"
      : todayEntry.score >= 40
      ? "Room to improve 📈"
      : "Needs attention 🎯"
    : "Not tracked today";

  return (
    <PillarAccessGuard pillarId={pillarId}>
      <div className="min-h-screen pb-24 px-6 pt-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{pillar.icon}</span>
                <h1 className="text-2xl font-bold text-white">{pillar.name}</h1>
              </div>
            </div>
          </div>

          {/* Current Score Display */}
          <div className="mb-6">
            <div
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
              style={{ boxShadow: `0 0 30px ${pillar.color}40` }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ backgroundColor: pillar.color, filter: "blur(40px)" }}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-white/60 mb-1">
                      Current Score
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-5xl font-bold"
                        style={{ color: pillar.color }}
                      >
                        {todayEntry?.score || 0}
                      </span>
                      <span className="text-2xl text-white/40">/100</span>
                    </div>
                  </div>
                  {trend !== 0 && (
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                        trend > 0
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {trend > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {trend > 0 ? "+" : ""}
                        {trend}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-white/80 mb-3">{statusMessage}</div>
                <div className="text-sm text-white/40">
                  {format(new Date(), "MMMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* Coach Section */}
          <div
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-6"
            style={{ boxShadow: `0 0 20px ${pillar.color}30` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: `${pillar.color}30`,
                    boxShadow: `0 0 15px ${pillar.color}40`,
                  }}
                >
                  {pillar.icon}
                </div>
                <div>
                  <div className="text-white font-bold">{pillar.coach}</div>
                  <div className="text-sm text-green-400 flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-current" />
                    Online • Ready to help
                  </div>
                </div>
              </div>
              <Button
                onClick={() =>
                  navigate(createPageUrl("Coach") + `?pillar=${pillarId}`)
                }
                className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg"
                style={{ boxShadow: "0 0 15px rgba(212, 175, 55, 0.3)" }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Coach
              </Button>
            </div>
          </div>

          {/* Quick Log Floating Button - Only for Diet & Exercise */}
          {(pillarId === "diet" || pillarId === "exercise") &&
            !showQuickLog && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowQuickLog(true)}
                className="fixed bottom-28 right-6 z-30 w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${pillar.color}, ${pillar.color}dd)`,
                  boxShadow: `0 0 30px ${pillar.color}99`,
                }}
              >
                ⚡
              </motion.button>
            )}

          {/* Quick Log Panel */}
          {showQuickLog && (pillarId === "diet" || pillarId === "exercise") && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-20 left-0 right-0 z-40 bg-[#0A1628]/95 backdrop-blur-lg border-t border-white/10 p-6"
              style={{ boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Quick Log {pillarId === "diet" ? "Meal" : "Workout"}
                  </h3>
                  <button
                    onClick={() => setShowQuickLog(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {pillarId === "diet" && (
                  <QuickLogDiet
                    onSuccess={() => {
                      setShowQuickLog(false);
                      queryClient.invalidateQueries({ queryKey: ["entries"] });
                      queryClient.invalidateQueries({
                        queryKey: ["entries", user?.email, pillarId],
                      });
                    }}
                    yesterdayValue={yesterdayEntry?.meal_quality}
                    user={user}
                  />
                )}

                {pillarId === "exercise" && (
                  <QuickLogExercise
                    onSuccess={() => {
                      setShowQuickLog(false);
                      queryClient.invalidateQueries({ queryKey: ["entries"] });
                      queryClient.invalidateQueries({
                        queryKey: ["entries", user?.email, pillarId],
                      });
                    }}
                    yesterdayValue={
                      yesterdayEntry
                        ? {
                            minutes: yesterdayEntry.exercise_minutes,
                            intensity: yesterdayEntry.exercise_intensity,
                            label: `${yesterdayEntry.exercise_minutes} min (${yesterdayEntry.exercise_intensity})`,
                          }
                        : null
                    }
                    user={user}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Quick Log Form */}
          <div
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6"
            style={{ boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {pillarId === "diet" || pillarId === "exercise"
                  ? "Detailed Log"
                  : "Quick Log"}
              </h2>
              {(pillarId === "diet" || pillarId === "exercise") && (
                <button
                  onClick={() => setShowQuickLog(true)}
                  className="text-sm px-3 py-1 rounded-full hover:opacity-80 transition-all font-bold"
                  style={{
                    backgroundColor: `${pillar.color}20`,
                    border: `1px solid ${pillar.color}40`,
                    color: pillar.color,
                  }}
                >
                  ⚡ Quick Log
                </button>
              )}
            </div>

            {pillarId === "sleep" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Hours Slept</Label>
                  <Slider
                    value={[formData.sleep_hours || 7]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, sleep_hours: value })
                    }
                    min={0}
                    max={12}
                    step={0.5}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.sleep_hours || 7} hours
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">
                    Sleep Quality (1-10)
                  </Label>
                  <Slider
                    value={[formData.sleep_quality || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, sleep_quality: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.sleep_quality || 5}/10
                  </div>
                </div>
              </div>
            )}

            {pillarId === "diet" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    Meal Quality Today (1-10)
                  </Label>
                  <Slider
                    value={[formData.meal_quality || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, meal_quality: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.meal_quality || 5}/10
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">
                    Glasses of Water
                  </Label>
                  <Slider
                    value={[formData.water_glasses || 4]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, water_glasses: value })
                    }
                    min={0}
                    max={15}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.water_glasses || 4} glasses
                  </div>
                </div>
              </div>
            )}

            {pillarId === "exercise" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    Active Minutes
                  </Label>
                  <Slider
                    value={[formData.exercise_minutes || 30]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, exercise_minutes: value })
                    }
                    min={0}
                    max={120}
                    step={5}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.exercise_minutes || 30} minutes
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Intensity</Label>
                  <div className="flex gap-2">
                    {["light", "moderate", "intense"].map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            exercise_intensity: intensity,
                          })
                        }
                        className={`flex-1 py-2 rounded-lg border transition-all ${
                          formData.exercise_intensity === intensity
                            ? "bg-white/20 border-white/40 text-white"
                            : "bg-white/5 border-white/10 text-white/60"
                        }`}
                      >
                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {pillarId === "physical_health" && (
              <div>
                <Label className="text-white mb-2 block">
                  How do you feel physically? (1-10)
                </Label>
                <Slider
                  value={[formData.physical_feeling || 5]}
                  onValueChange={([value]) =>
                    setFormData({ ...formData, physical_feeling: value })
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="mb-2"
                />
                <div className="text-white/60 text-sm">
                  {formData.physical_feeling || 5}/10
                </div>
              </div>
            )}

            {pillarId === "mental_health" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    Mood Rating (1-10)
                  </Label>
                  <Slider
                    value={[formData.mood_rating || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, mood_rating: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.mood_rating || 5}/10
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">
                    Stress Level (1-10)
                  </Label>
                  <Slider
                    value={[formData.stress_level || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, stress_level: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.stress_level || 5}/10
                  </div>
                </div>
                <div>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        mindfulness_practiced: !formData.mindfulness_practiced,
                      })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.mindfulness_practiced
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {formData.mindfulness_practiced ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    Practiced mindfulness/meditation today
                  </button>
                </div>
              </div>
            )}

            {pillarId === "finances" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    Financial Confidence (1-10)
                  </Label>
                  <Slider
                    value={[formData.financial_confidence || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, financial_confidence: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.financial_confidence || 5}/10
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        budget_adherence: !formData.budget_adherence,
                      })
                    }
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.budget_adherence
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {formData.budget_adherence ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    Stayed within budget today
                  </button>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        saved_money: !formData.saved_money,
                      })
                    }
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.saved_money
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {formData.saved_money ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    Saved money today
                  </button>
                </div>
              </div>
            )}

            {pillarId === "social" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    Social Connection Quality (1-10)
                  </Label>
                  <Slider
                    value={[formData.social_quality || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, social_quality: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.social_quality || 5}/10
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">
                    Meaningful Interactions
                  </Label>
                  <Slider
                    value={[formData.social_interactions || 1]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, social_interactions: value })
                    }
                    min={0}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.social_interactions || 1} interactions
                  </div>
                </div>
              </div>
            )}

            {pillarId === "spirituality" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    Spiritual Connection (1-10)
                  </Label>
                  <Slider
                    value={[formData.spiritual_connection || 5]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, spiritual_connection: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-white/60 text-sm">
                    {formData.spiritual_connection || 5}/10
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        spiritual_practice: !formData.spiritual_practice,
                      })
                    }
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.spiritual_practice
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {formData.spiritual_practice ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    Completed spiritual practice
                  </button>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        gratitude_logged: !formData.gratitude_logged,
                      })
                    }
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.gratitude_logged
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {formData.gratitude_logged ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    Logged gratitude
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Label className="text-white mb-2 block">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional thoughts..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !navigator.onLine}
              className="w-full mt-6 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg disabled:opacity-50"
              style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
            >
              {!navigator.onLine
                ? "Offline - Check Connection"
                : saveMutation.isPending
                ? "Saving..."
                : todayEntry
                ? "Update Entry"
                : "Save Entry"}
            </Button>
          </div>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Recent Entries
              </h3>
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                  >
                    <div>
                      <div className="text-white font-bold">
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </div>
                      {entry.notes && (
                        <div className="text-white/60 text-sm mt-1">
                          {safeText(entry.notes)}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: pillar.color }}
                    >
                      {entry.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PillarAccessGuard>
  );
}

export default function Track() {
  return <AuthGuard>{(user) => <TrackContent user={user} />}</AuthGuard>;
}
