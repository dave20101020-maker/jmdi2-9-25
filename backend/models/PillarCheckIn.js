import mongoose from 'mongoose';

const PillarCheckInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pillarId: { type: String, required: true, index: true },
  value: { type: Number, required: true, min: 0, max: 10 },
  note: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('PillarCheckIn', PillarCheckInSchema);
