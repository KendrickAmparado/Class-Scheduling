import express from "express";
import Schedule from "../models/Schedule.js";
import InstructorNotification from "../models/InstructorNotification.js";
import Alert from '../models/Alert.js';

const router = express.Router();

// CREATE schedule
router.post("/create", async (req, res) => {
  try {
    const { course, year, section, subject, instructor, day, time, room } = req.body;

    if (!course || !year || !section || !subject || !instructor || !day || !time || !room) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const newSchedule = new Schedule({
      course,
      year,
      section,
      subject,
      instructor,
      day,
      time,
      room
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
    
    if (!instructor) {
      console.log('❌ Backend: Instructor not found in database');
      return res.status(404).json({ 
        message: 'Instructor profile not found',
        debug: { searchEmail: instructorEmail }
      });
    }
    
    const instructorName = `${instructor.firstname} ${instructor.lastname}`;
    console.log('🔍 Backend: Instructor full name:', instructorName);
    console.log('🔍 Backend: Instructor status:', instructor.status);
    
    // Step 2: Search strategies with detailed logging
    let schedules = [];
    let searchMethod = '';
    
    // Strategy 1: Search by exact email match
    schedules = await Schedule.find({ instructorEmail: instructorEmail });
    console.log('🔍 Backend: Strategy 1 (exact email):', schedules.length, 'schedules');
    
    if (schedules.length > 0) {
      searchMethod = 'exact-email';
    } else {
      // Strategy 2: Search by instructor name (exact match)
      schedules = await Schedule.find({ instructor: instructorName });
      console.log('🔍 Backend: Strategy 2 (exact name):', schedules.length, 'schedules');
      
      if (schedules.length > 0) {
        searchMethod = 'exact-name';
      } else {
        // Strategy 3: Search by partial name matches (case insensitive)
        schedules = await Schedule.find({ 
          instructor: { $regex: new RegExp(instructorName, 'i') }
        });
        console.log('🔍 Backend: Strategy 3 (partial name):', schedules.length, 'schedules');
        
        if (schedules.length > 0) {
          searchMethod = 'partial-name';
        } else {
          // Strategy 4: Search by individual name parts
          const firstnameRegex = new RegExp(instructor.firstname, 'i');
          const lastnameRegex = new RegExp(instructor.lastname, 'i');
          
          schedules = await Schedule.find({ 
            $and: [
              { instructor: firstnameRegex },
              { instructor: lastnameRegex }
            ]
          });
          console.log('🔍 Backend: Strategy 4 (name parts):', schedules.length, 'schedules');
          
          if (schedules.length > 0) {
            searchMethod = 'name-parts';
          }
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
          instructorFound: true,
          instructorName: instructorName,
          instructorStatus: instructor.status,
          searchStrategiesUsed: ['exact-email', 'exact-name', 'partial-name', 'name-parts'],
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

// DELETE schedule
router.delete('/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const deleted = await Schedule.findByIdAndDelete(scheduleId);
    if (deleted) {
      const alert = await Alert.create({
        type: 'schedule-deleted',
        message: `Schedule for Section ${deleted.section} (${deleted.subject}) was deleted.`,
        link: `/admin/schedule/${deleted.course || ''}/${deleted.year || ''}`,
      });
      if (req.io) {
        req.io.emit('new-alert', alert);
      }
      res.json({ success: true, message: "Schedule deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Schedule not found." });
    }
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

export default router;
