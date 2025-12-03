/**
 * Streak Engine
 * 
 * Tracks daily completion, calculates consistency scores, and manages streaks.
 * 
 * Scoring System:
 * - 7-day streak: consistency score increases 5 points
 * - 14-day streak: +10 points
 * - 30-day streak: +20 points
 * - Pillar score: (completion_count / target_days) * 100, capped at pillar average + quality
 * 
 * Usage:
 *   const streak = new StreakEngine(userId, pillar);
 *   const score = await streak.trackCompletion();
 *   const consistency = await streak.calculateConsistencyScore();
 */

import StreakTracker from '../models/StreakTracker.js';
import Entry from '../models/Entry.js';
import logger from '../utils/logger.js';

export class StreakEngine {
  constructor(userId, pillar) {
    this.userId = userId;
    this.pillar = pillar;
  }

  /**
   * Track daily completion for a pillar
   * 
   * Returns: {
   *   ok: true,
   *   currentStreak: number,
   *   longestStreak: number,
   *   totalDays: number,
   *   streakBonusAwarded: boolean,
   *   streakBonusPoints: number
   * }
   */
  async trackCompletion() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already tracked today
      let tracker = await StreakTracker.findOne(
        {
          userId: this.userId,
          pillar: this.pillar
        }
      );

      if (!tracker) {
        tracker = await StreakTracker.create({
          userId: this.userId,
          pillar: this.pillar,
          currentStreak: 1,
          longestStreak: 1,
          totalDays: 1,
          lastCompletionDate: today,
          completionDates: [today],
          streakMilestones: [],
          created: new Date()
        });

        logger.info(`Streak tracker created for ${this.userId} - ${this.pillar}`);

        return {
          ok: true,
          currentStreak: 1,
          longestStreak: 1,
          totalDays: 1,
          streakBonusAwarded: false,
          streakBonusPoints: 0,
          isFirstDay: true
        };
      }

      const lastCompletion = tracker.lastCompletionDate
        ? new Date(tracker.lastCompletionDate)
        : null;
      const todayDate = new Date(today);

      // Already tracked today
      if (lastCompletion && isSameDay(lastCompletion, todayDate)) {
        return {
          ok: true,
          currentStreak: tracker.currentStreak,
          longestStreak: tracker.longestStreak,
          totalDays: tracker.totalDays,
          streakBonusAwarded: false,
          streakBonusPoints: 0,
          alreadyCompletedToday: true
        };
      }

      // Calculate streak
      let newStreak = tracker.currentStreak;
      let bonusPoints = 0;
      let bonusAwarded = false;

      if (lastCompletion) {
        const daysSinceLastCompletion = daysBetween(lastCompletion, todayDate);

        if (daysSinceLastCompletion === 1) {
          // Consecutive day - continue streak
          newStreak = tracker.currentStreak + 1;
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
        }
      }

      // Check for milestone bonuses
      const milestoneBonus = this.getMilestoneBonus(newStreak);
      if (milestoneBonus > 0) {
        bonusPoints = milestoneBonus;
        bonusAwarded = true;

        tracker.streakMilestones.push({
          date: new Date(),
          streakDay: newStreak,
          bonusPoints
        });
      }

      // Update tracker
      tracker.currentStreak = newStreak;
      tracker.lastCompletionDate = today;
      tracker.totalDays = (tracker.totalDays || 0) + 1;

      if (!tracker.completionDates.includes(today)) {
        tracker.completionDates.push(today);
      }

      if (newStreak > tracker.longestStreak) {
        tracker.longestStreak = newStreak;
      }

      tracker.lastUpdated = new Date();
      await tracker.save();

      logger.info(
        `Streak updated for ${this.userId} - ${this.pillar}: ${newStreak} days`
      );

      return {
        ok: true,
        currentStreak: newStreak,
        longestStreak: tracker.longestStreak,
        totalDays: tracker.totalDays,
        streakBonusAwarded: bonusAwarded,
        streakBonusPoints: bonusPoints,
        isNewMilestone: bonusAwarded
      };
    } catch (error) {
      logger.error(`Error tracking completion: ${error.message}`);
      return {
        ok: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate consistency score (0-100)
   * 
   * Based on:
   * - Current streak duration
   * - Completion frequency in last 30/60/90 days
   * - Milestone achievements
   */
  async calculateConsistencyScore() {
    try {
      const tracker = await StreakTracker.findOne({
        userId: this.userId,
        pillar: this.pillar
      });

      if (!tracker) return 0;

      let score = 0;

      // Base score from current streak (max 40)
      const currentStreakScore = Math.min(tracker.currentStreak * 2, 40);
      score += currentStreakScore;

      // Long-term consistency (max 30)
      const completionRates = await this.getCompletionRates();
      const last30DaysRate = completionRates.last30Days || 0;
      const last90DaysRate = completionRates.last90Days || 0;
      score += (last30DaysRate * 15) / 100 + (last90DaysRate * 15) / 100;

      // Milestone bonus (max 30)
      const milestoneBonus = (tracker.streakMilestones?.length || 0) * 5;
      score += Math.min(milestoneBonus, 30);

      score = Math.round(Math.min(score, 100));

      return {
        score,
        currentStreak: tracker.currentStreak,
        longestStreak: tracker.longestStreak,
        totalDays: tracker.totalDays,
        completionRates,
        breakdown: {
          streakScore: Math.min(currentStreakScore, 40),
          consistencyScore: Math.min((last30DaysRate * 15) / 100 + (last90DaysRate * 15) / 100, 30),
          milestoneScore: Math.min(milestoneBonus, 30)
        }
      };
    } catch (error) {
      logger.error(`Error calculating consistency score: ${error.message}`);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Calculate pillar score (0-100)
   * 
   * Based on:
   * - Completion frequency
   * - Quality of responses
   * - Progress toward goals
   */
  async calculatePillarScore() {
    try {
      const tracker = await StreakTracker.findOne({
        userId: this.userId,
        pillar: this.pillar
      });

      if (!tracker) return 0;

      let score = 0;

      // Completion ratio in last 30 days
      const completionRates = await this.getCompletionRates();
      const completionScore = Math.round(completionRates.last30Days * 0.6);
      score += completionScore;

      // Quality score from entries
      const entries = await Entry.find({
        userId: this.userId,
        pillar: this.pillar,
        type: 'checkin',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const qualityScore = Math.round(
        entries.reduce((sum, e) => sum + (e.score || 0), 0) / Math.max(entries.length, 1) * 0.4
      );
      score += qualityScore;

      // Streak bonus
      const streakBonus = Math.min(tracker.currentStreak, 10);
      score += streakBonus;

      score = Math.round(Math.min(score, 100));

      return {
        score,
        completionScore,
        qualityScore,
        streakBonus,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Error calculating pillar score: ${error.message}`);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Get completion rates for different time periods
   */
  async getCompletionRates() {
    try {
      const today = new Date();
      const last30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

      const completions30 = await Entry.countDocuments({
        userId: this.userId,
        pillar: this.pillar,
        type: 'checkin',
        createdAt: { $gte: last30 }
      });

      const completions90 = await Entry.countDocuments({
        userId: this.userId,
        pillar: this.pillar,
        type: 'checkin',
        createdAt: { $gte: last90 }
      });

      return {
        last30Days: Math.min((completions30 / 30) * 100, 100),
        last90Days: Math.min((completions90 / 90) * 100, 100)
      };
    } catch (error) {
      logger.error(`Error calculating completion rates: ${error.message}`);
      return { last30Days: 0, last90Days: 0 };
    }
  }

  /**
   * Get milestone bonus points for streak
   */
  getMilestoneBonus(streak) {
    if (streak === 7) return 10;
    if (streak === 14) return 20;
    if (streak === 30) return 50;
    if (streak === 60) return 100;
    if (streak === 90) return 150;
    if (streak % 30 === 0) return 50;
    return 0;
  }

  /**
   * Reset streak (if missed a day, can be used for recovery)
   */
  async resetStreak() {
    try {
      const tracker = await StreakTracker.findOne({
        userId: this.userId,
        pillar: this.pillar
      });

      if (tracker) {
        tracker.currentStreak = 0;
        tracker.lastUpdated = new Date();
        await tracker.save();
      }

      return { ok: true };
    } catch (error) {
      logger.error(`Error resetting streak: ${error.message}`);
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get streak analytics
   */
  async getAnalytics() {
    try {
      const tracker = await StreakTracker.findOne({
        userId: this.userId,
        pillar: this.pillar
      });

      if (!tracker) return { completions: 0 };

      const completionRates = await this.getCompletionRates();
      const consistencyScore = await this.calculateConsistencyScore();
      const pillarScore = await this.calculatePillarScore();

      return {
        currentStreak: tracker.currentStreak,
        longestStreak: tracker.longestStreak,
        totalDays: tracker.totalDays,
        completions: tracker.completionDates?.length || 0,
        milestones: tracker.streakMilestones || [],
        completionRates,
        consistencyScore: consistencyScore.score,
        pillarScore: pillarScore.score,
        lastCompletion: tracker.lastCompletionDate,
        allMilestones: [7, 14, 30, 60, 90, 120]
      };
    } catch (error) {
      logger.error(`Error getting streak analytics: ${error.message}`);
      return { error: error.message };
    }
  }
}

/**
 * Helper: Check if two dates are same day
 */
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Helper: Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2 - date1) / msPerDay);
}

export default StreakEngine;
