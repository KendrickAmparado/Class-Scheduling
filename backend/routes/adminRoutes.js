import express from "express";
import Admin from "../models/Admin.js";
import Room from '../models/Room.js';

const router = express.Router();

// GET /api/rooms - get all rooms with status
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json({ rooms });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ success: false, message: "No admin found in the database." });
    }

    console.log("Password received:", password);
    console.log("Password in DB:", admin.password);

    if (password.trim() === admin.password.trim()) {
      return res.json({ success: true, message: "Login successful!" });
    } else {
      return res.status(401).json({ success: false, message: "Wrong password." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;
