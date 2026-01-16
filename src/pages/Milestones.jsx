import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl, PILLARS } from "@/utils";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Target,
  Filter,
  Calendar,
  TrendingUp,
  Star,
  Sparkles,
  Crown,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // Added Label import
import { Skeleton } from "@/components/ui/skeleton";
import MilestoneCard from "@/components/shared/MilestoneCard";
import { featureFlags } from "@/config/featureRuntime";

const MILESTONE_TYPES = [
  { value: "all", label: "All Types", icon: Trophy },
  { value: "streak", label: "Streak", icon: Flame },
  { value: "score", label: "Score", icon: Star },
  { value: "plan_completion", label: "Plan Completion", icon: Target },
  { value: "habit_streak", label: "Habit Streak", icon: Award },
  { value: "life_score", label: "Life Score", icon: Crown },
  { value: "custom", label: "Custom", icon: Medal },
];

export default function Milestones() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterPillar, setFilterPillar] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const isGamificationEnabled = featureFlags.FEATURE_GAMIFICATION_B2B;
  const HeaderIcon = isGamificationEnabled ? Trophy : TrendingUp;
  const pageTitle = isGamificationEnabled
    ? "My Milestones"
    : "Progress markers";
  const pageSubtitle = isGamificationEnabled
    ? "Your achievements and progress"
    : "A calm view of your progress across pillars";
  const emptyTitle = isGamificationEnabled
    ? "Start Earning Milestones"
    : "Start tracking progress";
  const emptyDescription = isGamificationEnabled
    ? "Track your pillars, build habits, and complete goals to unlock achievements and climb the leaderboard!"
    : "Track your pillars, build habits, and complete goals to surface new progress markers.";
  const guidanceTitle = isGamificationEnabled
    ? "How to Earn Milestones"
    : "How progress markers appear";
  const milestonesLabel = isGamificationEnabled
    ? "milestones"
    : "progress markers";
  const sortOptions = isGamificationEnabled
    ? [
        { value: "recent", label: "Most Recent" },
        { value: "oldest", label: "Oldest First" },
        { value: "points_high", label: "Highest Points" },
        { value: "points_low", label: "Lowest Points" },
      ]
    : [
        { value: "recent", label: "Most Recent" },
        { value: "oldest", label: "Oldest First" },
      ];
  const guidanceItems = isGamificationEnabled
    ? [
        {
          icon: Flame,
          iconClass: "text-orange-400",
          title: "Build Streaks:",
          description:
            "Track pillars or complete habits for 3, 7, 21, 30 days straight",
        },
        {
          icon: Star,
          iconClass: "text-yellow-400",
          title: "Score High:",
          description: "Achieve scores above 80 on individual pillars",
        },
        {
          icon: Target,
          iconClass: "text-green-400",
          title: "Complete Plans:",
          description: "Finish life plans and reach 100% on goals",
        },
        {
          icon: Crown,
          iconClass: "text-[#D4AF37]",
          title: "Life Score:",
          description: "Maintain high overall scores across all pillars",
        },
      ]
    : [
        {
          icon: Flame,
          iconClass: "text-orange-400",
          title: "Consistency markers:",
          description:
            "Track pillars or complete habits for 3, 7, 21, 30 days in a row",
        },
        {
          icon: Star,
          iconClass: "text-yellow-400",
          title: "Performance markers:",
          description: "Reach strong scores on individual pillars (80+)",
        },
        {
          icon: Target,
          iconClass: "text-green-400",
          title: "Completion markers:",
          description: "Finish life plans and reach 100% on goals",
        },
        {
          icon: Crown,
          iconClass: "text-[#D4AF37]",
          title: "Balance markers:",
          description: "Maintain high overall scores across all pillars",
        },
      ];

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["milestones", user?.email], // Updated query key to include user email
    queryFn: () =>
      api.getMilestones({ userId: user?.email }, "-created_date", 200),
    enabled: !!user,
    initialData: [],
  });

  // Filter milestones
  const filteredMilestones = milestones.filter((m) => {
    const typeMatch = filterType === "all" || m.type === filterType;
    const pillarMatch = filterPillar === "all" || m.pillar === filterPillar;
    return typeMatch && pillarMatch;
  });

  // Sort milestones
  const sortedMilestones = [...filteredMilestones].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime()
        );
      case "oldest":
        return (
          new Date(a.created_date).getTime() -
          new Date(b.created_date).getTime()
        );
      case "points_high":
        return (b.points || 0) - (a.points || 0);
      case "points_low":
        return (a.points || 0) - (b.points || 0);
      default:
        return 0;
    }
  });

  // Calculate stats
  const totalPoints = milestones.reduce((sum, m) => sum + (m.points || 0), 0);
  const byType = MILESTONE_TYPES.reduce((acc, type) => {
    if (type.value !== "all") {
      acc[type.value] = milestones.filter((m) => m.type === type.value).length;
    }
    return acc;
  }, {});

  // The original 'mostRecentMilestone' is not used in the final render logic provided in the outline.

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Skeleton className="h-6 w-6 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-8 w-56 mb-2" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("Profile"))}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Back to profile"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <HeaderIcon className="w-6 h-6 md:w-7 md:h-7 text-[#D4AF37]" />
              {pageTitle}
            </h1>
            <p className="text-white/60 text-sm">{pageSubtitle}</p>
          </div>
        </div>

        {milestones.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-12 md:py-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 max-w-lg mx-auto">
              {/* Trophy Podium Visual */}
              {isGamificationEnabled ? (
                <div
                  className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Podium */}
                    <rect
                      x="130"
                      y="100"
                      width="40"
                      height="70"
                      fill="#CD7F32"
                      opacity="0.3"
                      rx="4"
                    />
                    <text
                      x="150"
                      y="180"
                      textAnchor="middle"
                      fill="#CD7F32"
                      fontSize="24"
                      fontWeight="bold"
                    >
                      3
                    </text>

                    <rect
                      x="30"
                      y="80"
                      width="40"
                      height="90"
                      fill="#C0C0C0"
                      opacity="0.3"
                      rx="4"
                    />
                    <text
                      x="50"
                      y="180"
                      textAnchor="middle"
                      fill="#C0C0C0"
                      fontSize="24"
                      fontWeight="bold"
                    >
                      2
                    </text>

                    <rect
                      x="80"
                      y="50"
                      width="40"
                      height="120"
                      fill="#FFD700"
                      opacity="0.3"
                      rx="4"
                    />
                    <text
                      x="100"
                      y="180"
                      textAnchor="middle"
                      fill="#FFD700"
                      fontSize="24"
                      fontWeight="bold"
                    >
                      1
                    </text>

                    {/* Trophy on top */}
                    <text x="100" y="35" textAnchor="middle" fontSize="30">
                      🏆
                    </text>

                    {/* Stars */}
                    <text x="40" y="40" fontSize="16" opacity="0.5">
                      ⭐
                    </text>
                    <text x="160" y="60" fontSize="16" opacity="0.5">
                      ⭐
                    </text>
                    <text x="70" y="25" fontSize="12" opacity="0.4">
                      ✨
                    </text>
                    <text x="140" y="35" fontSize="12" opacity="0.4">
                      ✨
                    </text>
                  </svg>
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-white/10">
                  <TrendingUp
                    className="w-10 h-10 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                </div>
              )}

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {emptyTitle}
              </h2>
              <p className="text-white/70 mb-6 text-sm md:text-base px-4">
                {emptyDescription}
              </p>

              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold mb-6"
                style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.5)" }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Tracking
              </Button>

              {/* How to Earn */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-4 md:p-6 text-left">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Target className="w-5 h-5 text-purple-400" />
                  {guidanceTitle}
                </h3>
                <ul className="space-y-2 text-xs md:text-sm text-white/80">
                  {guidanceItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.title} className="flex items-start gap-2">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${item.iconClass}`}
                        />
                        <span>
                          <strong>{item.title}</strong> {item.description}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div
                className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4"
                style={{ boxShadow: "0 0 15px rgba(212, 175, 55, 0.2)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-[#D4AF37]" />
                  <div className="text-white/70 text-xs md:text-sm">Total</div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">
                  {milestones.length}
                </div>
                <div className="text-xs text-white/60">milestones</div>
              </div>

              <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-[#F4D03F]" />
                  <div className="text-white/70 text-xs md:text-sm">Points</div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#F4D03F]">
                  {totalPoints}
                </div>
                <div className="text-xs text-white/60">earned</div>
              </div>

              <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <div className="text-white/70 text-xs md:text-sm">
                    Streaks
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-orange-400">
                  {byType.streak || 0}
                </div>
                <div className="text-xs text-white/60">achieved</div>
              </div>

              <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-green-400" />
                  <div className="text-white/70 text-xs md:text-sm">Plans</div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-green-400">
                  {byType.plan_completion || 0}
                </div>
                <div className="text-xs text-white/60">done</div>
              </div>
            </div>

            {/* Filters & Sort */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-white/60" />
                <h3 className="text-white font-semibold">Filters & Sort</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <Label className="text-white/80 mb-2 block text-sm">
                    Type
                  </Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MILESTONE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/80 mb-2 block text-sm">
                    Pillar
                  </Label>
                  <Select value={filterPillar} onValueChange={setFilterPillar}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pillars</SelectItem>
                      {Object.entries(PILLARS).map(([id, pillar]) => (
                        <SelectItem key={id} value={id}>
                          {pillar.icon} {pillar.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="all">🌟 Overall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/80 mb-2 block text-sm">
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
                <p className="text-white/60 text-sm">
                  Showing {sortedMilestones.length} of {milestones.length}{" "}
                  milestones
                </p>
                {(filterType !== "all" || filterPillar !== "all") && (
                  <button
                    onClick={() => {
                      setFilterType("all");
                      setFilterPillar("all");
                    }}
                    className="text-[#D4AF37] hover:text-[#F4D03F] text-sm font-bold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Milestones Grid */}
            {sortedMilestones.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 max-w-md mx-auto">
                  <Filter className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-white/40" />
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                    No Matches Found
                  </h2>
                  <p className="text-white/70 mb-6 text-sm md:text-base">
                    Try adjusting your filters to see more milestones
                  </p>
                  <Button
                    onClick={() => {
                      setFilterType("all");
                      setFilterPillar("all");
                    }}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMilestones.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            )}

            {/* Info Card */}
            {milestones.length > 0 && ( // This card shows if there are ANY milestones, regardless of current filter match
              <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">
                      How to Earn Milestones
                    </h3>
                    <ul className="space-y-2 text-xs md:text-sm text-white/80">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 flex-shrink-0">•</span>
                        <span>
                          <strong>Streak Milestones:</strong> Complete habits or
                          track pillars consecutively (3, 7, 21, 30 days)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 flex-shrink-0">•</span>
                        <span>
                          <strong>Score Milestones:</strong> Achieve high scores
                          on individual pillars (&gt;80)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 flex-shrink-0">•</span>
                        <span>
                          <strong>Plan Completion:</strong> Successfully
                          complete life plans and goals
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 flex-shrink-0">•</span>
                        <span>
                          <strong>Life Score:</strong> Maintain high overall
                          life scores across all pillars
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
