import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name must be less than 100 characters']
  },
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
  },
  // User pillars progress and preferences
  pillars: {
    type: Map,
    of: {
      score: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true }
    },
    default: {}
  },
  // User settings and preferences
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
      showActivity: { type: Boolean, default: true },
      showStats: { type: Boolean, default: true }
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      startOfWeek: { type: String, enum: ['sunday', 'monday'], default: 'monday' }
    },
    coaching: {
      aiCoachEnabled: { type: Boolean, default: true },
      coachingFrequency: { type: String, enum: ['daily', 'weekly', 'asNeeded'], default: 'daily' },
      focusAreas: { type: [String], default: [] }
    }
  },
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
  },
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  // Password reset
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  // AI Data Usage Consent
  aiConsent: {
    type: Boolean,
    default: false,
    required: true
  },
  consentTimestamp: {
    type: Date,
    default: null
  },
  consentVersion: {
    type: String,
    default: null
  }
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export default mongoose.model('User', userSchema);
