import express from 'express';
import EmailNotification from '../models/EmailNotification.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get email notification preferences
router.get('/email-preferences', verifyToken, async (req, res) => {
  try {
    const email = req.userEmail;
    const preferences = await EmailNotification.findOne({ instructorEmail: email });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferences not found',
      });
    }

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email preferences',
    });
  }
});

// Update email notification preferences
router.post('/email-preferences', verifyToken, async (req, res) => {
  try {
    const email = req.userEmail;
    const { preferencesEnabled, scheduleChanges, roomStatus, weatherAlerts, adminMessages } = req.body;

    const updatedPreferences = await EmailNotification.findOneAndUpdate(
      { instructorEmail: email },
      {
        preferencesEnabled,
        scheduleChanges,
        roomStatus,
        weatherAlerts,
        adminMessages,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email preferences',
    });
  }
});

export default router;