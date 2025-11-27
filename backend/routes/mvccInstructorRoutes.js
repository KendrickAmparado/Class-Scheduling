/**
 * MVCC-Enhanced Instructor Routes
 * Handles concurrent instructor updates with optimistic locking
 */

import express from "express";
import Instructor from "../models/Instructor.js";
import Schedule from "../models/Schedule.js";
import { withRetry, MVCCTransaction } from "../middleware/mvccTransaction.js";
import { updateInstructorWithConflictResolution, updateWithVersionControl } from "../utils/mvccManager.js";

const router = express.Router();

/**
 * GET /api/instructors
 * Compatibility endpoint - list instructors
 * Excludes archived instructors by default (unless showArchived=true)
 */
router.get('/', async (req, res) => {
  try {
    const { showArchived } = req.query;
    const query = {};
    // By default, exclude archived instructors unless explicitly requested
    if (showArchived !== 'true') {
      query.archived = { $ne: true };
    }
    
    // Return instructors in the legacy shape expected by the frontend
    const instructors = await Instructor.find(query)
      .select('instructorId firstname lastname email contact department status archived createdAt updatedAt _id __v')
      .sort({ status: 1, lastname: 1, firstname: 1 })
      .lean();

    // Do not mutate database here; just return the array (legacy route previously auto-assigned IDs server-side).
      return res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors list:', error);
    res.status(500).json({ success: false, message: 'Server error fetching instructors' });
  }
});

/**
 * GET /api/instructors/profile/me
 * Get current user profile (authenticated)
 */
router.get('/profile/me', async (req, res) => {
  try {
    // Get user ID from auth middleware or JWT
    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const instructor = await Instructor.findById(userId)
      .select('instructorId firstname lastname email contact department status archived createdAt updatedAt _id __v')
      .lean();

    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor profile not found' });
    }

    return res.json(instructor);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

/**
 * PUT update instructor with optimistic locking
 * Prevents concurrent profile update conflicts
 */
router.put("/:id/update-mvcc", async (req, res) => {
  try {
    const { id } = req.params;
    const { version, firstname, lastname, email, contact, department, status } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: "Version field required for optimistic locking",
        code: "VERSION_REQUIRED"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'instructor_update');

    const updatedInstructor = await withRetry(async () => {
      return await updateInstructorWithConflictResolution(
        Instructor,
        id,
        version,
        { firstname, lastname, email: email?.toLowerCase(), contact, department, status },
        req.userId || 'system'
      );
    }, 3, 100);

    // If email changed, update all associated schedules
    if (email) {
      await Schedule.updateMany(
        { instructor: `${(await Instructor.findById(id)).firstname} ${(await Instructor.findById(id)).lastname}` },
        { instructorEmail: email.toLowerCase() }
      );
    }

    transaction.addOperation(id, 'update', updatedInstructor.__v, updatedInstructor);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: "Instructor updated with optimistic locking",
      instructor: updatedInstructor,
      transaction: txnRecord
    });

  } catch (error) {
    if (error.message?.includes('Version conflict')) {
      return res.status(409).json({
        success: false,
        message: "Concurrent update detected. Please refresh and try again.",
        code: "VERSION_CONFLICT"
      });
    }

    if (error.message?.includes('already in use') || error.message?.includes('Email')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: "EMAIL_CONFLICT"
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already in use by another instructor",
        code: "DUPLICATE_EMAIL"
      });
    }

    console.error("Instructor update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating instructor",
      error: error.message
    });
  }
});

/**
 * PATCH update instructor assignment (partial update)
 * Handles concurrent assignment changes
 */
router.patch("/:id/assign-mvcc", async (req, res) => {
  try {
    const { id } = req.params;
    const { version, departmentAssignment, courseLoad, status } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: "Version field required for optimistic locking",
        code: "VERSION_REQUIRED"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'instructor_assignment');

    const updateData = {};
    if (departmentAssignment) updateData.department = departmentAssignment;
    if (status) updateData.status = status;

    const updatedInstructor = await withRetry(async () => {
      return await updateWithVersionControl(Instructor, id, version, updateData);
    }, 3, 100);

    transaction.addOperation(id, 'assignment', updatedInstructor.__v, updatedInstructor);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: "Instructor assignment updated",
      instructor: updatedInstructor,
      transaction: txnRecord
    });

  } catch (error) {
    if (error.message?.includes('Version conflict')) {
      return res.status(409).json({
        success: false,
        message: "Concurrent update detected. Please refresh and try again.",
        code: "VERSION_CONFLICT"
      });
    }

    console.error("Instructor assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating assignment",
      error: error.message
    });
  }
});

/**
 * GET instructor with version info and schedule details
 */
router.get("/:id/version", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found"
      });
    }

    // Get schedule information
    const schedules = await Schedule.find({
      $or: [
        { instructor: `${instructor.firstname} ${instructor.lastname}` },
        { instructorEmail: instructor.email }
      ],
      archived: false
    });

    res.json({
      success: true,
      instructor: {
        _id: instructor._id,
        __v: instructor.__v,
        firstname: instructor.firstname,
        lastname: instructor.lastname,
        email: instructor.email,
        status: instructor.status,
        department: instructor.department,
        createdAt: instructor.createdAt,
        updatedAt: instructor.updatedAt,
        scheduleInfo: {
          totalSchedules: schedules.length,
          courseCount: new Set(schedules.map(s => s.course)).size,
          courses: Array.from(new Set(schedules.map(s => s.course)))
        }
      }
    });

  } catch (error) {
    console.error("Error fetching instructor version:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching instructor"
    });
  }
});

/**
 * POST bulk update instructor assignments with transaction support
 */
router.post("/bulk/assign-mvcc", async (req, res) => {
  try {
    const { instructors } = req.body;

    if (!Array.isArray(instructors) || instructors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Instructors array required",
        code: "INVALID_INPUT"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'bulk_instructor_assignment');
    const updated = [];
    const failed = [];

    for (const instructorData of instructors) {
      try {
        const updateData = {
          department: instructorData.department,
          status: instructorData.status
        };

        const result = await updateWithVersionControl(
          Instructor,
          instructorData._id,
          instructorData.__v,
          updateData
        );

        transaction.addOperation(instructorData._id, 'assignment', result.__v, result);
        updated.push(result);

      } catch (error) {
        failed.push({
          instructorId: instructorData._id,
          error: error.message
        });
      }
    }

    transaction.status = failed.length > 0 ? 'partial_success' : 'success';
    const txnRecord = transaction.commit();

    res.json({
      success: failed.length === 0,
      message: `Updated ${updated.length} instructors${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      updated: updated.length,
      failed: failed.length,
      instructors: updated,
      failures: failed,
      transaction: txnRecord
    });

  } catch (error) {
    console.error("Bulk instructor assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating instructors",
      error: error.message
    });
  }
});

/**
 * GET instructor schedule conflicts
 * Detects if instructor has overlapping schedules
 */
router.get("/:id/conflicts", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found"
      });
    }

    const fullName = `${instructor.firstname} ${instructor.lastname}`;

    // Get instructor's schedules
    const schedules = await Schedule.find({
      $or: [
        { instructor: { $regex: new RegExp(`^${fullName}$`, 'i') } },
        { instructorEmail: instructor.email }
      ],
      archived: false
    });

    // Check for time conflicts
    const conflicts = [];
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        if (schedules[i].day === schedules[j].day && schedules[i].time === schedules[j].time) {
          conflicts.push({
            schedule1: {
              _id: schedules[i]._id,
              subject: schedules[i].subject,
              room: schedules[i].room,
              time: schedules[i].time
            },
            schedule2: {
              _id: schedules[j]._id,
              subject: schedules[j].subject,
              room: schedules[j].room,
              time: schedules[j].time
            }
          });
        }
      }
    }

    res.json({
      success: true,
      instructor: {
        _id: instructor._id,
        name: fullName,
        email: instructor.email,
        totalSchedules: schedules.length,
        conflicts: conflicts.length,
        conflictDetails: conflicts
      }
    });

  } catch (error) {
    console.error("Error checking instructor conflicts:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking conflicts",
      error: error.message
    });
  }
});

/**
 * GET workload summary for a specific instructor by ID
 * Returns weekly summary and daily breakdown
 */
router.get("/:id/workload", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Find all schedules for this instructor
    const schedules = await Schedule.find({ instructorEmail: instructor.email });

    // Helper to parse time string like "08:00 AM - 09:30 AM" to hours
    function parseHours(timeStr) {
      if (!timeStr || typeof timeStr !== 'string') return 0;
      const parts = timeStr.split('-').map(p => p.trim());
      if (parts.length < 2) return 0;
      const parseTime = (t) => {
        let [time, modifier] = t.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (modifier && modifier.toLowerCase() === 'pm' && h !== 12) h += 12;
        if (modifier && modifier.toLowerCase() === 'am' && h === 12) h = 0;
        return h * 60 + (m || 0);
      };
      try {
        const start = parseTime(parts[0]);
        const end = parseTime(parts[1]);
        return Math.max(0, (end - start) / 60);
      } catch {
        return 0;
      }
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyBreakdown = days.map(day => {
      const daySchedules = schedules.filter(s => (s.day || '').toLowerCase() === day.toLowerCase());
      const hours = daySchedules.reduce((sum, s) => sum + parseHours(s.time), 0);
      return { day, classes: daySchedules.length, hours: Math.round(hours * 100) / 100 };
    });

    const totalClasses = schedules.length;
    const totalHours = dailyBreakdown.reduce((sum, d) => sum + d.hours, 0);
    const busiestDay = dailyBreakdown.reduce((a, b) => (a.hours > b.hours ? a : b), { day: '', hours: 0 }).day;

    res.json({
      weeklySummary: {
        totalClasses,
        totalHours: Math.round(totalHours * 100) / 100,
        busiestDay: busiestDay || 'N/A'
      },
      dailyBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch workload data', error: err.message });
  }
});

/**
 * POST resolve instructor schedule conflicts
 * Reassigns conflicting schedules
 */
router.post("/:id/resolve-conflicts", async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleIdToKeep, newInstructorForOther } = req.body;

    if (!scheduleIdToKeep || !newInstructorForOther) {
      return res.status(400).json({
        success: false,
        message: "scheduleIdToKeep and newInstructorForOther are required",
        code: "VALIDATION_ERROR"
      });
    }

    const instructor = await Instructor.findById(id);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'resolve_instructor_conflicts');

    // Update the conflicting schedule
    const conflictingSchedule = await Schedule.findByIdAndUpdate(
      scheduleIdToKeep,
      {
        instructor: newInstructorForOther,
        $inc: { __v: 1 }
      },
      { new: true }
    );

    transaction.addOperation(scheduleIdToKeep, 'reassign', conflictingSchedule.__v, conflictingSchedule);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: "Schedule conflict resolved",
      schedule: conflictingSchedule,
      transaction: txnRecord
    });

  } catch (error) {
    console.error("Error resolving conflicts:", error);
    res.status(500).json({
      success: false,
      message: "Server error resolving conflicts",
      error: error.message
    });
  }
});

/**
 * GET instructor concurrency statistics
 */
router.get("/stats/concurrency", async (req, res) => {
  try {
    const stats = await Instructor.aggregate([
      {
        $group: {
          _id: "$__v",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalInstructors = await Instructor.countDocuments();
    const recentlyModified = await Instructor.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    const statusDistribution = await Instructor.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalInstructors,
        recentlyModified,
        versionDistribution: stats,
        statusDistribution
      }
    });

  } catch (error) {
    console.error("Error fetching instructor concurrency stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics"
    });
  }
});

// ------------------ Compatibility routes (legacy paths for instructors) ------------------

// PUT /:id (legacy) - update instructor profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version, firstname, lastname, email, contact, department, status } = req.body;

    if (version !== undefined) {
      const transaction = new MVCCTransaction(req.userId || 'system', 'instructor_update');
      const updatedInstructor = await withRetry(async () => {
        return await updateInstructorWithConflictResolution(Instructor, id, version, { firstname, lastname, email: email?.toLowerCase(), contact, department, status }, req.userId || 'system');
      }, 3, 100);

      if (email) {
        await Schedule.updateMany({ instructor: `${(await Instructor.findById(id)).firstname} ${(await Instructor.findById(id)).lastname}` }, { instructorEmail: email.toLowerCase() });
      }

      transaction.addOperation(id, 'update', updatedInstructor.__v, updatedInstructor);
      const txnRecord = transaction.commit();
      return res.json({ success: true, message: 'Instructor updated', instructor: updatedInstructor, transaction: txnRecord });
    }

    // Legacy fallback
    const instructor = await Instructor.findById(id);
    if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });
    if (firstname !== undefined) instructor.firstname = firstname;
    if (lastname !== undefined) instructor.lastname = lastname;
    if (email !== undefined) instructor.email = email;
    if (contact !== undefined) instructor.contact = contact;
    if (department !== undefined) instructor.department = department;
    if (status !== undefined) instructor.status = status;
    await instructor.save();

    res.json({ success: true, message: 'Instructor updated (legacy)', instructor });
  } catch (error) {
    if (error.message?.includes('Version conflict')) return res.status(409).json({ success: false, message: 'Concurrent update detected. Please refresh and try again.', code: 'VERSION_CONFLICT' });
    if (error.message?.includes('already in use') || error.message?.includes('Email')) return res.status(409).json({ success: false, message: error.message, code: 'EMAIL_CONFLICT' });
    console.error('Compatibility instructor update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating instructor', error: error.message });
  }
});

export default router;

// ------------------ Additional compatibility: archive/restore/delete ------------------
// These handlers mirror the legacy behavior so frontend calls to /api/instructors/:id/archive etc. work

// Archive instructor (soft)
router.put('/:id/archive', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', archivedDate: new Date() },
      { new: true }
    );
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor archived', instructor });
  } catch (err) {
    console.error('Error archiving instructor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore instructor
router.put('/:id/restore', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: 'active', archivedDate: null },
      { new: true }
    );
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor restored', instructor });
  } catch (err) {
    console.error('Error restoring instructor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/instructors/:id
 * Fetch a single instructor by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid instructor ID' });
    }

    const instructor = await Instructor.findById(id)
      .select('instructorId firstname lastname email contact department status archived createdAt updatedAt _id __v')
      .lean();
    
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    return res.json(instructor);
  } catch (error) {
    console.error('Error fetching instructor:', error);
    res.status(500).json({ success: false, message: 'Server error fetching instructor' });
  }
});

// Move to archive (soft delete) via DELETE
router.delete('/:id', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', archivedDate: new Date() },
      { new: true }
    );
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor moved to archive', instructor });
  } catch (err) {
    console.error('Error moving instructor to archive:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Permanently delete instructor
router.delete('/:id/permanent', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndDelete(req.params.id);
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting instructor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH aliases for frontend (many places use PATCH)
router.patch('/:id/archive', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', archivedDate: new Date() },
      { new: true }
    );
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor archived', instructor });
  } catch (err) {
    console.error('Error archiving instructor (patch):', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/restore', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: 'active', archivedDate: null },
      { new: true }
    );
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor restored', instructor });
  } catch (err) {
    console.error('Error restoring instructor (patch):', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Permanently delete (alias for DELETE /:id/permanent) via DELETE already exists; also support PATCH /:id/permanent
router.patch('/:id/permanent', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndDelete(req.params.id);
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found' });
    res.json({ success: true, message: 'Instructor permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting instructor (patch):', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
