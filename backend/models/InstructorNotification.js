import mongoose from 'mongoose';

const instructorNotificationSchema = new mongoose.Schema(
  {
    instructorEmail: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

instructorNotificationSchema.index({ instructorEmail: 1, createdAt: -1 });

export default mongoose.model('InstructorNotification', instructorNotificationSchema);


