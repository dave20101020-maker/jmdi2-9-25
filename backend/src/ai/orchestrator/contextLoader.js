/**
 * Agent Context Loader
 * 
 * Gathers and injects rich context into every agent call:
 * - Prior conversation history
 * - Active habits and their streaks
 * - Last generated plan
 * - All screening results with scores
 * - Cross-pillar stress factors
 * - User memory and metadata
 * 
 * Usage:
 *   const context = await loadAgentContext(userId, pillar, lastMessages);
 *   // context includes prior habits, screenings, memory, etc.
 */

import { loadMemory, saveMemory } from './memoryStore.js';
import Habit from '../../models/Habit.js';
import Entry from '../../models/Entry.js';
import Goal from '../../models/Goal.js';
import StreakTracker from '../../models/StreakTracker.js';
import logger from '../../utils/logger.js';

/**
 * Load comprehensive context for agent
 */
export async function loadAgentContext(userId, pillar, lastMessages = []) {
  try {
    const memory = await loadMemory(userId);
    
    // Get active habits for this pillar
    const habits = await Habit.find({
      userId,
      pillar,
      active: true,
      dueDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(10);

    // Get last completed entries (checkins, logs)
    const recentEntries = await Entry.find({
      userId,
      pillar,
      type: { $in: ['checkin', 'log', 'journal'] }
    }).sort({ createdAt: -1 }).limit(5);

    // Get screening results for this pillar
    const screenings = await Entry.find({
      userId,
      pillar,
      type: 'screening'
    }).sort({ createdAt: -1 }).limit(3);

    // Get active goals
    const goals = await Goal.find({
      userId,
      pillar,
      status: { $ne: 'completed' }
    }).sort({ priority: -1 }).limit(5);

    // Get streak info
    const streak = await StreakTracker.findOne({ userId, pillar });

    // Get last plan for this pillar
    const lastPlan = memory.pillars?.[pillar]?.currentWeeklyPlan || null;

    // Get all screening results across all pillars (for cross-pillar context)
    const allScreenings = await Entry.find({
      userId,
      type: 'screening'
    }).sort({ pillar: 1, createdAt: -1 });

    // Extract screening scores for quick reference
    const screeningScores = extractScreeningScores(screenings);
    const stressFactors = identifyStressFactors(allScreenings, memory);

    // Build context object
    const context = {
      // User metadata
      userId,
      pillar,
      onboardingData: memory.onboarding || {},
      userDemographics: memory.demographics || {},

      // Active items
      habits: habits.map(h => ({
        id: h._id,
        title: h.title,
        frequency: h.frequency,
        dueDate: h.dueDate,
        streak: h.streak || 0,
        lastCompleted: h.lastCompleted
      })),
      
      goals: goals.map(g => ({
        id: g._id,
        title: g.title,
        description: g.description,
        priority: g.priority,
        targetDate: g.targetDate
      })),

      activeStreak: streak ? {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        consistency: await calculateConsistency(streak)
      } : null,

      // Recent activity
      recentEntries: recentEntries.map(e => ({
        date: e.date,
        type: e.type,
        score: e.score,
        summary: e.data?.summary || 'Entry recorded'
      })),

      // Screening context
      screeningScores,
      screeningHistory: screenings.map(s => ({
        date: s.createdAt,
        name: s.data?.screeningName || 'Screening',
        score: s.score,
        result: s.data?.result || 'Pending'
      })),

      // Cross-pillar stressors
      stressFactors,

      // Plan context
      lastPlanDate: lastPlan?.createdAt || null,
      lastPlanTheme: lastPlan?.theme || null,

      // Message history for continuity
      messageHistory: lastMessages.slice(-5), // Last 5 messages for context

      // Metadata
      lastCheckinDate: memory.pillars?.[pillar]?.lastCheckin?.date || null,
      preferredHour: memory.pillars?.[pillar]?.preferredCheckInHour || 14,
      
      // Formatted context string for LLM injection
      contextString: buildContextString({
        habits,
        screeningScores,
        stressFactors,
        recentEntries,
        streak,
        onboardingData: memory.onboarding
      })
    };

    return context;
  } catch (error) {
    logger.error(`Error loading agent context: ${error.message}`);
    return {
      userId,
      pillar,
      error: error.message,
      contextString: '' // Graceful degradation
    };
  }
}

/**
 * Extract scores and results from screening entries
 */
function extractScreeningScores(screenings) {
  const scores = {};

  screenings.forEach(s => {
    const name = s.data?.screeningName || 'Unknown';
    scores[name] = {
      score: s.score || 0,
      category: s.data?.category || 'Normal',
      result: s.data?.result || 'Pending',
      date: s.createdAt,
      details: s.data?.details || {}
    };
  });

  return scores;
}

/**
 * Identify cross-pillar stress factors
 * E.g., if anxiety is high, note it for sleep/nutrition agents
 * If money stress is high, note it for sleep/fitness agents
 */
function identifyStressFactors(allScreenings, memory) {
  const factors = [];

  // Find mental health stress indicators
  const mentalHealthScreenings = allScreenings.filter(s => s.pillar === 'mental-health');
  if (mentalHealthScreenings.length > 0) {
    const latestMH = mentalHealthScreenings[0];
    if (latestMH.score && latestMH.score > 60) {
      factors.push({
        type: 'anxiety',
        severity: 'high',
        impact: 'affects sleep, nutrition, exercise motivation',
        date: latestMH.createdAt
      });
    }
  }

  // Find financial stress
  const financialScreenings = allScreenings.filter(s => s.pillar === 'finances');
  if (financialScreenings.length > 0) {
    const latestFinance = financialScreenings[0];
    if (latestFinance.score && latestFinance.score < 40) {
      factors.push({
        type: 'financial_stress',
        severity: 'high',
        impact: 'disrupts sleep, increases stress, affects nutrition',
        date: latestFinance.createdAt
      });
    }
  }

  // Find poor sleep (for fitness agents)
  const sleepScreenings = allScreenings.filter(s => s.pillar === 'sleep');
  if (sleepScreenings.length > 0) {
    const latestSleep = sleepScreenings[0];
    if (latestSleep.score && latestSleep.score > 60) {
      factors.push({
        type: 'poor_sleep',
        severity: 'high',
        impact: 'reduces fitness capacity, increases injury risk, decreases motivation',
        date: latestSleep.createdAt
      });
    }
  }

  return factors;
}

/**
 * Calculate consistency from streak data
 */
async function calculateConsistency(streak) {
  if (!streak) return 0;
  const currentStreak = streak.currentStreak || 0;
  const longestStreak = streak.longestStreak || 0;
  return Math.round((currentStreak / Math.max(longestStreak, 1)) * 100);
}

/**
 * Build formatted context string for LLM injection
 */
function buildContextString({
  habits,
  screeningScores,
  stressFactors,
  recentEntries,
  streak,
  onboardingData
}) {
  const lines = [];

  // User info
  lines.push('=== CURRENT CONTEXT ===');
  
  if (onboardingData?.demographics) {
    const demo = onboardingData.demographics;
    lines.push(`User: Age ${demo.age}, Location: ${demo.location}`);
  }

  // Streak info
  if (streak) {
    lines.push(`Streak: ${streak.currentStreak} days (longest: ${streak.longestStreak})`);
  }

  // Active habits
  if (habits.length > 0) {
    lines.push('\nActive Habits:');
    habits.slice(0, 5).forEach(h => {
      lines.push(`  • ${h.title} (${h.frequency}, streak: ${h.streak || 0}d)`);
    });
  }

  // Screening scores
  if (Object.keys(screeningScores).length > 0) {
    lines.push('\nRecent Screenings:');
    Object.entries(screeningScores).forEach(([name, data]) => {
      lines.push(`  • ${name}: ${data.category} (score: ${data.score})`);
    });
  }

  // Stress factors
  if (stressFactors.length > 0) {
    lines.push('\nCross-pillar Stressors:');
    stressFactors.forEach(f => {
      lines.push(`  ⚠️  ${f.type}: ${f.severity} - impacts: ${f.impact}`);
    });
  }

  // Recent activity
  if (recentEntries.length > 0) {
    lines.push('\nRecent Activity:');
    recentEntries.slice(0, 3).forEach(e => {
      lines.push(`  • ${e.type}: ${e.summary} (score: ${e.score || 'N/A'})`);
    });
  }

  return lines.join('\n');
}

export { extractScreeningScores, identifyStressFactors };
