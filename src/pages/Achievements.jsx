import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ACHIEVEMENT_BADGES, checkAchievementUnlock } from "@/utils/achievementBadges";
import AchievementCard from "@/components/shared/AchievementCard";
import LevelDisplay from "@/components/shared/LevelDisplay";
import { Trophy, Target, Award, Users, Milestone, Filter } from "lucide-react";
import { differenceInDays } from "date-fns";

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Trophy },
  { id: 'streak', name: 'Streaks', icon: Target },
  { id: 'mastery', name: 'Mastery', icon: Award },
  { id: 'score', name: 'Scores', icon: Trophy },
  { id: 'milestone', name: 'Milestones', icon: Milestone },
  { id: 'social', name: 'Social', icon: Users },
];

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  const { data: unlockedAchievements = [] } = useQuery({
    queryKey: ['achievements', user?.email],
    queryFn: () => api.getAchievements({ userId: user?.email }),
    enabled: !!user,
    initialData: []
  });
  
  const { data: entries = [] } = useQuery({
    queryKey: ['entries', user?.email],
    queryFn: () => api.getEntries({ created_by: user?.email }),
    enabled: !!user,
    initialData: []
  });
  
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: () => api.getGoals({ created_by: user?.email }),
    enabled: !!user,
    initialData: []
  });
  
  const { data: connections = [] } = useQuery({
    queryKey: ['connections', user?.email],
    queryFn: async () => {
      const sent = await api.getConnections({ userId: user.email, status: 'accepted' });
      const received = await api.getConnections({ friendEmail: user.email, status: 'accepted' });
      return [...sent, ...received];
    },
    enabled: !!user,
    initialData: []
  });
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-white/60 text-base">Loading...</div>
      </div>
    );
  }
  
  // Calculate user stats for achievement checking
  const pillarEntries = {};
  entries.forEach(e => {
    pillarEntries[e.pillar] = (pillarEntries[e.pillar] || 0) + 1;
  });
  
  const maxPillarScore = Math.max(...entries.map(e => e.score), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);
  const allEightLoggedOneDay = entries.some(e => {
    const dayEntries = entries.filter(entry => entry.date === e.date);
    return new Set(dayEntries.map(entry => entry.pillar)).size === 8;
  });
  
  const daysSinceJoined = user.created_date ? differenceInDays(new Date(), new Date(user.created_date)) : 0;
  
  const userStats = {
    currentStreak: user.streak_days || 0,
    pillarEntries,
    maxPillarScore,
    allPillarsAbove70: todayEntries.length === 8 && todayEntries.every(e => e.score >= 70),
    lifeScore: todayEntries.length > 0 ? Math.round(todayEntries.reduce((sum, e) => sum + e.score, 0) / todayEntries.length) : 0,
    totalEntries: entries.length,
    allEightLoggedOneDay,
    goalsCreated: goals.length,
    goalsCompleted: goals.filter(g => g.status === 'completed').length,
    daysSinceJoined,
    friendsCount: connections.length,
    friendsEncouraged: 0, // TODO: Track this
    leaderboardRank: 999, // TODO: Calculate from leaderboard
    achievementsShared: unlockedAchievements.filter(a => a.isShared).length
  };
  
  const allBadges = Object.entries(ACHIEVEMENT_BADGES).map(([id, badge]) => ({
    id,
    ...badge,
    isUnlocked: unlockedAchievements.some(a => a.badgeId === id),
    canUnlock: checkAchievementUnlock(id, userStats)
  }));
  
  const filteredBadges = selectedCategory === 'all' 
    ? allBadges 
    : allBadges.filter(b => b.category === selectedCategory);
  
  const unlockedCount = allBadges.filter(b => b.isUnlocked).length;
  const totalBadges = allBadges.length;
  
  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-white/70 text-base">
            {unlockedCount}/{totalBadges} badges unlocked
          </p>
        </div>
        
        {/* Level Display */}
        <div className="mb-8">
          <LevelDisplay points={user.points || 0} />
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#D4AF37] text-[#0A1628]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>
        
        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map(badge => (
            <AchievementCard
              key={badge.id}
              badge={badge}
              isUnlocked={badge.isUnlocked}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}