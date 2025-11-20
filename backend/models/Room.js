import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  room: { type: String, required: true },
  area: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    required: true,
    default: 'available',
  },
  archived: { type: Boolean, default: false },
}, {
  timestamps: true,
  versionKey: '__v',
  optimisticConcurrency: true
});

// Index for room queries
roomSchema.index({ room: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ archived: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
