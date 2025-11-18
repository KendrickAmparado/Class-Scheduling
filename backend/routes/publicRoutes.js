import express from 'express';
import Schedule from '../models/Schedule.js';
import Section from '../models/Section.js';
import Room from '../models/Room.js';
import YearLevel from '../models/yearLevelModel.js';
import Instructor from '../models/Instructor.js';
import { getCurrentTime } from '../services/worldTimeService.js';

const router = express.Router();

/**
 * PUBLIC API ROUTES
 * 
 * These endpoints are publicly accessible and provide read-only access
 * to schedule information for students, parents, and external systems.
 * 
 * Security considerations:
 * - No sensitive data (no instructor emails, internal IDs)
 * - Read-only operations
 * - Rate limiting recommended (can be added via middleware)
 * - CORS enabled for public access
 */

// ============== WORLD TIME API ==============
/**
 * GET /api/public/time
 * Get current time from World Time API
 * Optional query param: timezone (default: Etc/UTC)
 */
router.get('/time', async (req, res) => {
  const timezone = req.query.timezone || 'Etc/UTC';
  try {
    const timeData = await worldTimeService.getCurrentTime(timezone);
    res.json(timeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== HEALTH CHECK ==============
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Class Scheduling System Public API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============== COURSES & PROGRAMS ==============

/**
 * GET /api/public/courses
 * Get list of available courses/programs
 */
router.get('/courses', async (req, res) => {
  try {
    // Get distinct courses from schedules
    const courses = await Schedule.distinct('course');
    
    const courseInfo = {
      bsit: {
        id: 'bsit',
        name: 'Bachelor of Science in Information Technology',
        shortName: 'BSIT',
        description: 'Information Technology Program'
      },
      'bsemc-dat': {
        id: 'bsemc-dat',
        name: 'Bachelor of Science in Entertainment and Multimedia Computing - Digital Animation Technology',
        shortName: 'BSEMC-DAT',
        description: 'Entertainment and Multimedia Computing Program'
      }
    };

    const availableCourses = courses
      .filter(course => courseInfo[course])
      .map(course => courseInfo[course]);

    res.json({
      success: true,
      courses: availableCourses,
      count: availableCourses.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// ============== YEAR LEVELS ==============

/**
 * GET /api/public/year-levels
 * Get list of available year levels
 */
router.get('/year-levels', async (req, res) => {
  try {
    const yearLevels = await YearLevel.find({}).select('year course subtitle -_id');
    res.json({
      success: true,
      yearLevels: yearLevels || [],
      count: yearLevels?.length || 0
    });
  } catch (error) {
    console.error('Error fetching year levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching year levels',
      error: error.message
    });
  }
});

// ============== SECTIONS ==============

/**
 * GET /api/public/sections
 * Get sections by course and year
 * Query params: course, year
 */
router.get('/sections', async (req, res) => {
  try {
    const { course, year } = req.query;

    if (!course || !year) {
      return res.status(400).json({
        success: false,
        message: 'Course and year parameters are required'
      });
    }

    const sections = await Section.find({ course, year })
      .select('name course year _id')
      .sort({ name: 1 });

    res.json({
      success: true,
      course,
      year,
      sections: sections || [],
      count: sections?.length || 0
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sections',
      error: error.message
    });
  }
});

// ============== ROOMS ==============

/**
 * GET /api/public/rooms
 * Get list of available rooms
 */
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({})
      .select('room area status -_id')
      .sort({ room: 1 });

    res.json({
      success: true,
      rooms: rooms || [],
      count: rooms?.length || 0
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message
    });
  }
});

// ============== SCHEDULES ==============

/**
 * GET /api/public/schedules
 * Get schedules with filtering options
 * Query params:
 *   - course: Filter by course
 *   - year: Filter by year level
 *   - section: Filter by section
 *   - day: Filter by day (monday, tuesday, etc.)
 *   - room: Filter by room
 *   - instructor: Filter by instructor name (partial match)
 *   - subject: Filter by subject (partial match)
 *   - limit: Limit results (default: 100, max: 500)
 *   - page: Page number for pagination (default: 1)
 */
router.get('/schedules', async (req, res) => {
  try {
    const {
      course,
      year,
      section,
      day,
      room,
      instructor,
      subject,
      limit = 100,
      page = 1
    } = req.query;

    // Build query
    const query = {};
    if (course) query.course = course;
    if (year) query.year = year;
    if (section) query.section = section;
    if (day) query.day = { $regex: new RegExp(day, 'i') };
    if (room) query.room = room;
    if (instructor) query.instructor = { $regex: new RegExp(instructor, 'i') };
    if (subject) query.subject = { $regex: new RegExp(subject, 'i') };

    // Parse pagination
    const limitNum = Math.min(parseInt(limit) || 100, 500);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [schedules, total] = await Promise.all([
      Schedule.find(query)
        .select('course year section subject instructor day time room -_id')
        .sort({ course: 1, year: 1, section: 1, day: 1, time: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Schedule.countDocuments(query)
    ]);

    res.json({
      success: true,
      schedules: schedules || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: skip + limitNum < total,
        hasPrev: pageNum > 1
      },
      filters: {
        course: course || null,
        year: year || null,
        section: section || null,
        day: day || null,
        room: room || null,
        instructor: instructor || null,
        subject: subject || null
      }
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules',
      error: error.message
    });
  }
});

/**
 * GET /api/public/schedules/by-section/:course/:year/:section
 * Get schedules for a specific section
 */
router.get('/schedules/by-section/:course/:year/:section', async (req, res) => {
  try {
    const { course, year, section } = req.params;

    const schedules = await Schedule.find({
      course,
      year,
      section
    })
      .select('subject instructor day time room -_id')
      .sort({ day: 1, time: 1 })
      .lean();

    res.json({
      success: true,
      course,
      year,
      section,
      schedules: schedules || [],
      count: schedules?.length || 0
    });
  } catch (error) {
    console.error('Error fetching section schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching section schedules',
      error: error.message
    });
  }
});

/**
 * GET /api/public/schedules/by-room/:room
 * Get schedules for a specific room
 */
router.get('/schedules/by-room/:room', async (req, res) => {
  try {
    const { room } = req.params;

    const schedules = await Schedule.find({ room })
      .select('course year section subject instructor day time -_id')
      .sort({ day: 1, time: 1 })
      .lean();

    res.json({
      success: true,
      room,
      schedules: schedules || [],
      count: schedules?.length || 0
    });
  } catch (error) {
    console.error('Error fetching room schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room schedules',
      error: error.message
    });
  }
});

/**
 * GET /api/public/schedules/by-day/:day
 * Get schedules for a specific day
 */
router.get('/schedules/by-day/:day', async (req, res) => {
  try {
    const { day } = req.params;

    const schedules = await Schedule.find({
      day: { $regex: new RegExp(day, 'i') }
    })
      .select('course year section subject instructor time room -_id')
      .sort({ time: 1 })
      .lean();

    res.json({
      success: true,
      day,
      schedules: schedules || [],
      count: schedules?.length || 0
    });
  } catch (error) {
    console.error('Error fetching day schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching day schedules',
      error: error.message
    });
  }
});

// ============== INSTRUCTORS ==============

/**
 * GET /api/public/instructors
 * Get list of instructors (public info only - no email)
 * Query params:
 *   - department: Filter by department
 *   - search: Search by name
 */
router.get('/instructors', async (req, res) => {
  try {
    const { department, search } = req.query;

    const query = { status: 'active' };
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { firstname: { $regex: new RegExp(search, 'i') } },
        { lastname: { $regex: new RegExp(search, 'i') } }
      ];
    }

    const instructors = await Instructor.find(query)
      .select('instructorId firstname lastname department -_id -email -password -image -status')
      .sort({ lastname: 1, firstname: 1 })
      .lean();

    res.json({
      success: true,
      instructors: instructors || [],
      count: instructors?.length || 0
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching instructors',
      error: error.message
    });
  }
});

/**
 * GET /api/public/instructors/:instructorId
 * Get public info about a specific instructor
 */
router.get('/instructors/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await Instructor.findOne({
      instructorId,
      status: 'active'
    })
      .select('instructorId firstname lastname department -_id -email -password -image -status')
      .lean();

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Get instructor's schedules
    const schedules = await Schedule.find({
      instructor: { $regex: new RegExp(`${instructor.firstname} ${instructor.lastname}`, 'i') }
    })
      .select('course year section subject day time room -_id')
      .sort({ day: 1, time: 1 })
      .lean();

    res.json({
      success: true,
      instructor: {
        ...instructor,
        schedules: schedules || [],
        scheduleCount: schedules?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching instructor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching instructor',
      error: error.message
    });
  }
});

// ============== STATISTICS ==============

/**
 * GET /api/public/statistics
 * Get public statistics about the scheduling system
 */
router.get('/statistics', async (req, res) => {
  try {
    const [
      totalSchedules,
      totalSections,
      totalRooms,
      totalInstructors,
      coursesCount,
      schedulesByDay,
      schedulesByCourse
    ] = await Promise.all([
      Schedule.countDocuments(),
      Section.countDocuments(),
      Room.countDocuments(),
      Instructor.countDocuments({ status: 'active' }),
      Schedule.distinct('course').then(courses => courses.length),
      Schedule.aggregate([
        {
          $group: {
            _id: '$day',
            count: { $sum: 1 }
          }
        }
      ]),
      Schedule.aggregate([
        {
          $group: {
            _id: '$course',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      statistics: {
        totalSchedules,
        totalSections,
        totalRooms,
        totalInstructors,
        totalCourses: coursesCount,
        schedulesByDay: schedulesByDay.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        schedulesByCourse: schedulesByCourse.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

export default router;

