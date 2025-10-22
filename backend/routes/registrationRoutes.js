import express from 'express';
import nodemailer from 'nodemailer';
import Instructor from '../models/Instructor.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/send-registration', async (req, res) => {
  const { name, email, contact, department } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const newInstructor = new Instructor({
      name,
      email,
      contact,
      department,
      status: 'invited',
    });
    await newInstructor.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    const registrationLink = `https://yourdomain.com/instructor/signup?email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: `"Class Scheduling System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Complete Your Instructor Registration',
      html: `
        <p>Hello ${name},</p>
        <p>Please complete your registration by clicking the link below:</p>
        <a href="${registrationLink}">Register Here</a>
        <p>If you did not request this, please ignore this message.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Registration email sent successfully.' });
  } catch (err) {
    console.error('Registration email send error:', err);
    res.status(500).json({ error: 'Failed to send registration email.' });
  }
});

export default router;
