import express from 'express';
import Alert from '../models/Alert.js';

const router = express.Router();

/**
 * GET /api/admin/alerts
 * Return all alerts sorted by most recent
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching alerts.' });
  }
});

export default router;
