import express from "express";
import Admin from "../models/Admin.js";

const router = express.Router();

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
