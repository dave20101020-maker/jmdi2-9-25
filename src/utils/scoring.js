/**
 * Pillar Scoring System
 * Calculates wellness scores (0-100) for each pillar based on user data
 */

import { PILLARS, getAllPillarIds } from "./pillars";
import { format, differenceInDays } from "date-fns";

/**
 * Calculate sleep score based on sleep logs
 * @param {Array} sleepLogs - Array of sleep log entries {date, hours, quality}
 * @returns {number} Score 0-100
 */
export const calculateSleepScore = (sleepLogs = []) => {
  if (!sleepLogs || sleepLogs.length === 0) return 0;

  // Get last 7 days of logs
  const recentLogs = sleepLogs.slice(-7);
  
  let score = 0;
  
  // Score based on hours (7-9 hours is ideal)
  const avgHours = recentLogs.reduce((sum, log) => sum + (log.hours || 0), 0) / recentLogs.length;
  const hourScore = Math.max(0, 100 - Math.abs(avgHours - 8) * 10);
  
  // Score based on quality (if tracked)
  const avgQuality = recentLogs.reduce((sum, log) => sum + (log.quality || 5), 0) / recentLogs.length;
  const qualityScore = (avgQuality / 10) * 100;
  
  // Consistency bonus
  const consistencyScore = (recentLogs.length / 7) * 100;
  
  // Weighted average: hours (40%), quality (40%), consistency (20%)
  score = (hourScore * 0.4) + (qualityScore * 0.4) + (consistencyScore * 0.2);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate diet score based on meal logs
 * @param {Array} mealLogs - Array of meal log entries {date, type, nutrition_score}
 * @returns {number} Score 0-100
 */
export const calculateDietScore = (mealLogs = []) => {
  if (!mealLogs || mealLogs.length === 0) return 0;

  // Get last 7 days
  const recentLogs = mealLogs.slice(-7);
  
  // Count days with logged meals
  const daysLogged = new Set(recentLogs.map(log => log.date)).size;
  const loggingScore = (daysLogged / 7) * 100;
  
  // Calculate average nutrition score
  const avgNutrition = recentLogs.reduce((sum, log) => sum + (log.nutrition_score || 5), 0) / recentLogs.length;
  const nutritionScore = (avgNutrition / 10) * 100;
  
  // Check for balanced meals
  const mealTypes = new Set(recentLogs.map(log => log.type));
  const balanceBonus = Math.min(30, mealTypes.size * 10); // Bonus for variety
  
  // Weighted: logging (40%), nutrition (40%), balance (20%)
  let score = (loggingScore * 0.4) + (nutritionScore * 0.4) + (balanceBonus);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate exercise score based on workout logs
 * @param {Array} workoutLogs - Array of workout entries {date, duration, intensity, type}
 * @returns {number} Score 0-100
 */
export const calculateExerciseScore = (workoutLogs = []) => {
  if (!workoutLogs || workoutLogs.length === 0) return 0;

  // Get last 7 days
  const recentLogs = workoutLogs.slice(-7);
  
  // Frequency: aim for 3-5 workouts per week
  const frequency = recentLogs.length;
  const frequencyScore = Math.min(100, (frequency / 4) * 100);
  
  // Total duration: aim for 150 min per week (30 min x 5 days)
  const totalDuration = recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const durationScore = Math.min(100, (totalDuration / 150) * 100);
  
  // Average intensity
  const avgIntensity = recentLogs.reduce((sum, log) => {
    const intensity = log.intensity || 5; // 1-10 scale
    return sum + intensity;
  }, 0) / recentLogs.length;
  const intensityScore = (avgIntensity / 10) * 100;
  
  // Weighted: frequency (35%), duration (35%), intensity (30%)
  let score = (frequencyScore * 0.35) + (durationScore * 0.35) + (intensityScore * 0.3);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate physical health score based on health check-ins
 * @param {Array} healthCheckins - Array of check-in entries {date, energy, pain_level, symptoms}
 * @returns {number} Score 0-100
 */
export const calculatePhysicalHealthScore = (healthCheckins = []) => {
  if (!healthCheckins || healthCheckins.length === 0) return 0;

  const recentCheckins = healthCheckins.slice(-7);
  
  // Energy level (1-10)
  const avgEnergy = recentCheckins.reduce((sum, log) => sum + (log.energy || 5), 0) / recentCheckins.length;
  const energyScore = (avgEnergy / 10) * 100;
  
  // Pain level (inverse: lower is better)
  const avgPain = recentCheckins.reduce((sum, log) => sum + (log.pain_level || 0), 0) / recentCheckins.length;
  const painScore = Math.max(0, 100 - (avgPain * 10));
  
  // Days without major symptoms
  const symptomFreeDays = recentCheckins.filter(log => !log.symptoms || log.symptoms.length === 0).length;
  const symptomScore = (symptomFreeDays / recentCheckins.length) * 100;
  
  // Weighted: energy (40%), pain (30%), symptoms (30%)
  let score = (energyScore * 0.4) + (painScore * 0.3) + (symptomScore * 0.3);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate mental health score based on mood logs and meditation
 * @param {Array} moodLogs - Array of mood log entries {date, mood_score, meditation_minutes, stress_level}
 * @returns {number} Score 0-100
 */
export const calculateMentalHealthScore = (moodLogs = []) => {
  if (!moodLogs || moodLogs.length === 0) return 0;

  const recentLogs = moodLogs.slice(-7);
  
  // Average mood (1-10)
  const avgMood = recentLogs.reduce((sum, log) => sum + (log.mood_score || 5), 0) / recentLogs.length;
  const moodScore = (avgMood / 10) * 100;
  
  // Meditation practice
  const totalMeditationMinutes = recentLogs.reduce((sum, log) => sum + (log.meditation_minutes || 0), 0);
  const meditationScore = Math.min(100, (totalMeditationMinutes / 70) * 100); // 70 min in 7 days target
  
  // Stress level (inverse: lower is better)
  const avgStress = recentLogs.reduce((sum, log) => sum + (log.stress_level || 5), 0) / recentLogs.length;
  const stressScore = Math.max(0, 100 - (avgStress * 10));
  
  // Weighted: mood (40%), meditation (35%), stress (25%)
  let score = (moodScore * 0.4) + (meditationScore * 0.35) + (stressScore * 0.25);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate finance score based on expense logs and budget tracking
 * @param {Array} expenseLogs - Array of expense entries {date, category, amount}
 * @param {Object} budget - Budget config {monthly_limit, savings_goal}
 * @returns {number} Score 0-100
 */
export const calculateFinanceScore = (expenseLogs = [], budget = {}) => {
  if (!expenseLogs || expenseLogs.length === 0) return 0;

  const monthlyLimit = budget.monthly_limit || 3000;
  const savingsGoal = budget.savings_goal || 500;
  
  // Get current month expenses
  const today = new Date();
  const currentMonth = format(today, 'yyyy-MM');
  const monthlyExpenses = expenseLogs
    .filter(log => log.date && log.date.startsWith(currentMonth))
    .reduce((sum, log) => sum + (log.amount || 0), 0);
  
  // Budget adherence
  const budgetScore = Math.max(0, 100 - ((monthlyExpenses - monthlyLimit) / monthlyLimit) * 100);
  
  // Savings consistency
  const savingsScore = Math.min(100, (monthlyExpenses === 0 ? 0 : Math.max(0, ((monthlyLimit - monthlyExpenses) / savingsGoal) * 100)));
  
  // Tracking consistency
  const daysWithExpenses = new Set(expenseLogs.map(log => log.date)).size;
  const trackingScore = (daysWithExpenses > 0 ? 100 : 0);
  
  // Weighted: budget adherence (50%), savings (30%), tracking (20%)
  let score = (budgetScore * 0.5) + (savingsScore * 0.3) + (trackingScore * 0.2);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate social score based on social activity logs
 * @param {Array} socialLogs - Array of social entries {date, activity, duration, quality}
 * @returns {number} Score 0-100
 */
export const calculateSocialScore = (socialLogs = []) => {
  if (!socialLogs || socialLogs.length === 0) return 0;

  const recentLogs = socialLogs.slice(-7);
  
  // Frequency: aim for 3+ social activities per week
  const frequency = recentLogs.length;
  const frequencyScore = Math.min(100, (frequency / 3) * 100);
  
  // Total time: aim for 5+ hours per week
  const totalDuration = recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const durationScore = Math.min(100, (totalDuration / 5) * 100);
  
  // Quality of interactions
  const avgQuality = recentLogs.reduce((sum, log) => sum + (log.quality || 5), 0) / recentLogs.length;
  const qualityScore = (avgQuality / 10) * 100;
  
  // Weighted: frequency (35%), duration (35%), quality (30%)
  let score = (frequencyScore * 0.35) + (durationScore * 0.35) + (qualityScore * 0.3);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate spirituality score based on reflection and gratitude logs
 * @param {Array} spiritualityLogs - Array of entries {date, gratitude_count, reflection_minutes, values_alignment}
 * @returns {number} Score 0-100
 */
export const calculateSpiritualityScore = (spiritualityLogs = []) => {
  if (!spiritualityLogs || spiritualityLogs.length === 0) return 0;

  const recentLogs = spiritualityLogs.slice(-7);
  
  // Gratitude practice
  const totalGratitudeItems = recentLogs.reduce((sum, log) => sum + (log.gratitude_count || 0), 0);
  const gratitudeScore = Math.min(100, (totalGratitudeItems / 21) * 100); // 3 per day target
  
  // Reflection practice
  const totalReflectionMinutes = recentLogs.reduce((sum, log) => sum + (log.reflection_minutes || 0), 0);
  const reflectionScore = Math.min(100, (totalReflectionMinutes / 70) * 100); // 10 min per day target
  
  // Values alignment
  const avgAlignment = recentLogs.reduce((sum, log) => sum + (log.values_alignment || 5), 0) / recentLogs.length;
  const alignmentScore = (avgAlignment / 10) * 100;
  
  // Weighted: gratitude (30%), reflection (35%), alignment (35%)
  let score = (gratitudeScore * 0.3) + (reflectionScore * 0.35) + (alignmentScore * 0.35);
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculate all pillar scores at once
 * @param {Object} userData - Object containing logs for each pillar
 * @returns {Object} Object with scores for each pillar
 */
export const calculateAllScores = (userData = {}) => {
  const scores = {};
  
  scores.sleep = calculateSleepScore(userData.sleepLogs);
  scores.diet = calculateDietScore(userData.mealLogs);
  scores.exercise = calculateExerciseScore(userData.workoutLogs);
  scores.physical_health = calculatePhysicalHealthScore(userData.healthCheckins);
  scores.mental_health = calculateMentalHealthScore(userData.moodLogs);
  scores.finances = calculateFinanceScore(userData.expenseLogs, userData.budget);
  scores.social = calculateSocialScore(userData.socialLogs);
  scores.spirituality = calculateSpiritualityScore(userData.spiritualityLogs);
  
  return scores;
};

/**
 * Get overall wellness score (average of all pillars)
 * @param {Object} scores - Object with pillar scores
 * @returns {number} Overall score 0-100
 */
export const getOverallScore = (scores) => {
  if (!scores || Object.keys(scores).length === 0) return 0;
  
  const values = Object.values(scores);
  const average = values.reduce((sum, score) => sum + score, 0) / values.length;
  
  return Math.round(average);
};

/**
 * Get wellness summary with grades
 * @param {Object} scores - Object with pillar scores
 * @returns {Object} Object with scores and grades
 */
export const getWellnessSummary = (scores) => {
  const summary = {};
  
  getAllPillarIds().forEach(id => {
    const score = scores[id] || 0;
    let grade;
    
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";
    else grade = "F";
    
    summary[id] = {
      score,
      grade,
      status: score >= 70 ? "good" : score >= 50 ? "fair" : "needs_improvement"
    };
  });
  
  summary.overall = {
    score: getOverallScore(scores),
    grade: getWellnessSummary(scores).overall?.grade || "N/A"
  };
  
  return summary;
};

/**
 * Get top pillar performers
 * @param {Object} scores - Object with pillar scores
 * @param {number} count - Number of top pillars to return
 * @returns {Array} Array of top pillar IDs
 */
export const getTopPillars = (scores, count = 3) => {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([id]) => id);
};

/**
 * Get pillars needing improvement
 * @param {Object} scores - Object with pillar scores
 * @param {number} threshold - Score threshold for improvement
 * @returns {Array} Array of pillar IDs below threshold
 */
export const getPillarsNeedingImprovement = (scores, threshold = 70) => {
  return Object.entries(scores)
    .filter(([, score]) => score < threshold)
    .sort(([, a], [, b]) => a - b)
    .map(([id]) => id);
};
