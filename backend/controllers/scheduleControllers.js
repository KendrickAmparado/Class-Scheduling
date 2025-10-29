// backend/controllers/scheduleController.js
const Schedule = require("../models/Schedule");
// After performing action
req.io.emit('new-notification', notificationObject);


exports.createSchedule = async (req, res) => {
  try {
    const { course, yearLevel, section, subject, instructorName } = req.body;

    if (!course || !yearLevel || !section || !subject || !instructorName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newSchedule = new Schedule({ course, yearLevel, section, subject, instructorName });
    await newSchedule.save();

    res.status(201).json({ success: true, message: "Schedule created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
