/**
 * MVCC-Enhanced Schedule Routes
 * Integrates optimistic locking and conflict detection for concurrent operations
 */

import express from "express";
import Schedule from "../models/Schedule.js";
import Room from "../models/Room.js";
import Section from "../models/Section.js";
import { withRetry, MVCCTransaction, detectChanges, createAuditLog } from "../middleware/mvccTransaction.js";
import {
  detectScheduleConflict,
  createScheduleWithValidation,
  updateWithVersionControl
} from "../utils/mvccManager.js";

const router = express.Router();

/**
 * GET /api/schedule
 * Compatibility endpoint: list schedules with optional filters
 * Excludes archived schedules by default (unless showArchived=true)
 */
router.get('/', async (req, res) => {
  try {
    const { course, year, section, day, room, instructor, subject, showArchived } = req.query;
    const query = {};
    if (course) query.course = course;
    if (year) query.year = year;
    if (section) query.section = section;
    if (day) query.day = { $regex: new RegExp(day, 'i') };
    if (room) query.room = room;
    if (instructor) query.instructor = { $regex: new RegExp(instructor, 'i') };
    if (subject) query.subject = { $regex: new RegExp(subject, 'i') };
    // By default, exclude archived schedules unless explicitly requested
    if (showArchived !== 'true') {
      query.archived = false;
    }

    const schedules = await Schedule.find(query).select('course year section subject instructor day time room archived createdAt updatedAt _id __v').sort({ course: 1, year: 1, section: 1, day: 1, time: 1 }).lean();
    // Return legacy array shape for frontend convenience
    return res.json(schedules || []);
  } catch (error) {
    console.error('Error fetching schedules list:', error);
    res.status(500).json({ success: false, message: 'Server error fetching schedules' });
  }
});

/**
 * POST create schedule with MVCC validation
 * Includes conflict detection, version tracking, and transaction logging
 */
router.post("/create-mvcc", async (req, res) => {
  try {
    const { course, year, section, subject, instructor, instructorEmail, day, time, room } = req.body;
    
    // Validate required fields
    if (!course || !year || !section || !subject || !instructor || !day || !time || !room) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        code: "VALIDATION_ERROR"
      });
    }

    // Create transaction
    const transaction = new MVCCTransaction(req.userId || 'system', 'schedule_creation');

    // Validate room exists and not archived
    const roomDoc = await Room.findOne({ room, archived: false });
    if (!roomDoc) {
      return res.status(404).json({
        success: false,
        message: `Room ${room} not found or archived`,
        code: "ROOM_NOT_FOUND"
      });
    }

    // Validate section exists and not archived
    const sectionDoc = await Section.findOne({
      course,
      year,
      name: section,
      archived: false
    });
    if (!sectionDoc) {
      return res.status(404).json({
        success: false,
        message: `Section ${section} not found or archived`,
        code: "SECTION_NOT_FOUND"
      });
    }

    // Detect conflicts (room and instructor double-booking)
    await detectScheduleConflict(room, day, time, null, Schedule);
    
    // Check instructor availability at same time
    const instructorConflict = await Schedule.findOne({
      instructor,
      day,
      time,
      archived: false
    });
    if (instructorConflict) {
      return res.status(409).json({
        success: false,
        message: `Instructor ${instructor} already has a schedule at ${day} ${time}`,
        code: "INSTRUCTOR_CONFLICT"
      });
    }

    // Create schedule atomically
    const newSchedule = new Schedule({
      course,
      year,
      section,
      subject,
      instructor,
      instructorEmail: instructorEmail?.toLowerCase(),
      day,
      time,
      room
    });

    await newSchedule.save();
    
    transaction.addOperation(newSchedule._id, 'create', newSchedule.__v, newSchedule);
    const txnRecord = transaction.commit();

    res.status(201).json({
      success: true,
      message: "Schedule created with MVCC protection",
      schedule: newSchedule,
      transaction: txnRecord
    });

  } catch (error) {
    if (error.message?.includes('conflict')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: "CONFLICT"
      });
    }
    
    console.error("Schedule creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating schedule",
      error: error.message
    });
  }
});

/**
 * PUT update schedule with optimistic locking
 * Prevents lost updates from concurrent modifications
 */
router.put("/:id/update-mvcc", async (req, res) => {
  try {
    const { id } = req.params;
    const { version, course, year, section, subject, instructor, instructorEmail, day, time, room } = req.body;

    // Version parameter is required for optimistic locking
    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: "Version field required for optimistic locking",
        code: "VERSION_REQUIRED"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'schedule_update');

    // Attempt update with retry logic for transient conflicts
    const updatedSchedule = await withRetry(async () => {
      // Check for conflicts (exclude current schedule)
      await detectScheduleConflict(room, day, time, id, Schedule);
      
      // Check instructor conflict (exclude current schedule)
      const instructorConflict = await Schedule.findOne({
        instructor,
        day,
        time,
        _id: { $ne: id },
        archived: false
      });
      if (instructorConflict) {
        throw new Error(`Instructor ${instructor} already has a schedule at ${day} ${time}`);
      }

      // Update with version control
      const updateData = { course, year, section, subject, instructor, instructorEmail: instructorEmail?.toLowerCase(), day, time, room };
      const updated = await updateWithVersionControl(Schedule, id, version, updateData);
      
      return updated;
    }, 3, 100); // Retry up to 3 times with exponential backoff

    // Record changes for audit trail
    const changes = detectChanges(
      { course: req.body.oldCourse, year: req.body.oldYear, section: req.body.oldSection, subject: req.body.oldSubject, instructor: req.body.oldInstructor, day: req.body.oldDay, time: req.body.oldTime, room: req.body.oldRoom },
      { course, year, section, subject, instructor, day, time, room }
    );

    transaction.addOperation(id, 'update', updatedSchedule.__v, updatedSchedule);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: "Schedule updated with optimistic locking",
      schedule: updatedSchedule,
      transaction: txnRecord,
      changes: changes.length
    });

  } catch (error) {
    if (error.message?.includes('Version conflict')) {
      return res.status(409).json({
        success: false,
        message: "Concurrent update detected. Please refresh and try again.",
        code: "VERSION_CONFLICT"
      });
    }
    
    console.error("Schedule update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating schedule",
      error: error.message
    });
  }
});

/**
 * GET schedule with version info
 * Returns current version for optimistic locking
 */
router.get("/:id/version", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({
      success: true,
      schedule: {
        _id: schedule._id,
        __v: schedule.__v,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        course: schedule.course,
        year: schedule.year,
        section: schedule.section,
        subject: schedule.subject,
        instructor: schedule.instructor,
        day: schedule.day,
        time: schedule.time,
        room: schedule.room
      }
    });

  } catch (error) {
    console.error("Error fetching schedule version:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching schedule"
    });
  }
});

/**
 * POST bulk create schedules with transaction support
 * Atomically creates multiple schedules with rollback on conflict
 */
router.post("/bulk/create-mvcc", async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Schedules array required",
        code: "INVALID_INPUT"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'bulk_schedule_creation');
    const created = [];
    const failed = [];

    for (const scheduleData of schedules) {
      try {
        // Validate conflicts
        await detectScheduleConflict(scheduleData.room, scheduleData.day, scheduleData.time, null, Schedule);

        const newSchedule = new Schedule({
          course: scheduleData.course,
          year: scheduleData.year,
          section: scheduleData.section,
          subject: scheduleData.subject,
          instructor: scheduleData.instructor,
          instructorEmail: scheduleData.instructorEmail?.toLowerCase(),
          day: scheduleData.day,
          time: scheduleData.time,
          room: scheduleData.room
        });

        await newSchedule.save();
        transaction.addOperation(newSchedule._id, 'create', newSchedule.__v, newSchedule);
        created.push(newSchedule);

      } catch (error) {
        failed.push({
          schedule: scheduleData,
          error: error.message
        });
      }
    }

    transaction.status = failed.length > 0 ? 'partial_success' : 'success';
    const txnRecord = transaction.commit();

    res.status(201).json({
      success: failed.length === 0,
      message: `Created ${created.length} schedules${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      created: created.length,
      failed: failed.length,
      schedules: created,
      failures: failed,
      transaction: txnRecord
    });

  } catch (error) {
    console.error("Bulk schedule creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating schedules",
      error: error.message
    });
  }
});

/**
 * GET concurrent access statistics
 * Shows version distribution for monitoring concurrent modifications
 */
router.get("/stats/concurrency", async (req, res) => {
  try {
    const stats = await Schedule.aggregate([
      {
        $group: {
          _id: "$__v",
          count: { $sum: 1 },
          minVersion: { $min: "$__v" },
          maxVersion: { $max: "$__v" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalSchedules = await Schedule.countDocuments();
    const recentlyModified = await Schedule.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    res.json({
      success: true,
      stats: {
        totalSchedules,
        recentlyModified,
        versionDistribution: stats
      }
    });

  } catch (error) {
    console.error("Error fetching concurrency stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics"
    });
  }
});


// ------------------ Compatibility routes (legacy paths) ------------------
// These endpoints mirror legacy frontend paths and will use MVCC when a
// `version` is provided in the request body. If `version` is omitted they
// fall back to legacy behavior to preserve backward compatibility.

// POST /create (legacy)
router.post('/create', async (req, res) => {
  try {
    const { course, year, section, subject, instructor, instructorEmail, day, time, room } = req.body;
    if (!course || !year || !section || !subject || !instructor || !day || !time || !room) {
      return res.status(400).json({ success: false, message: 'All fields are required', code: 'VALIDATION_ERROR' });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'schedule_creation');
    const roomDoc = await Room.findOne({ room, archived: false });
    if (!roomDoc) return res.status(404).json({ success: false, message: `Room ${room} not found or archived`, code: 'ROOM_NOT_FOUND' });

    const sectionDoc = await Section.findOne({ course, year, name: section, archived: false });
    if (!sectionDoc) return res.status(404).json({ success: false, message: `Section ${section} not found or archived`, code: 'SECTION_NOT_FOUND' });

    await detectScheduleConflict(room, day, time, null, Schedule);
    const instructorConflict = await Schedule.findOne({ instructor, day, time, archived: false });
    if (instructorConflict) return res.status(409).json({ success: false, message: `Instructor ${instructor} already has a schedule at ${day} ${time}`, code: 'INSTRUCTOR_CONFLICT' });

    const newSchedule = new Schedule({ course, year, section, subject, instructor, instructorEmail: instructorEmail?.toLowerCase(), day, time, room });
    await newSchedule.save();

    transaction.addOperation(newSchedule._id, 'create', newSchedule.__v, newSchedule);
    const txnRecord = transaction.commit();

    res.status(201).json({ success: true, message: 'Schedule created', schedule: newSchedule, transaction: txnRecord });
  } catch (error) {
    console.error('Compatibility create schedule error:', error);
    res.status(500).json({ success: false, message: 'Server error creating schedule', error: error.message });
  }
});

// PUT /:id (legacy)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;

    if (version !== undefined) {
      const { course, year, section, subject, instructor, instructorEmail, day, time, room } = req.body;
      const transaction = new MVCCTransaction(req.userId || 'system', 'schedule_update');

      const updatedSchedule = await withRetry(async () => {
        await detectScheduleConflict(room, day, time, id, Schedule);
        const instructorConflict = await Schedule.findOne({ instructor, day, time, _id: { $ne: id }, archived: false });
        if (instructorConflict) throw new Error(`Instructor ${instructor} already has a schedule at ${day} ${time}`);
        const updateData = { course, year, section, subject, instructor, instructorEmail: instructorEmail?.toLowerCase(), day, time, room };
        const updated = await updateWithVersionControl(Schedule, id, version, updateData);
        return updated;
      }, 3, 100);

      transaction.addOperation(id, 'update', updatedSchedule.__v, updatedSchedule);
      const txnRecord = transaction.commit();

      res.json({ success: true, message: 'Schedule updated', schedule: updatedSchedule, transaction: txnRecord });
      return;
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const fields = ['course','year','section','subject','instructor','instructorEmail','day','time','room'];
    fields.forEach(f => { if (req.body[f] !== undefined) schedule[f] = req.body[f]; });
    await schedule.save();

    res.json({ success: true, message: 'Schedule updated (legacy)', schedule });
  } catch (error) {
    if (error.message?.includes('Version conflict')) {
      return res.status(409).json({ success: false, message: 'Concurrent update detected. Please refresh and try again.', code: 'VERSION_CONFLICT' });
    }
    console.error('Compatibility schedule update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating schedule', error: error.message });
  }
});

/**
 * GET /api/schedule/:id
 * Fetch a single schedule by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
    }

    const schedule = await Schedule.findById(id).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    return res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Server error fetching schedule' });
  }
});

// DELETE /:id (legacy)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body || {};

    if (version !== undefined) {
      const deleted = await Schedule.findOneAndDelete({ _id: id, __v: version });
      if (!deleted) return res.status(409).json({ success: false, message: 'Version conflict or document not found', code: 'VERSION_CONFLICT' });
      return res.json({ success: true, message: 'Schedule deleted', schedule: deleted });
    }

    const deleted = await Schedule.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, message: 'Schedule deleted', schedule: deleted });
  } catch (error) {
    console.error('Compatibility schedule delete error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting schedule', error: error.message });
  }
});

export default router;

// ------------------ Compatibility: archive/restore/archived list ------------------
// POST archive (frontend uses POST /api/schedule/:id/archive)
router.post('/:id/archive', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    // If googleCalendar event exists, attempt to delete it (best-effort)
    if (schedule.googleCalendarEventId && schedule.instructorEmail) {
      try {
        const { deleteCalendarEvent } = await import('../services/googleCalendarService.js');
        await deleteCalendarEvent(schedule.googleCalendarEventId, schedule.instructorEmail);
        schedule.googleCalendarEventId = undefined;
      } catch (err) {
        console.warn('Failed to delete calendar event during archive:', err.message);
      }
    }

    schedule.archived = true;
    await schedule.save();

    res.json({ success: true, message: 'Schedule archived successfully.' });
  } catch (err) {
    console.error('Error archiving schedule (mvcc):', err);
    res.status(500).json({ success: false, message: 'Server error archiving schedule.' });
  }
});

// GET archived schedules
router.get('/archived', async (req, res) => {
  try {
    const archived = await Schedule.find({ archived: true }).select('course year section subject instructor day time room archived createdAt updatedAt _id');
    res.json({ success: true, schedules: archived });
  } catch (err) {
    console.error('Error fetching archived schedules (mvcc):', err);
    res.status(500).json({ success: false, message: 'Server error fetching archived schedules.' });
  }
});

// POST restore schedule
router.post('/:id/restore', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    schedule.archived = false;
    await schedule.save();

    // Best-effort re-sync to Google Calendar if configured
    try {
      const { isGoogleCalendarConfigured } = await import('../services/googleCalendarService.js');
      if (isGoogleCalendarConfigured()) {
        const { syncScheduleToCalendar } = await import('../utils/mvccManager.js');
        try { await syncScheduleToCalendar(schedule); } catch (e) { console.warn('Resync after restore failed:', e.message); }
      }
    } catch (_) {}

    res.json({ success: true, message: 'Schedule restored successfully.' });
  } catch (err) {
    console.error('Error restoring schedule (mvcc):', err);
    res.status(500).json({ success: false, message: 'Server error restoring schedule.' });
  }
});

// Permanently delete schedule
router.delete('/:id/permanent', async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, message: 'Schedule permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting schedule (mvcc):', err);
    res.status(500).json({ success: false, message: 'Server error deleting schedule' });
  }
});
