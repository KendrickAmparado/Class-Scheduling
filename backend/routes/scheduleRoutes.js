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

export default router;
