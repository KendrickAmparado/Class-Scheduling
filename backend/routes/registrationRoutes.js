import express from 'express';
import nodemailer from 'nodemailer';
import Instructor from '../models/Instructor.js';
import Schedule from '../models/Schedule.js';
import dotenv from 'dotenv';
import rateLimit from "express-rate-limit";
import validator from 'validator';
import axios from 'axios';

dotenv.config();

const router = express.Router();

// Rate limiting: max 10 emails per 10 minutes per client
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts. Please wait a bit."
});

router.post('/send-registration', registerLimiter, async (req, res) => {
  let { email, department, recaptchaToken } = req.body;

  // Normalize emails
  let emails = Array.isArray(email) ? email : [email];
  emails = emails.map(e => (typeof e === 'string' ? e.trim().toLowerCase() : ''));
  department = typeof department === 'string' ? department.trim() : '';
  // Validate department
  if (!department || validator.isEmpty(department)) {
    return res.status(400).json({ error: 'Department is required' });
  }
  // Validate emails
  for (let e of emails) {
    if (!e || !validator.isEmail(e)) {
      return res.status(400).json({ error: `Invalid email: ${e}` });
    }
  }
  // Verify reCAPTCHA if provided
  if (recaptchaToken) {
    try {
      // Place your secret key here (not the site key)
      const secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';
      const verify = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
        params: { secret: secretKey, response: recaptchaToken },
      });
      if (!verify.data.success) {
        return res.status(400).json({ error: 'reCAPTCHA verification failed.' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Error during reCAPTCHA check.' });
    }
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ error: 'Email service not configured. Please contact administrator.' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify email connection' });
  }

  let results = [];
  for (let emailAddr of emails) {
    try {
      let existingInstructor = await Instructor.findOne({ email: emailAddr });
      if (existingInstructor && existingInstructor.status === 'active') {
        results.push({ email: emailAddr, status: 'failed', error: 'Already registered and active.' });
        continue;
      }
      if (!existingInstructor) {
        const newInstructor = new Instructor({ email: emailAddr, department, status: 'pending' });
        await newInstructor.save();
      } else {
        existingInstructor.department = department;
        existingInstructor.status = 'pending';
        await existingInstructor.save();
      }
      const registrationLink = `http://localhost:3000/instructor/signup?email=${encodeURIComponent(emailAddr)}&department=${encodeURIComponent(department)}`;
      const mailOptions = {
        from: `"Class Scheduling System" <${process.env.EMAIL_USER}>`,
        to: emailAddr,
        subject: 'Complete Your Instructor Registration',
        html: `Registration link: <a href="${registrationLink}">${registrationLink}</a>`
      };
      await transporter.sendMail(mailOptions);

      // Check if this instructor has any schedule
      let hasSchedule = false;
      try {
        // Try with the explicit instructorEmail field (most accurate)
        const scheduleCount = await Schedule.countDocuments({ instructorEmail: emailAddr });
        if (scheduleCount > 0) {
          hasSchedule = true;
        } else if (existingInstructor && existingInstructor.firstname && existingInstructor.lastname) {
          // Fallback: try by instructor full name if modeled
          const instructorName = `${existingInstructor.firstname} ${existingInstructor.lastname}`;
          const scheduleCountByName = await Schedule.countDocuments({ instructor: instructorName });
          if (scheduleCountByName > 0) hasSchedule = true;
        }
      } catch (err) {}
      results.push({ email: emailAddr, status: 'success', hasSchedule });
    } catch (err) {
      results.push({ email: emailAddr, status: 'failed', error: err.message });
    }
  }
  res.json({ results, total: results.length });
});

export default router;
