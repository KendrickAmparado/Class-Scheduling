import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import InstructorNotification from '../models/InstructorNotification.js';

const router = express.Router();

// GET current instructor's notifications
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const email = req.userEmail;
    const notifications = await InstructorNotification
      .find({ instructorEmail: email })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Fetch instructor notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// PATCH mark single notification as read
router.patch('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const email = req.userEmail;
    const { id } = req.params;
    const updated = await InstructorNotification.findOneAndUpdate(
      { _id: id, instructorEmail: email },
      { $set: { read: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification: updated });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

// PATCH mark all as read
router.patch('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const email = req.userEmail;
    await InstructorNotification.updateMany({ instructorEmail: email, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
});

export default router;


