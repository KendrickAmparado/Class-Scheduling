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
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
