import mongoose from 'mongoose';

const emailNotificationSchema = new mongoose.Schema(
  {
    instructorEmail: { type: String, required: true, lowercase: true, trim: true },
    preferencesEnabled: { type: Boolean, default: true },
    scheduleChanges: { type: Boolean, default: true },
    roomStatus: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
    adminMessages: { type: Boolean, default: true },
    history: [
      {
        type: { type: String, required: true }, // e.g., 'scheduleChange', 'roomStatus', etc.
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

emailNotificationSchema.index({ instructorEmail: 1 });

export default mongoose.model('EmailNotification', emailNotificationSchema);