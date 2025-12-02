import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const ActionPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pillarId: { type: String, required: true },
  actions: { type: [actionSchema], default: [] },
}, { timestamps: true });

// Index for common lookups and sorting by recent plans
ActionPlanSchema.index({ userId: 1, pillarId: 1, createdAt: -1 });

export default mongoose.model('ActionPlan', ActionPlanSchema);
