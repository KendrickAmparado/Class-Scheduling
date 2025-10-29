import express from "express";
import Admin from "../models/Admin.js";
import Room from '../models/Room.js';
import Alert from '../models/Alert.js';
import InstructorNotification from '../models/InstructorNotification.js';

const router = express.Router();

// ===== ROOM ROUTES =====

// GET /api/admin/rooms - Get all rooms with status
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json({ rooms });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// ===== ADMIN AUTHENTICATION =====

// POST /api/admin/login - Admin login
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "No admin found in the database." 
      });
    }

    if (password.trim() === admin.password.trim()) {
      return res.json({ 
        success: true, 
        message: "Login successful!" 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: "Wrong password." 
      });
    }
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Server error." 
    });
  }
});

// ===== ALERT/ACTIVITY LOG ROUTES =====

// GET /api/admin/alerts - Get all alerts/activity logs
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching alerts.' 
    });
  }
});

// GET /api/admin/activity - Get all activities (admin alerts + instructor notifications)
router.get('/activity', async (req, res) => {
  try {
    const [alerts, instructorNotifs] = await Promise.all([
      Alert.find({}).sort({ createdAt: -1 }).lean(),
      InstructorNotification.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    const normalized = [
      ...alerts.map((a) => ({
        id: String(a._id),
        source: 'admin',
        type: a.type || 'alert',
        message: a.message,
        link: a.link || null,
        createdAt: a.createdAt || a.updatedAt,
      })),
      ...instructorNotifs.map((n) => ({
        id: String(n._id),
        source: 'instructor',
        type: 'instructor-notification',
        message: n.title ? `${n.title} — ${n.message}` : n.message,
        link: n.link || null,
        createdAt: n.createdAt || n.updatedAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, activities: normalized });
  } catch (err) {
    console.error('Failed to fetch activity:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching activity' });
  }
});

// DELETE /api/admin/alerts/cleanup - Clean up undefined/invalid alerts
router.delete('/alerts/cleanup', async (req, res) => {
  try {
    // Delete alerts with "undefined" in message
    const result = await Alert.deleteMany({
      message: /undefined/i
    });
    
    console.log(`✅ Cleaned up ${result.deletedCount} invalid alerts`);
    
    res.json({ 
      success: true, 
      message: `Cleaned up ${result.deletedCount} invalid alerts` 
    });
  } catch (error) {
    console.error('❌ Error cleaning alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cleaning alerts' 
    });
  }
});

// DELETE /api/admin/alerts/:id - Delete a specific alert
router.delete('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Alert.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Alert not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Alert deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting alert' 
    });
  }
});

// PUT /api/admin/alerts/:id/read - Mark alert as read
router.put('/alerts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      id, 
      { read: true }, 
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ 
        success: false, 
        message: 'Alert not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Alert marked as read',
      alert 
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating alert' 
    });
  }
});

// DELETE /api/admin/alerts - Delete all alerts (use with caution)
router.delete('/alerts', async (req, res) => {
  try {
    const result = await Alert.deleteMany({});
    
    console.log(`✅ Deleted all ${result.deletedCount} alerts`);
    
    res.json({ 
      success: true, 
      message: `Deleted all ${result.deletedCount} alerts` 
    });
  } catch (error) {
    console.error('❌ Error deleting all alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting alerts' 
    });
  }
});

export default router;
