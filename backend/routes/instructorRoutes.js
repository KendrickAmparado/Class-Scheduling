import express from "express";
import Instructor from "../models/Instructor.js";
import Counter from "../models/Counter.js"; // Import counter model

const router = express.Router();

/**
 * GET all instructors
 */
router.get("/", async (req, res) => {
  try {
    const instructors = await Instructor.find();
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Helper to get next sequence number for auto-increment instructorId
 */
async function getNextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * ADD new instructor with auto-increment instructorId
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, contact, department } = req.body;

    // Check for duplicate email
    const exists = await Instructor.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Get next unique instructorId
    const instructorId = await getNextSequence("instructorId");

    // Create new record
    const newInstructor = new Instructor({
      instructorId,
      name,
      email,
      contact,
      department,
      status: "active",
    });

    await newInstructor.save();
    res.json(newInstructor);
  } catch (err) {
    console.error("Error adding instructor:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * EDIT email and contact for instructor by ID
 */
router.put("/:id", async (req, res) => {
  try {
    const { email, contact } = req.body;
    const updated = await Instructor.findByIdAndUpdate(
      req.params.id,
      { email, contact },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ARCHIVE instructor (moves to archived status)
 */
router.put("/:id/archive", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "archived", archivedDate: new Date() },
      { new: true }
    );
    if (!instructor)
      return res.status(404).json({ error: "Instructor not found" });
    res.json({ success: true, message: "Instructor archived", instructor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * RESTORE instructor (moves from archived to active)
 */
router.put("/:id/restore", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "active", archivedDate: null },
      { new: true }
    );
    if (!instructor)
      return res.status(404).json({ error: "Instructor not found" });
    res.json({ success: true, message: "Instructor restored", instructor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * MOVE to trash (soft delete, sets status = deleted)
 */
router.delete("/:id", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "deleted", deletedDate: new Date() },
      { new: true }
    );
    if (!instructor)
      return res.status(404).json({ error: "Instructor not found" });
    res.json({ success: true, message: "Instructor moved to trash", instructor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PERMANENT DELETE instructor (removes from DB)
 */
router.delete("/:id/permanent", async (req, res) => {
  try {
    await Instructor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Instructor permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
