import mongoose from 'mongoose';

const pillarScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    pillar: {
      type: String,
      required: [true, 'Pillar is required'],
      enum: ['sleep', 'diet', 'exercise', 'physical_health', 'mental_health', 'finances', 'social', 'spirituality'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score must be between 0 and 100'],
      max: [100, 'Score must be between 0 and 100'],
      default: 50,
    },
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable',
    },
    weeklyScores: {
      type: [Number],
      default: [],
      validate: {
        validator: function (v) {
          return v.every(score => score >= 0 && score <= 100);
        },
        message: 'All weekly scores must be between 0 and 100',
      },
    },
    monthlyScores: {
      type: [Number],
      default: [],
      validate: {
        validator: function (v) {
          return v.every(score => score >= 0 && score <= 100);
        },
        message: 'All monthly scores must be between 0 and 100',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
pillarScoreSchema.index({ userId: 1, pillar: 1 }, { unique: true });

// Index to support time-based queries for recent pillar score snapshots
pillarScoreSchema.index({ userId: 1, pillar: 1, createdAt: -1 });

// Calculate trend based on recent scores
pillarScoreSchema.methods.calculateTrend = function () {
  if (this.weeklyScores.length < 2) {
    this.trend = 'stable';
    return;
  }

  const recent = this.weeklyScores.slice(-4);
  const older = this.weeklyScores.slice(-8, -4) || [this.weeklyScores[0]];

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

  const threshold = 5;
  if (recentAvg > olderAvg + threshold) {
    this.trend = 'improving';
  } else if (recentAvg < olderAvg - threshold) {
    this.trend = 'declining';
  } else {
    this.trend = 'stable';
  }
};

export default mongoose.model('PillarScore', pillarScoreSchema);
