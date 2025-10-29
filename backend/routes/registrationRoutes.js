import express from 'express';
import nodemailer from 'nodemailer';
import Instructor from '../models/Instructor.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/send-registration', async (req, res) => {
  const { email, department } = req.body;

  console.log('📧 Registration request received:', { email, department });

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!department) {
    return res.status(400).json({ error: 'Department is required' });
  }

  // ✅ Check EMAIL_USER and EMAIL_PASS
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not configured in .env');
    return res.status(500).json({ 
      error: 'Email service not configured. Please contact administrator.' 
    });
  }

  try {
    // Check if instructor already exists
    let existingInstructor = await Instructor.findOne({ email });
    
    if (existingInstructor && existingInstructor.status === 'active') {
      return res.status(400).json({ 
        error: 'An instructor with this email is already registered and active.' 
      });
    }

    // Create or update instructor
    if (!existingInstructor) {
      const newInstructor = new Instructor({
        email,
        department,
        status: 'pending',
      });
      await newInstructor.save();
      console.log('✅ New instructor created:', { email, department });
    } else {
      existingInstructor.department = department;
      existingInstructor.status = 'pending';
      await existingInstructor.save();
      console.log('✅ Existing instructor updated:', { email, department });
    }

    // Configure email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Registration link with email AND department
    const registrationLink = `http://localhost:3000/instructor/signup?email=${encodeURIComponent(email)}&department=${encodeURIComponent(department)}`;
    
    console.log('🔗 Registration link:', registrationLink);
    
    const mailOptions = {
      from: `"Class Scheduling System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Complete Your Instructor Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #0f2c63 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Class Scheduling System</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome to ${department}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              You have been invited to join the <strong>Class Scheduling System</strong> at Bukidnon State University as an instructor in the <strong>${department}</strong> department.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Click the button below to complete your registration:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationLink}" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0f2c63 0%, #1e40af 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Complete Registration
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Or copy this link: <br/>
              <span style="color: #3b82f6; word-break: break-all;">${registrationLink}</span>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', email);

    res.json({ 
      success: true, 
      message: 'Registration email sent successfully.',
      instructor: { email, department, status: 'pending' }
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    
    // Send specific error message
    if (err.code === 'EAUTH') {
      return res.status(500).json({ 
        error: 'Email authentication failed. Please check EMAIL_USER and EMAIL_PASS in .env file.' 
      });
    }
    
    if (err.code === 'ECONNECTION') {
      return res.status(500).json({ 
        error: 'Cannot connect to email server. Please check your internet connection.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to send registration email.',
      details: err.message 
    });
  }
});

export default router;
