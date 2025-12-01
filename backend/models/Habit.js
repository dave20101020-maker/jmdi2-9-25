import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      minlength: [1, 'Habit name must not be empty'],
      maxlength: [100, 'Habit name must be less than 100 characters'],
    },
    pillar: {
      type: String,
      required: [true, 'Pillar is required'],
      enum: ['sleep', 'diet', 'exercise', 'physical_health', 'mental_health', 'finances', 'social', 'spirituality'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    streakCount: {
      type: Number,
      default: 0,
      min: [0, 'Streak count cannot be negative'],
    },
    bestStreak: {
      type: Number,
      default: 0,
      min: [0, 'Best streak cannot be negative'],
    },
    completionDates: {
      type: [Date],
      default: [],
    },
    totalCompletions: {
      type: Number,
      default: 0,
      min: [0, 'Total completions cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
habitSchema.index({ userId: 1, pillar: 1 });
habitSchema.index({ userId: 1, isActive: 1 });

// Virtual for current streak
habitSchema.virtual('currentStreakDays').get(function () {
  if (this.completionDates.length === 0) return 0;
  
  const dates = this.completionDates.map(d => new Date(d).toISOString().split('T')[0]);
  const uniqueDates = [...new Set(dates)].sort().reverse();
  
  if (uniqueDates.length === 0) return 0;
  
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  let expectedDate = uniqueDates[0] === today ? today : new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(expectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    if (uniqueDates[i] === prevDateStr) {
      streak++;
      expectedDate = prevDateStr;
    } else {
      break;
    }
  }
  
  return streak;
});

export default mongoose.model('Habit', habitSchema);
