/**
 * MVCC-Enhanced Room Routes
 * Implements double-booking prevention and room status versioning
 */

import express from "express";
import Room from "../models/Room.js";
import Schedule from "../models/Schedule.js";
import { withRetry, MVCCTransaction } from "../middleware/mvccTransaction.js";
import { updateWithVersionControl } from "../utils/mvccManager.js";

const router = express.Router();

/**
 * POST create room with MVCC protection
 */
router.post("/create-mvcc", async (req, res) => {
  try {
    const { room, area, status } = req.body;

    if (!room || !area) {
      return res.status(400).json({
        success: false,
        message: "Room name and area are required",
        code: "VALIDATION_ERROR"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'room_creation');

    // Check for duplicate room
    const existingRoom = await Room.findOne({ room });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `Room ${room} already exists`,
        code: "DUPLICATE_ROOM"
      });
    }

    const newRoom = new Room({
      room,
      area,
      status: status || 'available'
    });

    await newRoom.save();
    transaction.addOperation(newRoom._id, 'create', newRoom.__v, newRoom);
    const txnRecord = transaction.commit();

    res.status(201).json({
      success: true,
      message: "Room created with MVCC protection",
      room: newRoom,
      transaction: txnRecord
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room already exists",
        code: "DUPLICATE_ERROR"
      });
    }

    console.error("Room creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating room",
      error: error.message
    });
  }
});

/**
 * PUT update room status with optimistic locking
 * Prevents concurrent status conflicts
 */
router.put("/:id/status-mvcc", async (req, res) => {
  try {
    const { id } = req.params;
    const { version, status, reason } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: "Version field required for optimistic locking",
        code: "VERSION_REQUIRED"
      });
    }

    if (!['available', 'occupied', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: available, occupied, or maintenance",
        code: "INVALID_STATUS"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'room_status_update');

    const updatedRoom = await withRetry(async () => {
      // Check for conflicts if changing to maintenance
      if (status === 'maintenance') {
        const activeSchedules = await Schedule.countDocuments({
          room: (await Room.findById(id)).room,
          archived: false
        });

        if (activeSchedules > 0) {
          throw new Error(
            `Cannot set room to maintenance: ${activeSchedules} active schedules exist`
          );
        }
      }

      return await updateWithVersionControl(Room, id, version, { status });
    }, 3, 100);

    transaction.addOperation(id, 'status_update', updatedRoom.__v, updatedRoom);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: `Room status updated to ${status}`,
      room: updatedRoom,
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

    if (error.message?.includes('maintenance')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: "ACTIVE_SCHEDULES"
      });
    }

    console.error("Room status update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating room status",
      error: error.message
    });
  }
});

/**
 * PUT update room details with optimistic locking
 */
router.put("/:id/update-mvcc", async (req, res) => {
  try {
    const { id } = req.params;
    const { version, room, area, status } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: "Version field required for optimistic locking",
        code: "VERSION_REQUIRED"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'room_update');

    const updatedRoom = await withRetry(async () => {
      // Check for name conflicts if changing room name
      if (room) {
        const existingRoom = await Room.findOne({
          room,
          _id: { $ne: id }
        });

        if (existingRoom) {
          throw new Error(`Room name ${room} already in use`);
        }
      }

      return await updateWithVersionControl(Room, id, version, { room, area, status });
    }, 3, 100);

    transaction.addOperation(id, 'update', updatedRoom.__v, updatedRoom);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: "Room updated with optimistic locking",
      room: updatedRoom,
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

    if (error.message?.includes('already in use')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: "DUPLICATE_NAME"
      });
    }

    console.error("Room update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating room",
      error: error.message
    });
  }
});

/**
 * GET room with version info and booking status
 */
router.get("/:id/version", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Get booking statistics
    const totalSchedules = await Schedule.countDocuments({
      room: room.room,
      archived: false
    });

    const upcomingSchedules = await Schedule.countDocuments({
      room: room.room,
      archived: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      room: {
        _id: room._id,
        __v: room.__v,
        room: room.room,
        area: room.area,
        status: room.status,
        archived: room.archived,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        bookingStats: {
          totalSchedules,
          upcomingSchedules,
          lastModified: room.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("Error fetching room version:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching room"
    });
  }
});

/**
 * POST check room availability for time slot
 * Prevents double-booking before schedule creation
 */
router.post("/:id/check-availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { day, timeStart, timeEnd } = req.body;

    if (!day || !timeStart || !timeEnd) {
      return res.status(400).json({
        success: false,
        message: "Day, timeStart, and timeEnd are required",
        code: "VALIDATION_ERROR"
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check for conflicting schedules
    const conflicts = await Schedule.find({
      room: room.room,
      day,
      archived: false,
      $or: [
        { timeStart: { $lt: timeEnd }, timeEnd: { $gt: timeStart } }
      ]
    });

    res.json({
      success: true,
      room: room.room,
      day,
      available: conflicts.length === 0,
      conflicts: conflicts.length,
      conflictingSchedules: conflicts.map(s => ({
        _id: s._id,
        subject: s.subject,
        instructor: s.instructor,
        day: s.day,
        time: s.time
      }))
    });

  } catch (error) {
    console.error("Error checking room availability:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking availability",
      error: error.message
    });
  }
});

/**
 * GET room booking conflicts
 * Lists all time slots with conflicts
 */
router.get("/:id/conflicts", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const schedules = await Schedule.find({
      room: room.room,
      archived: false
    }).sort({ day: 1, time: 1 });

    // Group by day
    const byDay = {};
    schedules.forEach(s => {
      if (!byDay[s.day]) byDay[s.day] = [];
      byDay[s.day].push({
        _id: s._id,
        subject: s.subject,
        instructor: s.instructor,
        time: s.time,
        course: s.course,
        section: s.section
      });
    });

    res.json({
      success: true,
      room: room.room,
      status: room.status,
      totalSchedules: schedules.length,
      schedulesByDay: byDay
    });

  } catch (error) {
    console.error("Error fetching room conflicts:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching conflicts",
      error: error.message
    });
  }
});

/**
 * POST bulk update room status with transaction support
 */
router.post("/bulk/status-mvcc", async (req, res) => {
  try {
    const { rooms } = req.body;

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Rooms array required",
        code: "INVALID_INPUT"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'bulk_room_status_update');
    const updated = [];
    const failed = [];

    for (const roomData of rooms) {
      try {
        const result = await updateWithVersionControl(
          Room,
          roomData._id,
          roomData.__v,
          { status: roomData.status }
        );

        transaction.addOperation(roomData._id, 'status_update', result.__v, result);
        updated.push(result);

      } catch (error) {
        failed.push({
          roomId: roomData._id,
          error: error.message
        });
      }
    }

    transaction.status = failed.length > 0 ? 'partial_success' : 'success';
    const txnRecord = transaction.commit();

    res.json({
      success: failed.length === 0,
      message: `Updated ${updated.length} rooms${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      updated: updated.length,
      failed: failed.length,
      rooms: updated,
      failures: failed,
      transaction: txnRecord
    });

  } catch (error) {
    console.error("Bulk room status update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating rooms",
      error: error.message
    });
  }
});

/**
 * GET room concurrency statistics
 */
router.get("/stats/concurrency", async (req, res) => {
  try {
    const stats = await Room.aggregate([
      {
        $group: {
          _id: "$__v",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalRooms = await Room.countDocuments();
    const recentlyModified = await Room.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    const statusDistribution = await Room.aggregate([
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
        totalRooms,
        recentlyModified,
        versionDistribution: stats,
        statusDistribution
      }
    });

  } catch (error) {
    console.error("Error fetching room concurrency stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics"
    });
  }
});

export default router;
