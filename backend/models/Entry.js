import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score must be between 0 and 100'],
      max: [100, 'Score must be between 0 and 100'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes must be less than 1000 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
entrySchema.index({ userId: 1, date: -1 });
entrySchema.index({ userId: 1, pillar: 1, date: -1 });

export default mongoose.model('Entry', entrySchema);
