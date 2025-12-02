// Core utility exports for NorthStar app
import { format, differenceInDays } from 'date-fns';
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Import from specialized modules
export { PILLARS, getPillarsArray, getPillarById, getPillarName, getPillarColor, getPillarIcon, isValidPillarId, getAllPillarIds, getPillarsByCategory } from "./pillars"
export { calculateAllScores, calculateSleepScore, calculateDietScore, calculateExerciseScore, calculatePhysicalHealthScore, calculateMentalHealthScore, calculateFinanceScore, calculateSocialScore, calculateSpiritualityScore, getOverallScore, getWellnessSummary, getTopPillars, getPillarsNeedingImprovement } from "./scoring"

// Class name utility function (re-exported from root utils.js logic)
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const COLORS = {
  BACKGROUND: "#0A1628",
  PRIMARY: "#D4AF37",
  PRIMARY_LIGHT: "#F4D03F"
};

export const DEFAULT_HABIT_POINTS = 5;

export const createPageUrl = (pageName) => {
  return `/${pageName}`;
};

// Check if habit is completed today
export const isHabitCompletedToday = (habit) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return habit.completionDates?.includes(today) || false;
};

// Calculate habit statistics
export const calculateHabitStats = (habits) => {
  const activeHabits = habits.filter(h => h.isActive);
  const completedToday = activeHabits.filter(h => isHabitCompletedToday(h)).length;
  const totalStreak = activeHabits.reduce((sum, h) => sum + (h.streakCount || 0), 0);
  
  // Calculate average completion rate
  const completionRates = activeHabits.map(h => {
    if (!h.created_date) return 0;
    const daysSinceCreation = Math.max(1, differenceInDays(new Date(), new Date(h.created_date)));
    const totalCompletions = h.totalCompletions || 0;
    return Math.round((totalCompletions / daysSinceCreation) * 100);
  });
  
  const avgCompletionRate = completionRates.length > 0
    ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
    : 0;
  
  return {
    activeHabits: activeHabits.length,
    completedToday,
    totalStreak,
    avgCompletionRate
  };
};

// Handle habit completion/uncompletion logic
export const handleHabitCompletion = (habit, isCompleting) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const completionDates = habit.completionDates || [];
  
  let newCompletionDates;
  let newStreakCount = habit.streakCount || 0;
  let newTotalCompletions = habit.totalCompletions || 0;
  let newBestStreak = habit.bestStreak || 0;
  
  if (isCompleting) {
    // Adding completion
    newCompletionDates = [...completionDates, today];
    newTotalCompletions = newTotalCompletions + 1;
    
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (completionDates.includes(yesterday)) {
      newStreakCount = newStreakCount + 1;
    } else {
      newStreakCount = 1;
    }
    
    newBestStreak = Math.max(newBestStreak, newStreakCount);
  } else {
    // Removing completion
    newCompletionDates = completionDates.filter(d => d !== today);
    newTotalCompletions = Math.max(0, newTotalCompletions - 1);
    
    // Recalculate streak based on remaining dates
    if (newCompletionDates.length > 0) {
      let tempStreak = 0;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday since today is being removed
      checkDate.setHours(0, 0, 0, 0);
      
      const sortedDates = newCompletionDates.sort().reverse();
      
      for (let i = 0; i < sortedDates.length; i++) {
        const date = new Date(sortedDates[i]);
        date.setHours(0, 0, 0, 0);
        
        if (format(date, 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd')) {
          tempStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      newStreakCount = tempStreak;
    } else {
      newStreakCount = 0;
    }
  }
  
  return {
    completionDates: newCompletionDates,
    lastCompletedDate: isCompleting ? today : habit.lastCompletedDate,
    streakCount: newStreakCount,
    totalCompletions: newTotalCompletions,
    bestStreak: newBestStreak
  };
};
