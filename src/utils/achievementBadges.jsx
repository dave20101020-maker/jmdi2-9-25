export const ACHIEVEMENT_BADGES = {
  // STREAK BADGES
  '7_day_warrior': { name: "7-Day Warrior", icon: "🔥", category: "streak", points: 100, requirement: "7-day streak" },
  '14_day_hero': { name: "2-Week Hero", icon: "⚡", category: "streak", points: 200, requirement: "14-day streak" },
  'month_master': { name: "Month Master", icon: "🏆", category: "streak", points: 500, requirement: "30-day streak" },
  'quarter_champion': { name: "Quarter Champion", icon: "💎", category: "streak", points: 1000, requirement: "90-day streak" },
  'year_legend': { name: "Year Legend", icon: "👑", category: "streak", points: 5000, requirement: "365-day streak" },
  
  // MASTERY BADGES
  'sleep_scientist': { name: "Sleep Scientist", icon: "🌙", category: "mastery", points: 150, requirement: "30 sleep entries" },
  'nutrition_guru': { name: "Nutrition Guru", icon: "🥗", category: "mastery", points: 150, requirement: "30 diet entries" },
  'fitness_fanatic': { name: "Fitness Fanatic", icon: "💪", category: "mastery", points: 150, requirement: "50 exercise entries" },
  'health_hero': { name: "Health Hero", icon: "❤️", category: "mastery", points: 150, requirement: "30 health entries" },
  'mindful_master': { name: "Mindful Master", icon: "🧠", category: "mastery", points: 150, requirement: "100 mental health entries" },
  'money_master': { name: "Money Master", icon: "💰", category: "mastery", points: 150, requirement: "30 finance entries" },
  'social_butterfly': { name: "Social Butterfly", icon: "👥", category: "mastery", points: 150, requirement: "30 social entries" },
  'spiritual_sage': { name: "Spiritual Sage", icon: "✨", category: "mastery", points: 150, requirement: "30 spirituality entries" },
  
  // SCORE BADGES
  'first_80': { name: "First 80!", icon: "🎯", category: "score", points: 50, requirement: "Any pillar reaches 80" },
  'perfect_ten': { name: "Perfect Ten", icon: "💯", category: "score", points: 100, requirement: "Any pillar reaches 100" },
  'balanced_life': { name: "Balanced Life", icon: "⚖️", category: "score", points: 300, requirement: "All 8 pillars above 70" },
  'peak_performance': { name: "Peak Performance", icon: "🌟", category: "score", points: 500, requirement: "Life Score reaches 90" },
  
  // MILESTONE BADGES
  'first_entry': { name: "First Step", icon: "🌱", category: "milestone", points: 10, requirement: "Log first entry" },
  'ten_entries': { name: "Getting Started", icon: "🚀", category: "milestone", points: 50, requirement: "Log 10 entries" },
  'fifty_entries': { name: "Dedicated Tracker", icon: "📊", category: "milestone", points: 100, requirement: "Log 50 entries" },
  'hundred_entries': { name: "Century Club", icon: "💯", category: "milestone", points: 200, requirement: "Log 100 entries" },
  'all_eight': { name: "Completionist", icon: "🎨", category: "milestone", points: 100, requirement: "Log all 8 pillars in one day" },
  'first_goal': { name: "Goal Setter", icon: "🎯", category: "milestone", points: 50, requirement: "Create first goal" },
  'goal_crusher': { name: "Goal Crusher", icon: "💪", category: "milestone", points: 200, requirement: "Complete first goal" },
  'one_month': { name: "One Month Strong", icon: "📅", category: "milestone", points: 150, requirement: "Use app for 1 month" },
  
  // SOCIAL BADGES
  'team_player': { name: "Team Player", icon: "🤝", category: "social", points: 50, requirement: "Add first friend" },
  'motivator': { name: "Motivator", icon: "💬", category: "social", points: 100, requirement: "Encourage 5 friends" },
  'champion': { name: "Champion", icon: "🏅", category: "social", points: 250, requirement: "Top 10 on leaderboard" },
  'inspiration': { name: "Inspiration", icon: "✨", category: "social", points: 150, requirement: "Share 5 achievements" },
};

export const USER_LEVELS = [
  { name: "Novice", minPoints: 0, maxPoints: 499, icon: "🌱", color: "#9CA3AF" },
  { name: "Explorer", minPoints: 500, maxPoints: 1999, icon: "🔍", color: "#60A5FA" },
  { name: "Seeker", minPoints: 2000, maxPoints: 4999, icon: "🧭", color: "#A78BFA" },
  { name: "Navigator", minPoints: 5000, maxPoints: 9999, icon: "⭐", color: "#F59E0B" },
  { name: "Master", minPoints: 10000, maxPoints: 24999, icon: "👑", color: "#D4AF37" },
  { name: "Legend", minPoints: 25000, maxPoints: Infinity, icon: "🌟", color: "#F4D03F" },
];

export function getUserLevel(points) {
  return USER_LEVELS.find(level => points >= level.minPoints && points <= level.maxPoints) || USER_LEVELS[0];
}

export function getNextLevel(points) {
  const currentLevel = getUserLevel(points);
  const currentIndex = USER_LEVELS.findIndex(l => l.name === currentLevel.name);
  return USER_LEVELS[currentIndex + 1] || null;
}

export function checkAchievementUnlock(badgeId, userStats) {
  const badge = ACHIEVEMENT_BADGES[badgeId];
  if (!badge) return false;
  
  switch(badgeId) {
    case '7_day_warrior': return userStats.currentStreak >= 7;
    case '14_day_hero': return userStats.currentStreak >= 14;
    case 'month_master': return userStats.currentStreak >= 30;
    case 'quarter_champion': return userStats.currentStreak >= 90;
    case 'year_legend': return userStats.currentStreak >= 365;
    
    case 'sleep_scientist': return (userStats.pillarEntries?.sleep || 0) >= 30;
    case 'nutrition_guru': return (userStats.pillarEntries?.diet || 0) >= 30;
    case 'fitness_fanatic': return (userStats.pillarEntries?.exercise || 0) >= 50;
    case 'health_hero': return (userStats.pillarEntries?.physical_health || 0) >= 30;
    case 'mindful_master': return (userStats.pillarEntries?.mental_health || 0) >= 100;
    case 'money_master': return (userStats.pillarEntries?.finances || 0) >= 30;
    case 'social_butterfly': return (userStats.pillarEntries?.social || 0) >= 30;
    case 'spiritual_sage': return (userStats.pillarEntries?.spirituality || 0) >= 30;
    
    case 'first_80': return userStats.maxPillarScore >= 80;
    case 'perfect_ten': return userStats.maxPillarScore >= 100;
    case 'balanced_life': return userStats.allPillarsAbove70 === true;
    case 'peak_performance': return userStats.lifeScore >= 90;
    
    case 'first_entry': return userStats.totalEntries >= 1;
    case 'ten_entries': return userStats.totalEntries >= 10;
    case 'fifty_entries': return userStats.totalEntries >= 50;
    case 'hundred_entries': return userStats.totalEntries >= 100;
    case 'all_eight': return userStats.allEightLoggedOneDay === true;
    case 'first_goal': return userStats.goalsCreated >= 1;
    case 'goal_crusher': return userStats.goalsCompleted >= 1;
    case 'one_month': return userStats.daysSinceJoined >= 30;
    
    case 'team_player': return userStats.friendsCount >= 1;
    case 'motivator': return userStats.friendsEncouraged >= 5;
    case 'champion': return userStats.leaderboardRank <= 10;
    case 'inspiration': return userStats.achievementsShared >= 5;
    
    default: return false;
  }
}