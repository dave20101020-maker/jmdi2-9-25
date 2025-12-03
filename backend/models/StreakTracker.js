/**
 * StreakTracker Model
 * 
 * Tracks user's daily completion streaks for each pillar.
 * 
 * Data:
 * - currentStreak: active streak count (resets on missed day)
 * - longestStreak: all-time longest streak
 * - totalDays: total days completed
 * - completionDates: array of ISO date strings
 * - streakMilestones: array of {date, streakDay, bonusPoints}
 */

import mongoose from 'mongoose';

const streakTrackerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  pillar: {
    type: String,
    required: true,
    enum: [
      'sleep',
      'fitness',
      'mental-health',
      'nutrition',
      'finances',
      'physical-health',
      'social',
      'spirituality'
    ],
    index: true
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDays: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCompletionDate: {
    type: String, // ISO date string YYYY-MM-DD
    default: null
  },
  completionDates: {
    type: [String], // Array of ISO date strings
    default: []
  },
  streakMilestones: {
    type: [
      {
        date: Date,
        streakDay: Number,
        bonusPoints: Number
      }
    ],
    default: []
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient lookups
streakTrackerSchema.index({ userId: 1, pillar: 1 }, { unique: true });

// Update lastUpdated on save
streakTrackerSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const StreakTracker = mongoose.model('StreakTracker', streakTrackerSchema);

export default StreakTracker;
