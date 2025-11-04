import express from "express";
import Schedule from "../models/Schedule.js";
import ScheduleTemplate from "../models/ScheduleTemplate.js";
import InstructorNotification from "../models/InstructorNotification.js";
import Alert from '../models/Alert.js';
import validator from 'validator';

const router = express.Router();

// CREATE schedule
router.post("/create", async (req, res) => {
  try {
    const { course, year, section, subject, instructor, instructorEmail, day, time, room } = req.body;

    let instructorEmailFinal = instructorEmail ? String(instructorEmail).trim().toLowerCase() : undefined;
    let instructorNameFinal = instructor ? String(instructor).trim() : undefined;

    if (!course || !year || !section || !subject || !instructorNameFinal || !day || !time || !room) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Use email if available, else try to resolve from name
    if (!instructorEmailFinal && instructorNameFinal) {
      const Instructor = (await import('../models/Instructor.js')).default;
      const resolved = await Instructor.findOne({ $or: [
        { email: { $regex: new RegExp('^'+validator.escape(instructorNameFinal)+'$', 'i') } },
        { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: instructorNameFinal, options: 'i' } } }
      ]});
      instructorEmailFinal = resolved ? resolved.email.toLowerCase() : undefined;
    }

    // Conflict detection (room and instructor at same time/day)
    const [startStr, endStr] = String(time).split(' - ').map(s => s.trim());
    const toMinutes = (t) => {
      if (!t) return -1;
      const [hhmm, ampm] = t.split(' ');
      let [h, m] = hhmm.split(':').map(Number);
      let H = h;
      if (ampm?.toLowerCase() === 'pm' && h !== 12) H = h + 12;
      if (ampm?.toLowerCase() === 'am' && h === 12) H = 0;
      return (H * 60) + (m || 0);
    };
    const startMin = toMinutes(startStr);
    const endMin = toMinutes(endStr);
    if (startMin < 0 || endMin <= startMin) {
      return res.status(400).json({ success: false, message: 'Invalid time range' });
    }
    const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
    // Room conflicts
    const roomConflicts = await Schedule.find({ room, day }).lean();
    const hasRoomConflict = roomConflicts.some(s => {
      const [st, et] = String(s.time || '').split(' - ').map(x=>x.trim());
      const sMin = toMinutes(st), eMin = toMinutes(et);
      return overlaps(startMin, endMin, sMin, eMin);
    });
    if (hasRoomConflict) {
      return res.status(409).json({ success: false, message: `Room ${room} is occupied at ${day} ${time}` });
    }
    // Instructor conflicts
    const instructorConflicts = await Schedule.find({ instructor: instructorNameFinal, day }).lean();
    const hasInstructorConflict = instructorConflicts.some(s => {
      const [st, et] = String(s.time || '').split(' - ').map(x=>x.trim());
      const sMin = toMinutes(st), eMin = toMinutes(et);
      return overlaps(startMin, endMin, sMin, eMin);
    });
    if (hasInstructorConflict) {
      return res.status(409).json({ success: false, message: `${instructorNameFinal} already has a schedule at ${day} ${time}` });
    }

    const newSchedule = new Schedule({
      course, year, section, subject,
      instructor: instructorNameFinal,
      instructorEmail: instructorEmailFinal,
      day, time, room
    });

    await newSchedule.save();

    // Create instructor-targeted notification if we can resolve an email
    try {
      let targetEmail = req.body.instructorEmail;
      if (!targetEmail) {
        // try to resolve by instructor name
        const Instructor = (await import('../models/Instructor.js')).default;
        const instructorDoc = await Instructor.findOne({
          $or: [
            { email: req.body.instructor },
            { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: req.body.instructor, options: 'i' } } }
          ]
        });
        targetEmail = instructorDoc?.email;
      }
      if (targetEmail) {
        const notif = await InstructorNotification.create({
          instructorEmail: targetEmail,
          title: 'Schedule Update',
          message: `A new schedule was created for ${course} ${year} - ${section} (${subject})`,
          link: null
        });
        if (req.io) {
          // emit to all for simplicity; can be room-specific if you track rooms by email
          req.io.emit('instructor-notification', { email: targetEmail, notification: notif });
        }
      }
    } catch (e) {
      console.error('Failed to create instructor notification:', e);
    }

    // Create and emit alert
    const alert = await Alert.create({
      type: 'schedule-created',
      message: `New schedule created for ${course} ${year} - Section ${section} (${subject})`,
      link: `/admin/schedule/${course}/${year}`,
    });
    if (req.io) {
      req.io.emit('new-alert', alert);
    }

    res.json({ success: true, message: "Schedule created successfully!" });
  } catch (err) {
    console.error("Schedule creation error:", err);
    res.status(500).json({ success: false, message: "Server error while saving schedule." });
  }
});

// GET schedules filtered by course and year
router.get('/', async (req, res) => {
  try {
    const { course, year } = req.query;
    const schedules = await Schedule.find({ course, year });
    res.json(schedules);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
});

// ENHANCED: GET schedules filtered by instructor's email with comprehensive debugging
router.get('/instructor/:instructorEmail', async (req, res) => {
  try {
    const { instructorEmail } = req.params;
    console.log('🔍 Backend: Searching for instructor email:', instructorEmail);
    
    // Import Instructor model
    const Instructor = (await import('../models/Instructor.js')).default;
    
    // Step 1: Verify instructor exists (case-insensitive email)
    const instructor = await Instructor.findOne({ email: { $regex: new RegExp(`^${instructorEmail}$`, 'i') } });
    console.log('🔍 Backend: Instructor profile found:', instructor ? 'Yes' : 'No');
    
    const instructorName = instructor ? `${instructor.firstname} ${instructor.lastname}` : null;
    if (instructorName) {
      console.log('🔍 Backend: Instructor full name:', instructorName);
      console.log('🔍 Backend: Instructor status:', instructor.status);
    }
    
    // Step 2: Search strategies with detailed logging - CASE INSENSITIVE
    let schedules = [];
    let searchMethod = '';
    
    // Strategy 1: Search by email (case-insensitive)
    schedules = await Schedule.find({ instructorEmail: { $regex: new RegExp(`^${instructorEmail}$`, 'i') } });
    console.log('🔍 Backend: Strategy 1 (case-insensitive email):', schedules.length, 'schedules');
    
    if (schedules.length > 0) {
      searchMethod = 'case-insensitive-email';
    } else if (instructorName) {
      // Strategy 2: Search by instructor name (case-insensitive)
      schedules = await Schedule.find({ instructor: { $regex: new RegExp(`^${instructorName}$`, 'i') } });
      console.log('🔍 Backend: Strategy 2 (case-insensitive name):', schedules.length, 'schedules');
      
      if (schedules.length > 0) {
        searchMethod = 'case-insensitive-name';
      } else {
        // Strategy 3: Search by partial name matches
        schedules = await Schedule.find({ 
          instructor: { $regex: new RegExp(instructorName, 'i') }
        });
        console.log('🔍 Backend: Strategy 3 (partial name):', schedules.length, 'schedules');
        
        if (schedules.length > 0) {
          searchMethod = 'partial-name';
        }
      }
    }
    
    // Step 3: Debug information if no schedules found
    if (schedules.length === 0) {
      console.log('❌ Backend: No schedules found for instructor');
      
      // Get all schedules for debugging
      const allSchedules = await Schedule.find({}).limit(10);
      console.log('🔍 Backend: Sample schedules in database:');
      allSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. Instructor: "${schedule.instructor}" | Email: "${schedule.instructorEmail || 'N/A'}"`);
      });
      
      // Get all instructor variations
      const allInstructorNames = await Schedule.distinct('instructor');
      console.log('🔍 Backend: All instructor names in schedules:', allInstructorNames);
      
      // Return detailed debug info
      return res.json({
        schedules: [],
        debug: {
          requestedEmail: instructorEmail,
          instructorFound: !!instructor,
          instructorName: instructorName,
          instructorStatus: instructor?.status,
          searchStrategiesUsed: ['case-insensitive-email', 'case-insensitive-name', 'partial-name'],
          totalSchedulesInDB: await Schedule.countDocuments(),
          sampleScheduleInstructors: allInstructorNames.slice(0, 5),
          suggestion: 'Check if schedules were created with correct instructor information'
        }
      });
    }
    
    // Step 4: Success response with method used
    console.log('✅ Backend: Found', schedules.length, 'schedules using method:', searchMethod);
    
    res.json({
      schedules,
      debug: {
        searchMethod: searchMethod,
        instructorName: instructorName,
        schedulesFound: schedules.length
      }
    });
    
  } catch (err) {
    console.error('Error fetching schedules for instructor:', err);
    res.status(500).json({ 
      message: 'Server error fetching schedules for instructor',
      error: err.message 
    });
  }
});

// GET schedules by instructor name (case-insensitive, partial match)
router.get('/instructor/by-name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    if (!name || !name.trim()) return res.json([]);
    const regex = new RegExp(name.trim(), 'i');
    const schedules = await Schedule.find({ instructor: regex });
    res.json({ schedules });
  } catch (err) {
    console.error('Error fetching schedules by instructor name:', err);
    res.status(500).json({ message: 'Server error fetching schedules by name' });
  }
});

// UPDATE schedule
router.put('/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { course, year, section, subject, instructor, instructorEmail, day, time, room } = req.body;

    // Find the existing schedule
    const existingSchedule = await Schedule.findById(scheduleId);
    if (!existingSchedule) {
      return res.status(404).json({ success: false, message: "Schedule not found." });
    }

    let instructorEmailFinal = instructorEmail ? String(instructorEmail).trim().toLowerCase() : undefined;
    let instructorNameFinal = instructor ? String(instructor).trim() : undefined;

    if (!course || !year || !section || !subject || !instructorNameFinal || !day || !time || !room) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Resolve instructor email if not provided
    if (!instructorEmailFinal && instructorNameFinal) {
      const Instructor = (await import('../models/Instructor.js')).default;
      const resolved = await Instructor.findOne({ $or: [
        { email: { $regex: new RegExp('^'+validator.escape(instructorNameFinal)+'$', 'i') } },
        { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: instructorNameFinal, options: 'i' } } }
      ]});
      instructorEmailFinal = resolved ? resolved.email.toLowerCase() : undefined;
    }

    // Conflict detection - EXCLUDE current schedule being edited
    const [startStr, endStr] = String(time).split(' - ').map(s => s.trim());
    const toMinutes = (t) => {
      if (!t) return -1;
      const [hhmm, ampm] = t.split(' ');
      let [h, m] = hhmm.split(':').map(Number);
      let H = h;
      if (ampm?.toLowerCase() === 'pm' && h !== 12) H = h + 12;
      if (ampm?.toLowerCase() === 'am' && h === 12) H = 0;
      return (H * 60) + (m || 0);
    };
    const startMin = toMinutes(startStr);
    const endMin = toMinutes(endStr);
    if (startMin < 0 || endMin <= startMin) {
      return res.status(400).json({ success: false, message: 'Invalid time range' });
    }
    const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
    
    // Room conflicts - exclude current schedule
    const roomConflicts = await Schedule.find({ 
      room, 
      day,
      _id: { $ne: scheduleId } // Exclude the schedule being edited
    }).lean();
    const hasRoomConflict = roomConflicts.some(s => {
      const [st, et] = String(s.time || '').split(' - ').map(x=>x.trim());
      const sMin = toMinutes(st), eMin = toMinutes(et);
      return overlaps(startMin, endMin, sMin, eMin);
    });
    if (hasRoomConflict) {
      return res.status(409).json({ success: false, message: `Room ${room} is occupied at ${day} ${time}` });
    }
    
    // Instructor conflicts - exclude current schedule
    const instructorConflicts = await Schedule.find({ 
      instructor: instructorNameFinal, 
      day,
      _id: { $ne: scheduleId } // Exclude the schedule being edited
    }).lean();
    const hasInstructorConflict = instructorConflicts.some(s => {
      const [st, et] = String(s.time || '').split(' - ').map(x=>x.trim());
      const sMin = toMinutes(st), eMin = toMinutes(et);
      return overlaps(startMin, endMin, sMin, eMin);
    });
    if (hasInstructorConflict) {
      return res.status(409).json({ success: false, message: `${instructorNameFinal} already has a schedule at ${day} ${time}` });
    }

    // Store old values for notification comparison
    const oldInstructor = existingSchedule.instructor;
    const oldInstructorEmail = existingSchedule.instructorEmail;

    // Update the schedule
    existingSchedule.course = course;
    existingSchedule.year = year;
    existingSchedule.section = section;
    existingSchedule.subject = subject;
    existingSchedule.instructor = instructorNameFinal;
    existingSchedule.instructorEmail = instructorEmailFinal;
    existingSchedule.day = day;
    existingSchedule.time = time;
    existingSchedule.room = room;

    await existingSchedule.save();

    // Send notification to instructor (new or changed)
    try {
      let targetEmail = instructorEmailFinal;
      if (!targetEmail) {
        const Instructor = (await import('../models/Instructor.js')).default;
        const instructorDoc = await Instructor.findOne({
          $or: [
            { email: instructorNameFinal },
            { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: instructorNameFinal, options: 'i' } } }
          ]
        });
        targetEmail = instructorDoc?.email;
      }
      
      if (targetEmail) {
        const notif = await InstructorNotification.create({
          instructorEmail: targetEmail,
          title: 'Schedule Updated',
          message: `Your schedule for ${course} ${year} - ${section} (${subject}) has been updated`,
          link: null
        });
        if (req.io) {
          req.io.emit('instructor-notification', { email: targetEmail, notification: notif });
        }
      }

      // If instructor changed, notify the old instructor too
      if (oldInstructor !== instructorNameFinal && oldInstructorEmail) {
        const oldNotif = await InstructorNotification.create({
          instructorEmail: oldInstructorEmail,
          title: 'Schedule Removed',
          message: `You have been removed from ${course} ${year} - ${section} (${subject})`,
          link: null
        });
        if (req.io) {
          req.io.emit('instructor-notification', { email: oldInstructorEmail, notification: oldNotif });
        }
      }
    } catch (e) {
      console.error('Failed to create instructor notification:', e);
    }

    // Create activity log
    const alert = await Alert.create({
      type: 'schedule-updated',
      message: `Schedule updated for ${course} ${year} - Section ${section} (${subject})`,
      link: `/admin/schedule/${course}/${year}`,
    });
    if (req.io) {
      req.io.emit('new-alert', alert);
    }

    res.json({ success: true, message: "Schedule updated successfully!" });
  } catch (err) {
    console.error("Schedule update error:", err);
    res.status(500).json({ success: false, message: "Server error while updating schedule." });
  }
});

// DELETE schedule
router.delete('/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const scheduleToDelete = await Schedule.findById(scheduleId);
    
    if (!scheduleToDelete) {
      return res.status(404).json({ success: false, message: "Schedule not found." });
    }
    
    // Delete the schedule
    await Schedule.findByIdAndDelete(scheduleId);
    
    const alert = await Alert.create({
      type: 'schedule-deleted',
      message: `Schedule for Section ${scheduleToDelete.section} (${scheduleToDelete.subject}) was deleted.`,
      link: `/admin/schedule/${scheduleToDelete.course || ''}/${scheduleToDelete.year || ''}`,
    });
    if (req.io) {
      req.io.emit('new-alert', alert);
    }
    res.json({ success: true, message: "Schedule deleted successfully." });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ success: false, message: "Server error deleting schedule." });
  }
});

// DEBUG: Admin endpoint to check and fix schedule data
router.get('/debug/instructor-matching', async (req, res) => {
  try {
    const Instructor = (await import('../models/Instructor.js')).default;
    
    // Get all schedules and instructors
    const [allSchedules, allInstructors] = await Promise.all([
      Schedule.find({}).select('instructor instructorEmail course year section subject'),
      Instructor.find({ status: 'active' }).select('firstname lastname email')
    ]);
    
    // Analysis
    const analysis = {
      totalSchedules: allSchedules.length,
      totalInstructors: allInstructors.length,
      schedulesWithEmail: allSchedules.filter(s => s.instructorEmail).length,
      schedulesWithoutEmail: allSchedules.filter(s => !s.instructorEmail).length,
      uniqueInstructorNames: [...new Set(allSchedules.map(s => s.instructor))],
      instructorEmailMapping: {},
      matchingIssues: [],
      fixableSchedules: []
    };
    
    // Create instructor name to email mapping
    allInstructors.forEach(instructor => {
      const fullName = `${instructor.firstname} ${instructor.lastname}`;
      analysis.instructorEmailMapping[fullName] = instructor.email;
    });
    
    // Check for matching issues
    allSchedules.forEach(schedule => {
      const expectedEmail = analysis.instructorEmailMapping[schedule.instructor];
      
      if (!schedule.instructorEmail && expectedEmail) {
        // Schedule missing email but we can fix it
        analysis.fixableSchedules.push({
          scheduleId: schedule._id,
          instructor: schedule.instructor,
          missingEmail: expectedEmail,
          course: `${schedule.course} ${schedule.year} - ${schedule.section}`,
          subject: schedule.subject
        });
      } else if (!expectedEmail) {
        // Instructor name in schedule doesn't match any active instructor
        analysis.matchingIssues.push({
          scheduleInstructor: schedule.instructor,
          issue: 'No matching active instructor found',
          course: `${schedule.course} ${schedule.year} - ${schedule.section}`,
          subject: schedule.subject
        });
      }
    });
    
    res.json(analysis);
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ message: 'Error analyzing schedule data', error: err.message });
  }
});

// ADMIN: Fix missing instructor emails in schedules
router.post('/admin/fix-instructor-emails', async (req, res) => {
  try {
    const Instructor = (await import('../models/Instructor.js')).default;
    
    // Get all schedules missing email data
    const schedulesToFix = await Schedule.find({ 
      $or: [
        { instructorEmail: { $exists: false } },
        { instructorEmail: null },
        { instructorEmail: '' }
      ]
    });
    
    // Get all active instructors
    const activeInstructors = await Instructor.find({ status: 'active' })
      .select('firstname lastname email');
    
    // Create name to email mapping
    const nameToEmailMap = {};
    activeInstructors.forEach(instructor => {
      const fullName = `${instructor.firstname} ${instructor.lastname}`;
      nameToEmailMap[fullName] = instructor.email;
    });
    
    const results = {
      totalSchedulesToCheck: schedulesToFix.length,
      fixed: 0,
      skipped: 0,
      fixedSchedules: []
    };
    
    // Fix schedules
    for (const schedule of schedulesToFix) {
      const expectedEmail = nameToEmailMap[schedule.instructor];
      
      if (expectedEmail) {
        await Schedule.findByIdAndUpdate(schedule._id, {
          instructorEmail: expectedEmail
        });
        
        results.fixed++;
        results.fixedSchedules.push({
          scheduleId: schedule._id,
          instructor: schedule.instructor,
          addedEmail: expectedEmail,
          course: `${schedule.course} ${schedule.year} - ${schedule.section}`
        });
      } else {
        results.skipped++;
      }
    }
    
    res.json({
      success: true,
      message: `Fixed ${results.fixed} schedules, skipped ${results.skipped}`,
      details: results
    });
    
  } catch (err) {
    console.error('Fix endpoint error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fixing schedule data', 
      error: err.message 
    });
  }
});

// ============== SCHEDULE TEMPLATES ==============

// GET all templates for a course/year
router.get('/templates', async (req, res) => {
  try {
    const { course, year } = req.query;
    const query = {};
    if (course) query.course = course;
    if (year) query.year = year;
    
    const templates = await ScheduleTemplate.find(query).sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ success: false, message: 'Error fetching templates' });
  }
});

// GET single template by ID
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await ScheduleTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (err) {
    console.error('Error fetching template:', err);
    res.status(500).json({ success: false, message: 'Error fetching template' });
  }
});

// POST create new template
router.post('/templates', async (req, res) => {
  try {
    const { name, description, course, year, schedules } = req.body;
    
    if (!name || !course || !year || !schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const template = new ScheduleTemplate({
      name,
      description: description || '',
      course,
      year,
      schedules,
      createdBy: 'admin'
    });
    
    await template.save();
    res.json({ success: true, template, message: 'Template saved successfully' });
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).json({ success: false, message: 'Error creating template' });
  }
});

// DELETE template
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await ScheduleTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Error deleting template:', err);
    res.status(500).json({ success: false, message: 'Error deleting template' });
  }
});

// POST apply template to section (creates schedules from template)
router.post('/templates/:id/apply', async (req, res) => {
  try {
    const { section } = req.body;
    const template = await ScheduleTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    if (!section) {
      return res.status(400).json({ success: false, message: 'Section is required' });
    }
    
    const createdSchedules = [];
    const errors = [];
    
    // Create schedules from template
    for (const scheduleData of template.schedules) {
      try {
        const schedule = new Schedule({
          course: template.course,
          year: template.year,
          section,
          subject: scheduleData.subject,
          instructor: scheduleData.instructor,
          instructorEmail: scheduleData.instructorEmail,
          day: scheduleData.day,
          time: scheduleData.time,
          room: scheduleData.room,
        });
        await schedule.save();
        createdSchedules.push(schedule);
      } catch (err) {
        errors.push({ schedule: scheduleData, error: err.message });
      }
    }
    
    res.json({
      success: true,
      message: `Applied template: ${createdSchedules.length} schedules created`,
      created: createdSchedules.length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (err) {
    console.error('Error applying template:', err);
    res.status(500).json({ success: false, message: 'Error applying template' });
  }
});

export default router;
