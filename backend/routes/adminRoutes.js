import express from "express";
import Admin from "../models/Admin.js";
import Room from '../models/Room.js';
import Alert from '../models/Alert.js';
import InstructorNotification from '../models/InstructorNotification.js';
import bcrypt from 'bcryptjs';
import archiver from 'archiver';
import Schedule from '../models/Schedule.js';
import Instructor from '../models/Instructor.js';
import ScheduleTemplate from '../models/ScheduleTemplate.js';
import Section from '../models/Section.js';
import YearLevelModel from '../models/YearLevelModel.js';
import { logActivity } from '../utils/activityLogger.js';

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

    // Handle initial migration: if admin.password is not hashed, hash it on correct login, else use bcrypt
    let isValid;
    if (admin.password.length < 20) {
      // Probably plaintext
      isValid = (password.trim() === admin.password.trim());
      if (isValid) {
        // Upgrade/migrate to hashed password
        const hash = await bcrypt.hash(password, 10);
        admin.password = hash;
        await admin.save();
      }
    } else {
      isValid = await bcrypt.compare(password, admin.password);
    }
    if (isValid) {
      // Log admin login activity
      await logActivity({
        type: 'admin-login',
        message: 'Admin logged in',
        source: 'admin',
        link: '/admin/dashboard',
        io: req.io
      });
      
      return res.json({ success: true, message: "Login successful!" });
    } else {
      // Log failed login attempt
      await logActivity({
        type: 'admin-login-failed',
        message: 'Failed admin login attempt',
        source: 'admin',
        io: req.io
      });
      
      return res.status(401).json({ 
        success: false, 
        message: "Wrong password." 
      });
    }
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ 
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
    return res.json({ success: true, alerts });
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching alerts.' 
    });
  }
});

// GET /api/admin/activity - Get all activities (admin and instructor) with pagination
router.get('/activity', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Fetch all alerts (both admin and instructor activities are stored as alerts with source field)
    const alerts = await Alert.find({}).sort({ createdAt: -1 }).lean();

    const normalized = alerts.map((a) => ({
      id: String(a._id),
      source: a.source || 'admin', // Use the source field from the alert
      type: a.type || 'alert',
      message: a.message,
      link: a.link || null,
      createdAt: a.createdAt || a.updatedAt,
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = normalized.length;
    const paginated = normalized.slice(skip, skip + limit);

    return res.json({ 
      success: true, 
      activities: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Failed to fetch activity:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching activity' });
  }
});

// Helper function to create regex that handles plural/singular forms
const createPluralSingularRegex = (query) => {
  // Split query into words for multi-word handling
  const words = query.trim().split(/\s+/);
  
  // Helper function to get plural/singular patterns for a single word
  const getWordPatterns = (word) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [escapedWord];
    
    // Handle words ending in 'y' -> 'ies' (category -> categories, faculty -> faculties)
    if (/y$/i.test(word) && word.length > 1) {
      patterns.push(escapedWord.slice(0, -1) + 'ies');
    } else if (/ies$/i.test(word)) {
      patterns.push(escapedWord.slice(0, -3) + 'y');
    }
    
    // Handle words ending in 's', 'x', 'z', 'ch', 'sh' -> 'es' (class -> classes, box -> boxes)
    if (/[sxz]|[cs]h$/i.test(word) && !word.endsWith('es')) {
      patterns.push(escapedWord + 'es');
    } else if (/es$/i.test(word) && /[sxz]|[cs]h$/i.test(word.slice(0, -2))) {
      patterns.push(escapedWord.slice(0, -2));
    }
    
    // Handle simple 's' pluralization (room -> rooms, instructor -> instructors, schedule -> schedules)
    if (!word.endsWith('s') && !word.endsWith('es') && !word.endsWith('ies')) {
      patterns.push(escapedWord + 's');
    } else if (word.endsWith('s') && !word.endsWith('es') && !word.endsWith('ies') && word.length > 1) {
      patterns.push(escapedWord.slice(0, -1));
    }
    
    return [...new Set(patterns)];
  };
  
  // If single word, handle plural/singular
  if (words.length === 1) {
    const patterns = getWordPatterns(words[0]);
    const regexPattern = patterns.map(p => `(${p})`).join('|');
    return new RegExp(regexPattern, 'i');
  } else {
    // For multi-word queries, match the query as a whole with plural/singular variations
    // This allows matching "computer science" when searching for "computer sciences" or vice versa
    
    // Generate all combinations of singular/plural for each word
    const wordPatternArrays = words.map(word => getWordPatterns(word));
    
    // Create a pattern that matches any combination
    // Use word boundaries to ensure we match complete words
    const combinedPattern = words.map((word, idx) => {
      const patterns = wordPatternArrays[idx];
      return `(${patterns.join('|')})`;
    }).join('\\s+');
    
    return new RegExp(combinedPattern, 'i');
  }
};

// Unified search (rooms, instructors, schedules) with pagination
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ rooms: [], instructors: [], schedules: [], pagination: { rooms: {}, instructors: {}, schedules: {} } });
    
    // Log search activity
    await logActivity({
      type: 'search-performed',
      message: `Search performed: "${q}"`,
      source: 'admin',
      link: `/admin/search?q=${encodeURIComponent(q)}`,
      meta: { query: q },
      io: req.io
    });

    // Create regex that handles both singular and plural forms, case-insensitive
    const regex = createPluralSingularRegex(q);
    
    // Pagination parameters
    const roomsPage = parseInt(req.query.roomsPage) || 1;
    const instructorsPage = parseInt(req.query.instructorsPage) || 1;
    const schedulesPage = parseInt(req.query.schedulesPage) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const roomsSkip = (roomsPage - 1) * limit;
    const instructorsSkip = (instructorsPage - 1) * limit;
    const schedulesSkip = (schedulesPage - 1) * limit;

    const [RoomModel, InstructorModel, ScheduleModel] = await Promise.all([
      import('../models/Room.js').then(m => m.default),
      import('../models/Instructor.js').then(m => m.default),
      import('../models/Schedule.js').then(m => m.default),
    ]);

    // Get counts and paginated results
    // Include more fields in search to make it more comprehensive
    const [roomsCount, instructorsCount, schedulesCount, rooms, instructors, schedules] = await Promise.all([
      RoomModel.countDocuments({ $or: [{ room: regex }, { area: regex }, { status: regex }] }),
      InstructorModel.countDocuments({ $or: [ 
        { firstname: regex }, 
        { lastname: regex }, 
        { email: regex }, 
        { department: regex },
        { instructorId: regex },
        { contact: regex }
      ] }),
      ScheduleModel.countDocuments({ $or: [ 
        { subject: regex }, 
        { course: regex }, 
        { section: regex }, 
        { room: regex }, 
        { day: regex },
        { instructor: regex },
        { year: regex }
      ] }),
      RoomModel.find({ $or: [{ room: regex }, { area: regex }, { status: regex }] }).skip(roomsSkip).limit(limit).lean(),
      InstructorModel.find({ $or: [ 
        { firstname: regex }, 
        { lastname: regex }, 
        { email: regex }, 
        { department: regex },
        { instructorId: regex },
        { contact: regex }
      ] }).skip(instructorsSkip).limit(limit).lean(),
      ScheduleModel.find({ $or: [ 
        { subject: regex }, 
        { course: regex }, 
        { section: regex }, 
        { room: regex }, 
        { day: regex },
        { instructor: regex },
        { year: regex }
      ] }).skip(schedulesSkip).limit(limit).lean(),
    ]);

    return res.json({ 
      rooms, 
      instructors, 
      schedules,
      pagination: {
        rooms: {
          page: roomsPage,
          limit,
          total: roomsCount,
          totalPages: Math.ceil(roomsCount / limit),
          hasNext: roomsPage < Math.ceil(roomsCount / limit),
          hasPrev: roomsPage > 1
        },
        instructors: {
          page: instructorsPage,
          limit,
          total: instructorsCount,
          totalPages: Math.ceil(instructorsCount / limit),
          hasNext: instructorsPage < Math.ceil(instructorsCount / limit),
          hasPrev: instructorsPage > 1
        },
        schedules: {
          page: schedulesPage,
          limit,
          total: schedulesCount,
          totalPages: Math.ceil(schedulesCount / limit),
          hasNext: schedulesPage < Math.ceil(schedulesCount / limit),
          hasPrev: schedulesPage > 1
        }
      }
    });
  } catch (err) {
    console.error('Search failed:', err);
    return res.status(500).json({ rooms: [], instructors: [], schedules: [], pagination: { rooms: {}, instructors: {}, schedules: {} } });
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
    
    return res.json({ 
      success: true, 
      message: `Cleaned up ${result.deletedCount} invalid alerts` 
    });
  } catch (error) {
    console.error('❌ Error cleaning alerts:', error);
    return res.status(500).json({ 
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
    
    return res.json({ 
      success: true, 
      message: 'Alert deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return res.status(500).json({ 
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
    
    return res.json({ 
      success: true, 
      message: 'Alert marked as read',
      alert 
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return res.status(500).json({ 
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
    
    return res.json({ 
      success: true, 
      message: `Deleted all ${result.deletedCount} alerts` 
    });
  } catch (error) {
    console.error('❌ Error deleting all alerts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error deleting alerts' 
    });
  }
});

// GET /api/admin/backup - Download system data as ZIP
router.get('/backup', async (req, res) => {
  try {
    // Backup authorization: require ADMIN_BACKUP_KEY header or query param
    const adminKey = process.env.ADMIN_BACKUP_KEY;
    if (adminKey) {
      const providedKey = req.headers['x-admin-backup-key'] || req.query.key;
      if (!providedKey || String(providedKey) !== String(adminKey)) {
        return res.status(403).json({ success: false, message: 'Forbidden: invalid backup key' });
      }
    } else {
      // If no admin key configured, only allow in development for convenience
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Backup endpoint disabled. Configure ADMIN_BACKUP_KEY to enable.' });
      }
    }
    // Fetch all collections
    const [schedules, instructors, rooms, sections, templates, yearLevels, alerts, notifications] = await Promise.all([
      Schedule.find({}).lean(),
      Instructor.find({}).lean(),
      Room.find({}).lean(),
      Section.find({}).lean(),
      ScheduleTemplate.find({}).lean(),
      YearLevelModel.find({}).lean(),
      Alert.find({}).lean(),
      InstructorNotification.find({}).lean(),
    ]);

    // Create backup data object
    const backupData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        collections: {
          schedules: schedules.length,
          instructors: instructors.length,
          rooms: rooms.length,
          sections: sections.length,
          templates: templates.length,
          yearLevels: yearLevels.length,
          alerts: alerts.length,
          notifications: notifications.length,
        },
      },
      data: {
        schedules,
        instructors,
        rooms,
        sections,
        templates,
        yearLevels,
        alerts,
        notifications,
      },
    };

    // Set response headers for ZIP download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=\"class-scheduling-backup-${timestamp}.zip\"`);

    // Create archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      // Only send JSON error if headers not sent yet
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error creating backup' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add JSON file to archive
    archive.append(JSON.stringify(backupData, null, 2), {
      name: `backup-${timestamp}/data.json`,
    });

    // Add README with backup info
    const readme = `# Class Scheduling System Backup\\n\\n## Export Date: ${new Date().toLocaleString()}\\n## Version: 1.0\\n\\n### Collections Included:\\n- Schedules: ${schedules.length}\\n- Instructors: ${instructors.length}\\n- Rooms: ${rooms.length}\\n- Sections: ${sections.length}\\n- Templates: ${templates.length}\\n- Year Levels: ${yearLevels.length}\\n- Alerts: ${alerts.length}\\n- Notifications: ${notifications.length}\\n\\n### How to Use:\\n1. Extract this ZIP file\\n2. The 'data.json' file contains all system data\\n3. Keep this backup in a safe location\\n4. For restoration, contact your system administrator\\n\\n### Backup Information:\\n- Format: JSON\\n- Compression: ZIP\\n- Total Items: ${schedules.length + instructors.length + rooms.length + sections.length + templates.length + yearLevels.length + alerts.length + notifications.length}\\n`;

    archive.append(readme, {
      name: `backup-${timestamp}/README.md`,
    });

    // Finalize archive
    await archive.finalize();

    // Log the backup action
    await logActivity('BACKUP', 'DATA_EXPORT', `System backup created with ${schedules.length + instructors.length + rooms.length} items`, 'admin');

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    if (!res.headersSent) res.status(500).json({ 
      success: false, 
      message: 'Error creating backup' 
    });
  }
});

export default router;
