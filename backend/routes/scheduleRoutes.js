import express from "express";
import Schedule from "../models/Schedule.js";

const router = express.Router();

// CREATE schedule
router.post("/create", async (req, res) => {
  try {
    const { course, year, section, subject, instructor, day, time, room } = req.body;

    // Validation
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
    res.json({ success: true, message: "Schedule created successfully!" });
  } catch (err) {
    console.error("Schedule creation error:", err);
    res.status(500).json({ success: false, message: "Server error while saving schedule." });
  }
});


// GET /api/schedule - get schedules filtered by course and year
router.get('/', async (req, res) => {
  try {
    const { course, year } = req.query;
    console.log(`GET /api/schedule called with course=${course}, year=${year}`);

    const schedules = await Schedule.find({ course, year });
    console.log(`Schedules found: ${schedules.length}`);

    res.json(schedules);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const deleted = await Schedule.findByIdAndDelete(scheduleId);
    if (deleted) {
      res.json({ success: true, message: "Schedule deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Schedule not found." });
    }
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ success: false, message: "Server error deleting schedule." });
  }
});


export default router;
