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

export default router;
