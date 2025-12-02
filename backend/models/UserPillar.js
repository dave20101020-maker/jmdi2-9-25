import mongoose from 'mongoose';

const userPillarSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Pillar name is required'],
      enum: ['Sleep', 'Diet', 'Exercise', 'Physical Health', 'Mental Health', 'Finance', 'Social', 'Spirituality'],
      trim: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score must be between 0 and 100'],
      max: [100, 'Score must be between 0 and 100'],
      default: 0,
    },
    dailyHabits: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        streak: {
          type: Number,
          default: 0,
        },
        frequency: {
          type: String,
          enum: ['daily', 'weekdays', 'weekends', 'custom'],
          default: 'daily',
        },
        reminderTime: {
          type: String, // HH:MM format
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    weeklyGoals: [
      {
        id: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        target: {
          type: Number,
          required: true,
        },
        current: {
          type: Number,
          default: 0,
        },
        unit: {
          type: String,
          default: 'times',
        },
        dueDate: {
          type: Date,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    plan: {
      shortTerm: [
        {
          action: {
            type: String,
            required: true,
          },
          timeframe: {
            type: String,
            default: '1-2 weeks',
          },
          priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
          },
          status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
            default: 'not_started',
          },
        },
      ],
      longTerm: [
        {
          goal: {
            type: String,
            required: true,
          },
          timeframe: {
            type: String,
            default: '1-3 months',
          },
          milestones: [
            {
              description: String,
              completed: {
                type: Boolean,
                default: false,
              },
              completedAt: Date,
            },
          ],
          status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
            default: 'not_started',
          },
        },
      ],
      notes: {
        type: String,
        trim: true,
      },
      coachRecommendations: [
        {
          message: String,
          generatedAt: {
            type: Date,
            default: Date.now,
          },
          applied: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique user-pillar combinations
userPillarSchema.index({ userId: 1, name: 1 }, { unique: true });

// Index for querying active pillars by user
userPillarSchema.index({ userId: 1, isActive: 1 });

// Index for recent updates
userPillarSchema.index({ userId: 1, lastUpdated: -1 });

// Pre-save middleware to update lastUpdated
userPillarSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

// Method to calculate completion rate for daily habits
userPillarSchema.methods.getDailyHabitsCompletionRate = function () {
  const activeHabits = this.dailyHabits.filter((h) => h.isActive);
  if (activeHabits.length === 0) return 0;
  const completedCount = activeHabits.filter((h) => h.completed).length;
  return Math.round((completedCount / activeHabits.length) * 100);
};

// Method to calculate weekly goals progress
userPillarSchema.methods.getWeeklyGoalsProgress = function () {
  const activeGoals = this.weeklyGoals.filter((g) => !g.completed);
  if (activeGoals.length === 0) return 100;
  
  let totalProgress = 0;
  activeGoals.forEach((goal) => {
    const progress = Math.min((goal.current / goal.target) * 100, 100);
    totalProgress += progress;
  });
  
  return Math.round(totalProgress / activeGoals.length);
};

// Method to get plan summary
userPillarSchema.methods.getPlanSummary = function () {
  const shortTermTotal = this.plan.shortTerm.length;
  const shortTermCompleted = this.plan.shortTerm.filter(
    (item) => item.status === 'completed'
  ).length;
  
  const longTermTotal = this.plan.longTerm.length;
  const longTermCompleted = this.plan.longTerm.filter(
    (item) => item.status === 'completed'
  ).length;
  
  return {
    shortTerm: {
      total: shortTermTotal,
      completed: shortTermCompleted,
      progress: shortTermTotal > 0 ? Math.round((shortTermCompleted / shortTermTotal) * 100) : 0,
    },
    longTerm: {
      total: longTermTotal,
      completed: longTermCompleted,
      progress: longTermTotal > 0 ? Math.round((longTermCompleted / longTermTotal) * 100) : 0,
    },
  };
};

export default mongoose.model('UserPillar', userPillarSchema);
