import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pillarId: { type: String, required: true },
  goalType: { type: String, enum: ['score','consistency','actions'], required: true },
  targetValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active','completed'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Challenge', challengeSchema);
