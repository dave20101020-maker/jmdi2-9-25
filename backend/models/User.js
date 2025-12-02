import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'nhs_referred'],
    default: 'free'
  },
  allowedPillars: {
    type: [String],
    default: function() {
      // default for a free user: expose two pillars
      return ['sleep', 'mental_health'];
    }
  }
  ,
  // Gamification: streaks and badges
  current_streak: {
    type: Number,
    default: 0,
  },
  longest_streak: {
    type: Number,
    default: 0,
  },
  badges: {
    type: [String],
    default: []
  }
}, { timestamps: { createdAt: 'createdAt' } });

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export default mongoose.model('User', userSchema);
