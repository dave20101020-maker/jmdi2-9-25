import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl, PILLARS, COLORS } from "@/components/shared/Utils";
import {
  User,
  Edit2,
  Save,
  X,
  Check,
  Crown,
  Users,
  UserPlus,
  UserCheck,
  Trophy,
  Zap,
  Bell,
  LogOut,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Settings,
  PlayCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import HelpTooltip from "@/components/shared/HelpTooltip";
import GuidedTour from "@/ai/GuidedTour";
import { toast } from "sonner";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const calculateUserPoints = (user) => {
  return user?.points || 0;
};

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { subscription, hasPremiumAccess, isTrial } = useSubscriptionStatus();
  const [editedName, setEditedName] = useState("");
  const [showTour, setShowTour] = useState(false);

  const [socialTab, setSocialTab] = useState("leaderboard");

  const [selectedPillars, setSelectedPillars] = useState([]);
  const [editingPillars, setEditingPillars] = useState(false);
  const [authError, setAuthError] = useState(false); // Added authError state

  useEffect(() => {
    async function getUserAndSubscription() {
      try {
        const currentUser = await api.authMe();
        setUser(currentUser);
        setEditedName(currentUser.full_name || "");
        setSelectedPillars(currentUser.selected_pillars || []);
      } catch (error) {
        console.error("Auth error:", error);
        setAuthError(true);
        // Redirect to login
        // TODO: Redirect to login
        // api.logout();(window.location.pathname);
      }
    }
    getUserAndSubscription();
  }, []);

  const { data: entries = [] } = useQuery({
    queryKey: ["entries", user?.email],
    queryFn: () => api.getEntries({ created_by: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: allConnections = [] } = useQuery({
    queryKey: ["connections", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const sent = await api.getConnections({ userId: user.email });
      const received = await api.getConnections({ friendEmail: user.email });
      return [...sent, ...received];
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: allMilestones = [] } = useQuery({
    queryKey: ["allPublicMilestones"],
    queryFn: () => api.getMilestones("-created_date", 100),
    enabled: !!user,
    initialData: [],
  });

  // Optimistic update for user profile
  const updateUserMutation = useMutation({
    mutationFn: (data) => api.authUpdateMe(data),
    onMutate: async (data) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ["entries", user?.email] });

      // Snapshot previous user
      const previousUser = user;

      // Optimistically update local state
      setUser({ ...user, ...data });

      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      setUser(context.previousUser);
      setEditedName(context.previousUser?.full_name || "");
      setSelectedPillars(context.previousUser?.selected_pillars || []);
      toast.error("Failed to update profile", {
        description: "Please try again",
      });
    },
    onSuccess: async (data, variables) => {
      const updatedUser = await api.authMe();
      setUser(updatedUser);
      setIsEditing(false);
      setEditingPillars(false);

      // Invalidate related queries based on what was updated
      if (variables.selected_pillars) {
        toast.success("Pillars updated successfully! 🌟");
        queryClient.invalidateQueries({ queryKey: ["entries", user?.email] });
      } else if (variables.full_name) {
        toast.success("Profile updated successfully!");
      } else if (variables.reminder_enabled !== undefined) {
        toast.success(
          variables.reminder_enabled
            ? "Reminders enabled! 🔔"
            : "Reminders disabled"
        );
      }
    },
  });

  const handleSaveProfile = () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateUserMutation.mutate({ full_name: editedName });
  };

  const handleSavePillars = () => {
    if (selectedPillars.length !== 3) {
      toast.error("Please select exactly 3 pillars");
      return;
    }
    updateUserMutation.mutate({ selected_pillars: selectedPillars });
  };

  const togglePillar = (pillarId) => {
    if (selectedPillars.includes(pillarId)) {
      setSelectedPillars(selectedPillars.filter((id) => id !== pillarId));
    } else if (selectedPillars.length < 3) {
      setSelectedPillars([...selectedPillars, pillarId]);
    }
  };

  const handleReplayTour = () => {
    setShowTour(true);
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    await api.authUpdateMe({ tour_completed: true });
    const updatedUser = await api.authMe();
    setUser(updatedUser);
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
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isPremium = hasPremiumAccess && !isTrial;
  const hasFullAccess = hasPremiumAccess;

  const pendingRequests = allConnections.filter(
    (c) => c.status === "pending" && c.friendEmail === user?.email
  );

  const acceptedFriends = allConnections.filter((c) => c.status === "accepted");

  const leaderboardData = [
    ...new Map(
      allMilestones.filter((m) => m.isPublic).map((m) => [m.userId, m])
    ).values(),
  ]
    .reduce((acc, milestone) => {
      const existing = acc.find((u) => u.userId === milestone.userId);
      if (existing) {
        existing.totalPoints += milestone.points || 0;
        existing.milestoneCount += 1;
      } else {
        acc.push({
          userId: milestone.userId,
          userName: milestone.userName || milestone.userId,
          totalPoints: milestone.points || 0,
          milestoneCount: 1,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);

  const userPoints = calculateUserPoints(user);
  const userRank =
    leaderboardData.findIndex((u) => u.userId === user?.email) + 1;

  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-5xl"
            style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)" }}
          >
            {user.full_name?.[0]?.toUpperCase() || "👤"}
          </div>

          {isEditing ? (
            <div className="max-w-xs mx-auto space-y-3">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-center"
                placeholder="Your name"
              />
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleSaveProfile}
                  size="sm"
                  disabled={updateUserMutation.isPending}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(user.full_name || "");
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.full_name || "Traveler"}
              </h1>
              <p className="text-white/60 mb-4">{user.email}</p>
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </>
          )}
        </div>

        {/* Subscription Info */}
        {subscription && (
          <div
            className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-2xl p-5 mb-6 text-center"
            style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-white font-bold">
                {subscription.tier} Plan
              </span>
            </div>
            <p className="text-white/70 text-sm">
              {subscription.tier === "Premium"
                ? "Full access to all pillars and features"
                : subscription.tier === "Trial"
                ? `Trial ends ${
                    subscription.trialEndDate
                      ? format(
                          new Date(subscription.trialEndDate),
                          "MMM d, yyyy"
                        )
                      : "soon"
                  }`
                : "Tracking 3 selected pillars"}
            </p>
            {!hasFullAccess && (
              <Link
                to={createPageUrl("Upgrade")}
                className="inline-block mt-3 text-[#F4D03F] hover:text-[#D4AF37] text-sm font-bold"
              >
                Upgrade to Premium →
              </Link>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
            <div className="text-2xl font-bold text-white">{userPoints}</div>
            <div className="text-xs text-white/60">Total Points</div>
          </div>

          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold text-white">
              {user.streak_days || 0}
            </div>
            <div className="text-xs text-white/60">Day Streak</div>
          </div>

          <Link
            to={createPageUrl("Milestones")}
            className="bg-[#1a1f35] border border-white/20 rounded-xl p-4 text-center hover:bg-white/5 transition-all group"
          >
            <Trophy className="w-6 h-6 mx-auto mb-2 text-[#F4D03F] group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white">
              {allMilestones.filter((m) => m.userId === user.email).length}
            </div>
            <div className="text-xs text-white/60 flex items-center justify-center gap-1">
              Milestones
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        </div>

        {/* App Settings */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#4CC9F0]" />
            App Settings
          </h2>

          <div className="space-y-3">
            {/* Replay Tour Button */}
            <button
              onClick={handleReplayTour}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#F4D03F]/10 border border-[#D4AF37]/30 rounded-xl hover:from-[#D4AF37]/20 hover:to-[#F4D03F]/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">Replay Guided Tour</div>
                  <div className="text-white/60 text-sm">
                    Learn about NorthStar features
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Tour Status */}
            {user.tour_completed && (
              <div className="text-xs text-white/60 text-center">
                ✓ You've completed the tour
              </div>
            )}
          </div>
        </div>

        {/* Pillar Selection - Enhanced for Free Users */}
        {!hasFullAccess && (
          <div
            className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 backdrop-blur-md border-2 border-[#D4AF37]/40 rounded-2xl p-6 mb-6"
            style={{ boxShadow: "0 0 25px rgba(212, 175, 55, 0.2)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-xl font-bold text-white">
                  Your Selected Pillars
                </h2>
                <HelpTooltip
                  title="Free Plan Pillars"
                  content="Free accounts can track 3 pillars. You can change your selection anytime! Upgrade to Premium to unlock all 8 pillars."
                  position="bottom"
                />
              </div>
              {!editingPillars && (
                <Button
                  onClick={() => setEditingPillars(true)}
                  size="sm"
                  className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-bold"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Change
                </Button>
              )}
            </div>

            {editingPillars ? (
              <div className="animate-in slide-in-from-top duration-200">
                <p className="text-white/70 text-sm mb-4">
                  Select exactly{" "}
                  <span className="font-bold text-[#F4D03F]">3 pillars</span> to
                  track with your free account:
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.entries(PILLARS).map(([id, pillar]) => {
                    const isSelected = selectedPillars.includes(id);
                    const canSelect = selectedPillars.length < 3 || isSelected;

                    return (
                      <button
                        key={id}
                        onClick={() => togglePillar(id)}
                        disabled={!canSelect}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] scale-105"
                            : canSelect
                            ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            : "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                        }`}
                        style={
                          isSelected
                            ? { boxShadow: `0 0 15px ${pillar.color}40` }
                            : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{pillar.icon}</span>
                          <span className="text-white font-medium text-sm">
                            {pillar.name}
                          </span>
                          {isSelected && (
                            <Check className="w-5 h-5 text-[#D4AF37] ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center mb-4 p-3 bg-white/5 rounded-lg">
                  <span className="text-white/60 text-sm">
                    Selected:{" "}
                    <span
                      className={`font-bold text-lg ${
                        selectedPillars.length === 3
                          ? "text-green-400"
                          : "text-[#D4AF37]"
                      }`}
                    >
                      {selectedPillars.length}/3
                    </span>
                  </span>
                  {selectedPillars.length === 3 && (
                    <div className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" />
                      Ready to save!
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSavePillars}
                    disabled={
                      selectedPillars.length !== 3 ||
                      updateUserMutation.isPending
                    }
                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateUserMutation.isPending
                      ? "Saving..."
                      : "Save Selection"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingPillars(false);
                      setSelectedPillars(user.selected_pillars || []);
                    }}
                    variant="ghost"
                    className="border border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-white/80 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Changing your pillars won't delete existing data. You can
                      always switch back later or upgrade to track all 8
                      pillars!
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(user.selected_pillars || []).map((pillarId) => {
                    const pillar = PILLARS[pillarId];
                    if (!pillar) return null;
                    return (
                      <div
                        key={pillarId}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 text-center transition-all hover:scale-105"
                        style={{ boxShadow: `0 0 15px ${pillar.color}40` }}
                      >
                        <div className="text-3xl mb-2">{pillar.icon}</div>
                        <div className="text-white text-sm font-medium">
                          {pillar.name}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-white/60 text-sm text-center mb-3">
                  You're tracking {selectedPillars.length} of 8 pillars on the
                  Free plan
                </p>
              </div>
            )}
          </div>
        )}

        {/* Community Section - REDESIGNED */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 sm:w-6 h-5 sm:h-6 text-[#FFD700]" />
              Community
            </h2>
            <Link
              to={createPageUrl("Connections")}
              className="text-[#FFD700] hover:text-[#D4AF37] text-sm font-bold flex items-center gap-1 w-fit"
            >
              Manage
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pendingRequests.length > 0 && (
            <Link
              to={createPageUrl("Connections")}
              className="block bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4 mb-4 hover:bg-blue-500/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm sm:text-base">
                      {pendingRequests.length} Request
                      {pendingRequests.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-white/60 text-xs">Tap to respond</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </div>
            </Link>
          )}

          <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <UserCheck className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0" />
              <div>
                <div className="text-white font-bold text-sm sm:text-base">
                  {acceptedFriends.length} Friend
                  {acceptedFriends.length !== 1 ? "s" : ""}
                </div>
                <div className="text-white/60 text-xs">Connected</div>
              </div>
            </div>
          </div>

          {/* FIXED: Simpler segmented control for tabs */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-1 mb-4 grid grid-cols-3 gap-1">
            <button
              onClick={() => setSocialTab("leaderboard")}
              className={`py-2 px-2 rounded-md font-semibold transition-all text-xs sm:text-sm ${
                socialTab === "leaderboard"
                  ? "bg-[#D4AF37] text-[#0A1628] shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-0.5" />
              <div className="hidden sm:block">Board</div>
            </button>
            <button
              onClick={() => setSocialTab("friends")}
              className={`py-2 px-2 rounded-md font-semibold transition-all text-xs sm:text-sm ${
                socialTab === "friends"
                  ? "bg-[#D4AF37] text-[#0A1628] shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-0.5" />
              <div className="hidden sm:block">Friends</div>
            </button>
            <button
              onClick={() => setSocialTab("milestones")}
              className={`py-2 px-2 rounded-md font-semibold transition-all text-xs sm:text-sm ${
                socialTab === "milestones"
                  ? "bg-[#D4AF37] text-[#0A1628] shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-0.5" />
              <div className="hidden sm:block">Wins</div>
            </button>
          </div>

          {/* Tab content with max height and scroll */}
          <div className="max-h-[350px] overflow-y-auto pr-1">
            {socialTab === "leaderboard" && (
              <div>
                {userRank > 0 && (
                  <div className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-sm sm:text-lg font-bold text-[#0A1628] flex-shrink-0">
                          #{userRank}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">
                            You
                          </div>
                          <div className="text-white/60 text-xs">
                            {userPoints} pts
                          </div>
                        </div>
                      </div>
                      <Trophy className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {leaderboardData.map((userData, idx) => {
                    const isCurrentUser = userData.userId === user.email;
                    return (
                      <div
                        key={userData.userId}
                        className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-all ${
                          isCurrentUser
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/40"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              idx === 0
                                ? "bg-yellow-500/20 text-yellow-400"
                                : idx === 1
                                ? "bg-gray-400/20 text-gray-300"
                                : idx === 2
                                ? "bg-orange-600/20 text-orange-500"
                                : "bg-white/10 text-white/60"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-xs sm:text-sm truncate">
                              {isCurrentUser ? "You" : userData.userName}
                            </div>
                            <div className="text-white/60 text-xs">
                              {userData.milestoneCount} win
                              {userData.milestoneCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-[#D4AF37] font-bold text-xs sm:text-sm flex-shrink-0">
                          {userData.totalPoints}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {socialTab === "friends" && (
              <div>
                <div className="space-y-1.5">
                  {acceptedFriends.length === 0 ? (
                    <div className="text-center text-white/60 py-8 text-sm">
                      <UserCheck className="w-12 h-12 mx-auto mb-3 text-white/30" />
                      <p>No friends yet</p>
                      <Link
                        to={createPageUrl("Connections")}
                        className="text-[#FFD700] text-xs mt-2 inline-block"
                      >
                        Add friends →
                      </Link>
                    </div>
                  ) : (
                    acceptedFriends.slice(0, 8).map((conn) => {
                      const friendEmail =
                        conn.userId === user.email
                          ? conn.friendEmail
                          : conn.userId;
                      const friendName =
                        conn.userId === user.email
                          ? conn.friendName
                          : conn.nickname;

                      return (
                        <div
                          key={conn.id}
                          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2 sm:p-2.5"
                        >
                          <UserCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-xs sm:text-sm truncate">
                              {friendName || friendEmail}
                            </div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                        </div>
                      );
                    })
                  )}
                </div>

                {acceptedFriends.length > 8 && (
                  <div className="text-center mt-3 text-[#FFD700] hover:text-[#D4AF37] text-xs font-bold">
                    +{acceptedFriends.length - 8} more
                  </div>
                )}
              </div>
            )}

            {socialTab === "milestones" && (
              <div className="space-y-2">
                {allMilestones
                  .filter((m) => m.isPublic)
                  .slice(0, 6)
                  .map((milestone) => {
                    const pillar =
                      milestone.pillar !== "all"
                        ? PILLARS[milestone.pillar]
                        : null;
                    const isOwn = milestone.userId === user.email;

                    return (
                      <div
                        key={milestone.id}
                        className={`p-2.5 sm:p-3 rounded-lg border transition-all ${
                          isOwn
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/40"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="text-xl sm:text-2xl flex-shrink-0">
                            {milestone.icon || "🏆"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-white font-bold text-xs sm:text-sm truncate">
                                {milestone.title}
                              </span>
                              {pillar && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: `${pillar.color}30`,
                                    color: pillar.color,
                                  }}
                                >
                                  {pillar.icon}
                                </span>
                              )}
                            </div>
                            <div className="text-white/60 text-xs mb-1">
                              {isOwn ? "You" : milestone.userName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[#D4AF37] font-bold">
                                +{milestone.points}
                              </span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60">
                                {format(
                                  new Date(milestone.created_date),
                                  "MMM d"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                <Link
                  to={createPageUrl("Milestones")}
                  className="block text-center py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-all font-bold text-xs sm:text-sm"
                >
                  View All →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Personal Information
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/70">Email</span>
              <span className="text-white font-medium">{user.email}</span>
            </div>

            {user.bio?.age && (
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white/70">Age</span>
                <span className="text-white font-medium">{user.bio.age}</span>
              </div>
            )}

            {user.bio?.activityLevel && (
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white/70">Activity Level</span>
                <span className="text-white font-medium">
                  {user.bio.activityLevel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Total Check-ins</span>
              <span className="text-white font-bold">
                {user.total_check_ins || entries.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Streak</span>
              <span className="text-orange-400 font-bold">
                {user.streak_days || 0} days
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Total Points</span>
              <span className="text-[#D4AF37] font-bold">{userPoints}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Friends</span>
              <span className="text-white font-bold">
                {acceptedFriends.length}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            Notifications
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Daily Reminders</div>
                <div className="text-white/60 text-sm">
                  Get reminded to track your pillars
                </div>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.reminder_enabled ? "bg-blue-500" : "bg-white/20"
                }`}
                onClick={() =>
                  updateUserMutation.mutate({
                    reminder_enabled: !user.reminder_enabled,
                  })
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.reminder_enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {user.reminder_enabled && (
              <div className="pl-4 border-l-2 border-blue-500/40 animate-in slide-in-from-top duration-200">
                <Label className="text-white/90 mb-2 block text-sm">
                  Reminder Time
                </Label>
                <Input
                  type="time"
                  value={user.reminder_time || "09:00"}
                  onChange={(e) =>
                    updateUserMutation.mutate({ reminder_time: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white w-40"
                />
              </div>
            )}
          </div>
        </div>

        {/* Feedback & Support Section */}
        <Link
          to={createPageUrl("Feedback")}
          className="block bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/40 rounded-2xl p-5 mb-6 hover:from-blue-500/30 hover:to-blue-600/30 transition-all group"
          style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Feedback & Support</h3>
                <p className="text-white/70 text-sm">
                  Share your thoughts or get help
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Logout */}
        <Button
          onClick={() => api.logout()}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white/80 hover:text-white font-bold transition-all"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Guided Tour Modal */}
      {showTour && (
        <GuidedTour
          onComplete={handleTourComplete}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
