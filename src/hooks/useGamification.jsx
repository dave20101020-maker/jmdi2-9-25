import { api } from "@/utils/apiClient";
import { useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { ACHIEVEMENT_BADGES, checkAchievementUnlock, getUserLevel } from "@/utils/achievementBadges";
import { format } from "date-fns";
import { toast } from "sonner";

/**
 * Hook to handle all gamification logic
 * Call this after any action that might award points/achievements
 */
export function useGamification(user, entries, goals, connections) {
  const queryClient = useQueryClient();
  
  const awardPoints = async (points, reason) => {
    if (!user) return;
    
    const newPoints = (user.points || 0) + points;
    const oldLevel = getUserLevel(user.points || 0);
    const newLevel = getUserLevel(newPoints);
    
    await api.authUpdateMe({ 
      points: newPoints,
      last_points_calculation: new Date().toISOString()
    });
    
    queryClient.invalidateQueries(['auth-user']);
    
    // Show point notification
    toast.success(`+${points} points`, { description: reason });
    
    // Check for level up
    if (oldLevel.name !== newLevel.name) {
      toast.success(`Level Up! You're now a ${newLevel.name}! ${newLevel.icon}`, {
        duration: 5000
      });
      return { leveledUp: true, newLevel };
    }
    
    return { leveledUp: false };
  };
  
  const checkAndUnlockAchievements = async (userStats) => {
    if (!user) return [];
    
    const unlocked = await api.getAchievements({ userId: user.email });
    const unlockedIds = unlocked.map(a => a.badgeId);
    const newUnlocks = [];
    
    for (const [badgeId, badge] of Object.entries(ACHIEVEMENT_BADGES)) {
      if (!unlockedIds.includes(badgeId) && checkAchievementUnlock(badgeId, userStats)) {
        // Unlock this achievement
        await api.createAchievement({
          userId: user.email,
          badgeId,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          category: badge.category,
          pointsAwarded: badge.points,
          unlockedAt: new Date().toISOString()
        });
        
        // Award points
        await api.authUpdateMe({ 
          points: (user.points || 0) + badge.points
        });
        
        newUnlocks.push(badge);
        
        toast.success(`Achievement Unlocked! ${badge.icon}`, {
          description: `${badge.name} • +${badge.points} points`,
          duration: 5000
        });
      }
    }
    
    if (newUnlocks.length > 0) {
      queryClient.invalidateQueries(['achievements']);
      queryClient.invalidateQueries(['auth-user']);
    }
    
    return newUnlocks;
  };
  
  const generateDailyQuests = async () => {
    if (!user) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await api.getDailyQuests({ userId: user.email, date: today });
    
    if (existing.length > 0) return existing[0];
    
    // Generate 3 random quests
    const possibleQuests = [
      { id: 'log_5_pillars', title: "Log 5 Pillars", description: "Track 5 different pillars today", points: 30, target: 5 },
      { id: 'improve_score', title: "Improve a Score", description: "Increase any pillar score by 2+ points", points: 20, target: 1 },
      { id: 'chat_coach', title: "Talk to Coach", description: "Send a message to any AI coach", points: 15, target: 1 },
      { id: 'complete_goal', title: "Work on Goal", description: "Update progress on a goal", points: 25, target: 1 },
      { id: 'log_all_8', title: "Perfect Day", description: "Log all 8 pillars", points: 50, target: 8 },
    ];
    
    const selectedQuests = possibleQuests
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(q => ({ ...q, progress: 0, completed: false }));
    
    const quest = await api.createDailyQuest({
      userId: user.email,
      date: today,
      quests: selectedQuests,
      allCompleted: false,
      bonusAwarded: false
    });
    
    return quest;
  };
  
  return {
    awardPoints,
    checkAndUnlockAchievements,
    generateDailyQuests
  };
}