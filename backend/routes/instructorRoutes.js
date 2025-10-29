import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Instructor from "../models/Instructor.js";
import Counter from "../models/Counter.js";
import Alert from "../models/Alert.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
// Multer storage for profile images
const uploadsRoot = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsRoot);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const safeEmail = (req.userEmail || "user").replace(/[^a-zA-Z0-9-_\.]/g, "_");
    cb(null, `${safeEmail}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Only image files are allowed"));
  },
});

// SELF: Get current instructor profile (by JWT email)
router.get("/profile/me", verifyToken, async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ email: req.userEmail })
      .select("instructorId firstname lastname email contact department image status");
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
});

// SELF: Update current instructor profile (no password here)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { firstname, lastname, contact, department } = req.body;
    const updated = await Instructor.findOneAndUpdate(
      { email: req.userEmail },
      { $set: { firstname, lastname, contact, department } },
      { new: true }
    ).select("instructorId firstname lastname email contact department image status");
    if (!updated) return res.status(404).json({ message: "Instructor not found" });
    res.json({ success: true, instructor: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating profile", error: err.message });
  }
});

// SELF: Upload/replace profile image
router.post("/profile/image", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    const relativePath = `/uploads/profiles/${req.file.filename}`;
    const updated = await Instructor.findOneAndUpdate(
      { email: req.userEmail },
      { $set: { image: relativePath } },
      { new: true }
    ).select("instructorId firstname lastname email contact department image status");
    if (!updated) return res.status(404).json({ success: false, message: "Instructor not found" });
    res.json({ success: true, instructor: updated, image: relativePath });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error uploading image", error: err.message });
  }
});

const registeredStatuses = ["active", "archived"];

// Increment and get next sequence value
async function getNextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// GET all instructors
router.get("/", async (req, res) => {
  try {
    const instructors = await Instructor.find({})
      .select("instructorId firstname lastname email contact department status")
      .sort({ status: 1, lastname: 1, firstname: 1 });

    // Automatically assign instructorIDs to any instructors missing them
    const instructorsNeedingIds = instructors.filter(inst => 
      !inst.instructorId || inst.instructorId.trim() === ""
    );

    if (instructorsNeedingIds.length > 0) {
      for (const instructor of instructorsNeedingIds) {
        instructor.instructorId = await getNextSequence("instructorId");
        await instructor.save();
      }
      
      // Refetch instructors after assigning IDs
      const updatedInstructors = await Instructor.find({})
        .select("instructorId firstname lastname email contact department status")
        .sort({ status: 1, lastname: 1, firstname: 1 });
      
      return res.json(updatedInstructors);
    }

    res.json(instructors);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching instructors",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET instructor profile by email
router.get("/profile/by-email/:email", async (req, res) => {
  try {
    const emailParam = req.params.email;
    const instructor = await Instructor.findOne({ email: { $regex: new RegExp(`^${emailParam}$`, 'i') } })
      .select("instructorId firstname lastname email contact department image status");
    
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    
    res.json(instructor);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching instructor profile",
      error: error.message,
    });
  }
});

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { firstname, lastname, email, contact, department, password } = req.body;
    if (!firstname || !lastname || !email || !contact || !department || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check existing instructor with email
    const existingInstructor = await Instructor.findOne({ email });

    if (existingInstructor) {
      if (registeredStatuses.includes(existingInstructor.status)) {
        // Already active or archived, disallow signup
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingInstructor.status === "pending") {
        // Pending instructor found, update details and activate
        // Ensure they have an instructorID
        if (!existingInstructor.instructorId || existingInstructor.instructorId.trim() === "") {
          existingInstructor.instructorId = await getNextSequence("instructorId");
        }
        existingInstructor.firstname = firstname;
        existingInstructor.lastname = lastname;
        existingInstructor.contact = contact;
        existingInstructor.department = department;
        existingInstructor.password = await bcrypt.hash(password, 10);
        existingInstructor.status = "active";
        existingInstructor.dateJoined = new Date();
        await existingInstructor.save();

        return res.status(200).json({
          success: true,
          instructor: existingInstructor,
        });
      }
      return res.status(400).json({ message: "Invalid instructor status." });
    }

    // Create new instructor with status 'pending'
    const instructorId = await getNextSequence("instructorId");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newInstructor = new Instructor({
      instructorId,
      firstname,
      lastname,
      email,
      contact,
      department,
      password: hashedPassword,
      status: "pending",  // <-- set to pending on first signup
      dateJoined: new Date(),
    });

    await newInstructor.save();

    res.status(201).json({
      success: true,
      instructor: newInstructor,
      message: "Account created but pending activation. Please wait for approval.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Send registration link for pending instructor
router.post("/registration/send-registration", async (req, res) => {
  try {
    const { email, department } = req.body;
    if (!email || !department) {
      return res.status(400).json({ message: "Email and department are required" });
    }

    const existing = await Instructor.findOne({ email });
    if (existing) {
      if (["active", "archived"].includes(existing.status)) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existing.status === "pending") {
        return res.status(200).json({ message: "Registration link already sent to this email" });
      }
    }

    let instructorId = existing ? existing.instructorId : await getNextSequence("instructorId");

    const instructor = await Instructor.findOneAndUpdate(
      { email },
      {
        instructorId,
        email,
        department,
        status: "pending",
        dateJoined: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ 
      message: "Registration link sent successfully",
      instructorId: instructor.instructorId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login route (JWT)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const instructor = await Instructor.findOne({ email });
    if (!instructor) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!instructor.password) {
      return res.status(400).json({ message: "Please complete your registration first before login." });
    }

    const isMatch = await bcrypt.compare(password, instructor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables!");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const token = jwt.sign({ email: instructor.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      token,
      instructor: {
        firstname: instructor.firstname,
        lastname: instructor.lastname,
        email: instructor.email,
      },
    });
  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// Complete registration
router.post("/complete-registration", async (req, res) => {
  try {
    const { email, firstname, lastname, contact, department, password } = req.body;
    if (!email || !firstname || !lastname || !contact || !department || !password) {
      return res.status(400).json({ message: "All registration fields are required." });
    }

    // Find instructor by email who is currently pending
    const instructor = await Instructor.findOne({ email: email.trim().toLowerCase(), status: 'pending' });

    if (!instructor) {
      return res.status(404).json({ message: "No pending registration found for this email." });
    }

    // Update instructor's details and mark as active
    // Ensure they have an instructorID
    if (!instructor.instructorId || instructor.instructorId.trim() === "") {
      instructor.instructorId = await getNextSequence("instructorId");
    }
    instructor.firstname = firstname;
    instructor.lastname = lastname;
    instructor.contact = contact;
    instructor.department = department;
    instructor.password = await bcrypt.hash(password, 10);
    instructor.status = "active";  // Automatically activate here
    await instructor.save();

    // Optional: Notify via alert system that instructor completed registration
    const alert = await Alert.create({
      type: "availability-update",
      message: `Instructor ${firstname} ${lastname} completed registration.`,
      link: "/admin/faculty-management",
      createdAt: new Date(),
    });

    req.io?.emit("new-alert", alert);

    res.json({
      success: true,
      message: "Registration completed successfully and account activated.",
      instructor: {
        id: instructor._id,
        firstname: instructor.firstname,
        lastname: instructor.lastname,
        email: instructor.email,
        contact: instructor.contact,
        department: instructor.department,
        status: instructor.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error during registration completion." });
  }
});


// Update instructor
router.put("/:id", async (req, res) => {
  try {
    const { email, contact } = req.body;
    const existing = await Instructor.findOne({
      email,
      status: { $in: registeredStatuses },
      _id: { $ne: req.params.id },
    });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const updated = await Instructor.findByIdAndUpdate(
      req.params.id,
      { email, contact },
      { new: true }
    );
    const alert = await Alert.create({
      type: "availability-update",
      message: `Instructor ${updated.firstname} ${updated.lastname} details updated.`,
      link: "/admin/faculty-management",
    });
    req.io?.emit("new-alert", alert);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive instructor
router.put("/:id/archive", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "archived", archivedDate: new Date() },
      { new: true }
    );
    if (!instructor) {
      return res.status(404).json({ success: false, error: "Instructor not found" });
    }
    const instructorName = `${instructor.firstname} ${instructor.lastname}`;
    const alert = await Alert.create({
      type: "availability-update",
      message: `Instructor ${instructorName} archived.`,
      link: "/admin/faculty-management",
    });
    req.io?.emit("new-alert", alert);
    res.json({ success: true, message: "Instructor archived", instructor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore instructor
router.put("/:id/restore", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "active", archivedDate: null },
      { new: true }
    );
    if (!instructor) {
      return res.status(404).json({ success: false, error: "Instructor not found" });
    }
    const instructorName = `${instructor.firstname} ${instructor.lastname}`;
    const alert = await Alert.create({
      type: "availability-update",
      message: `Instructor ${instructorName} restored.`,
      link: "/admin/faculty-management",
    });
    req.io?.emit("new-alert", alert);
    res.json({ success: true, message: "Instructor restored", instructor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Move to archive (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { status: "archived", archivedDate: new Date() },
      { new: true }
    );
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    const instructorName = `${instructor.firstname} ${instructor.lastname}`;
    const alert = await Alert.create({
      type: "availability-update",
      message: `Instructor ${instructorName} moved to archive.`,
      link: "/admin/faculty-management",
    });
    req.io?.emit("new-alert", alert);
    res.json({ success: true, message: "Instructor moved to archive", instructor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently delete instructor
router.delete("/:id/permanent", async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndDelete(req.params.id);
    if (!instructor) {
      return res.status(404).json({ success: false, error: "Instructor not found" });
    }
    const instructorName = `${instructor.firstname} ${instructor.lastname}`;
    const alert = await Alert.create({
      type: "availability-update",
      message: `Instructor ${instructorName} permanently deleted.`,
      link: "/admin/faculty-management",
    });
    req.io?.emit("new-alert", alert);
    res.json({ success: true, message: "Instructor permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/activate', async (req, res) => {
  const { email, firstname, lastname, contact, department, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find instructor by email only if status is pending
    const instructor = await Instructor.findOne({ email, status: 'pending' });

    if (!instructor) {
      return res.status(404).json({ error: 'Pending instructor not found or already activated.' });
    }

    // Update instructor details and set status active
    if (firstname) instructor.firstname = firstname;
    if (lastname) instructor.lastname = lastname;
    if (contact) instructor.contact = contact;
    if (department) instructor.department = department;
    if (password) {
      const bcrypt = await import('bcryptjs'); // dynamic import if needed
      instructor.password = await bcrypt.hash(password, 10);
    }
    instructor.status = 'active';

    await instructor.save();

    res.json({ success: true, message: 'Instructor account activated successfully.', instructor });
  } catch (err) {
    console.error('Error activating instructor:', err);
    res.status(500).json({ error: 'Failed to activate instructor account.' });
  }
});


export default router;
