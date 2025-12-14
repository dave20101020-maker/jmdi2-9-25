import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/index.js";
import {
  Calendar,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";

const PILLARS = {
  sleep: { name: "Sleep", color: "#6B46C1", icon: "🌙" },
  diet: { name: "Diet", color: "#52B788", icon: "🥗" },
  exercise: { name: "Exercise", color: "#FF5733", icon: "💪" },
  physical_health: { name: "Physical Health", color: "#FF7F50", icon: "❤️" },
  mental_health: { name: "Mental Health", color: "#4CC9F0", icon: "🧠" },
  finances: { name: "Finances", color: "#2E8B57", icon: "💰" },
  social: { name: "Social", color: "#FFD700", icon: "👥" },
  spirituality: { name: "Spirituality", color: "#7C3AED", icon: "✨" },
};

export default function WeeklyReflection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  // Get last week's date range (Monday to Sunday)
  const today = new Date();
  const lastSunday = subDays(today, today.getDay() || 7);
  const weekStart = format(
    startOfWeek(lastSunday, { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const weekEnd = format(
    endOfWeek(lastSunday, { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );

  const { data: activePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["activePlans"],
    queryFn: () =>
      api.getPlans(
        {
          created_by: user?.email,
          isActive: true,
        },
        "-created_date",
        100
      ),
    enabled: !!user,
    initialData: [],
  });

  // Check which plans already have reviews for this week
  const { data: existingReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["weeklyReviews", weekStart],
    queryFn: () =>
      api.getWeeklyReviews({
        created_by: user?.email,
        weekStartDate: weekStart,
      }),
    enabled: !!user,
    initialData: [],
  });

  const existingReviewPlanIds = existingReviews.map((r) => r.planId);
  const plansNeedingReview = activePlans.filter(
    (p) => !existingReviewPlanIds.includes(p.id)
  );

  const currentPlan = plansNeedingReview[currentPlanIndex];

  const saveMutation = useMutation({
    mutationFn: (reviewData) => api.createWeeklyReview(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(["weeklyReviews"]);

      // Move to next plan or finish
      if (currentPlanIndex < plansNeedingReview.length - 1) {
        setCurrentPlanIndex(currentPlanIndex + 1);
        setReviews({}); // Reset form
      } else {
        // All done!
        navigate(createPageUrl("Dashboard"));
      }
    },
  });

  const handleSubmit = () => {
    const review = reviews[currentPlan.id] || {};

    saveMutation.mutate({
      planId: currentPlan.id,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      whatWorked: review.whatWorked || "",
      whatDidntWork: review.whatDidntWork || "",
      overallRating: review.overallRating || 3,
      lessonsLearned: review.lessonsLearned || "",
      nextWeekFocus: review.nextWeekFocus || "",
    });
  };

  const handleSkip = () => {
    if (currentPlanIndex < plansNeedingReview.length - 1) {
      setCurrentPlanIndex(currentPlanIndex + 1);
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const updateReview = (field, value) => {
    setReviews((prev) => ({
      ...prev,
      [currentPlan.id]: {
        ...(prev[currentPlan.id] || {}),
        [field]: value,
      },
    }));
  };

  if (plansLoading || reviewsLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-9 w-64 mx-auto mb-3" />
            <Skeleton className="h-5 w-48 mx-auto" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-64 mx-auto rounded-full" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // All reviews complete or no active plans
  if (plansNeedingReview.length === 0 || !currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            All Caught Up! 🎉
          </h1>
          <p className="text-white/60 mb-8">
            {activePlans.length === 0
              ? "You don't have any active plans yet. Create a plan with your AI coach to get started!"
              : "You've completed all your weekly reflections. Great job staying on track!"}
          </p>
          <Button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const pillar = PILLARS[currentPlan.pillar];
  const currentReview = reviews[currentPlan.id] || {};

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/60 text-sm mb-4">
            <Calendar className="w-4 h-4" />
            Week of {format(new Date(weekStart), "MMM d")} -{" "}
            {format(new Date(weekEnd), "MMM d")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Weekly Reflection
          </h1>
          <p className="text-white/60">
            Plan {currentPlanIndex + 1} of {plansNeedingReview.length}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {plansNeedingReview.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentPlanIndex ? "w-8 bg-[#D4AF37]" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Plan Card */}
        <div
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8"
          style={{ boxShadow: `0 0 30px ${pillar.color}40` }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{
                backgroundColor: `${pillar.color}20`,
                boxShadow: `0 0 20px ${pillar.color}40`,
              }}
            >
              {pillar.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentPlan.planTitle}
              </h2>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${pillar.color}30`,
                  color: pillar.color,
                }}
              >
                {pillar.name}
              </span>
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="space-y-6">
            {/* What Worked */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                What worked well this week?
              </label>
              <Textarea
                value={currentReview.whatWorked || ""}
                onChange={(e) => updateReview("whatWorked", e.target.value)}
                placeholder="What actions or strategies were effective? What made you feel good?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-24"
              />
            </div>

            {/* What Didn't Work */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                What was challenging or didn't work?
              </label>
              <Textarea
                value={currentReview.whatDidntWork || ""}
                onChange={(e) => updateReview("whatDidntWork", e.target.value)}
                placeholder="What obstacles did you face? What would you do differently?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-24"
              />
            </div>

            {/* Overall Rating */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <Star className="w-5 h-5 text-[#D4AF37]" />
                How would you rate this week overall?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => updateReview("overallRating", rating)}
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      currentReview.overallRating === rating
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white scale-105"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {rating === 1
                        ? "😟"
                        : rating === 2
                        ? "😕"
                        : rating === 3
                        ? "😐"
                        : rating === 4
                        ? "🙂"
                        : "😄"}
                    </div>
                    <div className="text-xs">{rating}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lessons Learned */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Key lessons or insights
              </label>
              <Textarea
                value={currentReview.lessonsLearned || ""}
                onChange={(e) => updateReview("lessonsLearned", e.target.value)}
                placeholder="What did you learn about yourself? Any important realizations?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-20"
              />
            </div>

            {/* Next Week Focus */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-2">
                <ArrowRight className="w-5 h-5 text-blue-400" />
                What will you focus on next week?
              </label>
              <Textarea
                value={currentReview.nextWeekFocus || ""}
                onChange={(e) => updateReview("nextWeekFocus", e.target.value)}
                placeholder="What adjustments will you make? What's your main priority?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-20"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg"
            style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
          >
            {saveMutation.isPending
              ? "Saving..."
              : currentPlanIndex < plansNeedingReview.length - 1
              ? "Next Plan"
              : "Complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
