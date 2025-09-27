const express = require('express');
const router = express.Router();
const Instructor = require('../models/Instructor');
const bcrypt = require('bcrypt');

// POST /api/instructors/signup
router.post('/signup', async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check if email already exists
    const existingInstructor = await Instructor.findOne({ email });
    if (existingInstructor) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new instructor
    const newInstructor = new Instructor({
      firstname,
      lastname,
      email,
      password: hashedPassword
    });

    await newInstructor.save();
    res.status(201).json({ message: 'Instructor registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
