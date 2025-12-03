import mongoose from 'mongoose';

const comBSubSchema = new mongoose.Schema({
  capability: { type: Number, min: 0, max: 10, default: 5 },
  opportunity: { type: Number, min: 0, max: 10, default: 5 },
  motivation: { type: Number, min: 0, max: 10, default: 5 },
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: { unique: true } },
  
  // New demographic fields
  demographics: {
    age: Number,
    gender: String,
    location: String,
    timezone: String
  },
  
  // Legacy COM-B fields
  age: { type: Number },
  sex: { type: String, enum: ['male','female','other','prefer_not_say'], default: 'prefer_not_say' },
  heightCm: { type: Number },
  weightKg: { type: Number },
  shiftWork: { type: Boolean, default: false },
  
  // per-pillar COM-B scores
  com_b: {
    sleep: { type: comBSubSchema, default: () => ({}) },
    diet: { type: comBSubSchema, default: () => ({}) },
    exercise: { type: comBSubSchema, default: () => ({}) },
    physical_health: { type: comBSubSchema, default: () => ({}) },
    mental_health: { type: comBSubSchema, default: () => ({}) },
    finances: { type: comBSubSchema, default: () => ({}) },
    social: { type: comBSubSchema, default: () => ({}) },
    spirituality: { type: comBSubSchema, default: () => ({}) },
  },
  
  // New goal selection
  selectedGoals: [{
    pillar: String,
    goal: String
  }],
  
  // Health screening responses
  healthScreens: {
    overall_health: Number,
    chronic_conditions: Boolean,
    medications: Boolean,
    exercise_frequency: String
  },
  
  // Mental health screening responses
  mentalHealthScreens: {
    depression: [Number],
    anxiety: [Number],
    stress: [Number]
  },
  
  // Completion tracking
  completedAt: Date,
  
  // Legacy extra field
  extra: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('OnboardingProfile', onboardingSchema);
