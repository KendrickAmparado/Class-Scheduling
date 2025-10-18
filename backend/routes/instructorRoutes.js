import express from "express";
import Instructor from "../models/Instructor.js";
import Counter from "../models/Counter.js"; // Import counter model

const router = express.Router();

// GET all instructors
router.get("/", async (req, res) => {
  try {
    const instructors = await Instructor.find();
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to get next sequence number for auto-increment instructorId
async function getNextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// ADD new instructor with auto-increment instructorId
router.post("/", async (req, res) => {
  try {
    const { name, email, contact, department } = req.body;

    // Check if email already exists
    const exists = await Instructor.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Get next unique instructorId
    const instructorId = await getNextSequence("instructorId");

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

// EDIT email and contact for instructor by id
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

// APPROVE instructor
router.put("/:id/approve", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT instructor
router.put("/:id/reject", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "deleted" },
      { new: true }
    );
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MOVE to trash
router.delete("/:id", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "deleted" },
      { new: true }
    );
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PERMANENT DELETE
router.delete("/:id/permanent", async (req, res) => {
  try {
    await Instructor.findByIdAndDelete(req.params.id);
    res.json({ message: "Instructor permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
