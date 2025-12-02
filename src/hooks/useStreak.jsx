import { useMemo } from 'react';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

/**
 * Calculate streak from entries
 */
export function useStreak(entries, user) {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: user?.longest_streak || 0,
        todayLogged: false,
        nextMilestone: 7,
        progressToMilestone: 0,
        streakBadge: 'gray',
        canFreeze: user?.streak_freezes_available > 0,
        pillarStreaks: {}
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    
    // Check if logged today
    const todayLogged = sortedEntries.some(e => e.date === today);
    
    // Calculate overall streak
    let currentStreak = 0;
    let checkDate = new Date();
    
    // If not logged today, start from yesterday
    if (!todayLogged) {
      checkDate = subDays(checkDate, 1);
    }
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const hasEntry = sortedEntries.some(e => e.date === dateStr);
      
      if (!hasEntry) {
        // Check if freeze was used
        const freezeDate = user?.streak_freeze_date;
        if (freezeDate && freezeDate === dateStr) {
          checkDate = subDays(checkDate, 1);
          continue;
        }
        break;
      }
      
      currentStreak++;
      checkDate = subDays(checkDate, 1);
      
      // Limit calculation to prevent infinite loops
      if (currentStreak > 365) break;
    }
    
    // Calculate longest streak
    let longestStreak = user?.longest_streak || 0;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    
    // Calculate per-pillar streaks
    const pillarStreaks = {};
    const pillars = [...new Set(sortedEntries.map(e => e.pillar))];
    
    pillars.forEach(pillar => {
      const pillarEntries = sortedEntries.filter(e => e.pillar === pillar);
      let streak = 0;
      let checkDate = new Date();
      
      const todayLoggedForPillar = pillarEntries.some(e => e.date === today);
      if (!todayLoggedForPillar) {
        checkDate = subDays(checkDate, 1);
      }
      
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const hasEntry = pillarEntries.some(e => e.date === dateStr);
        
        if (!hasEntry) break;
        
        streak++;
        checkDate = subDays(checkDate, 1);
        
        if (streak > 100) break;
      }
      
      pillarStreaks[pillar] = streak;
    });
    
    // Determine next milestone
    const milestones = [7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find(m => m > currentStreak) || 1000;
    const progressToMilestone = (currentStreak / nextMilestone) * 100;
    
    // Determine badge color
    let streakBadge = 'gray';
    if (currentStreak >= 100) streakBadge = 'diamond';
    else if (currentStreak >= 60) streakBadge = 'platinum';
    else if (currentStreak >= 30) streakBadge = 'gold';
    else if (currentStreak >= 14) streakBadge = 'silver';
    else if (currentStreak >= 7) streakBadge = 'bronze';
    
    return {
      currentStreak,
      longestStreak,
      todayLogged,
      nextMilestone,
      progressToMilestone,
      streakBadge,
      canFreeze: (user?.streak_freezes_available || 0) > 0,
      freezesRemaining: user?.streak_freezes_available || 0,
      pillarStreaks
    };
  }, [entries, user]);
}

export const STREAK_BADGES = {
  gray: { color: '#9CA3AF', label: 'Beginner', glow: 'rgba(156, 163, 175, 0.3)' },
  bronze: { color: '#CD7F32', label: 'Bronze', glow: 'rgba(205, 127, 50, 0.3)' },
  silver: { color: '#C0C0C0', label: 'Silver', glow: 'rgba(192, 192, 192, 0.3)' },
  gold: { color: '#FFD700', label: 'Gold', glow: 'rgba(255, 215, 0, 0.3)' },
  platinum: { color: '#E5E4E2', label: 'Platinum', glow: 'rgba(229, 228, 226, 0.3)' },
  diamond: { color: '#B9F2FF', label: 'Diamond', glow: 'rgba(185, 242, 255, 0.3)' }
};