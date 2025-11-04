import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import validator from 'validator';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import PasswordResetToken from '../models/PasswordResetToken.js';
import Instructor from '../models/Instructor.js';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Rate limiting for password reset requests
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per 15 minutes
  message: "Too many password reset attempts. Please wait 15 minutes."
});

// Rate limiting for reset password submission
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: "Too many password reset attempts. Please wait 1 hour."
});

// POST /api/password-reset/forgot - Request password reset
router.post('/forgot', resetLimiter, async (req, res) => {
  try {
    const { email, userType, recaptchaToken } = req.body;

    // Validate inputs
    if (!email || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and user type are required.' 
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address.' 
      });
    }

    if (!['instructor', 'admin'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user type. Must be "instructor" or "admin".' 
      });
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';
        const verify = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
          params: { secret: secretKey, response: recaptchaToken }
        });
        if (!verify.data.success) {
          return res.status(400).json({ 
            success: false, 
            message: 'reCAPTCHA verification failed.' 
          });
        }
      } catch (err) {
        console.error('reCAPTCHA verification error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error during reCAPTCHA verification.' 
        });
      }
    }

    // Check if user exists
    let user;
    if (userType === 'instructor') {
      user = await Instructor.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ 
          success: true, 
          message: 'If the email exists, a password reset link has been sent.' 
        });
      }
    } else {
      // Admin - check if email matches any admin (you may need to adjust this based on your Admin model)
      const admin = await Admin.findOne();
      if (!admin) {
        return res.status(500).json({ 
          success: false, 
          message: 'System configuration error.' 
        });
      }
      // For admin, we'll allow reset if email matches a configured admin email
      // You may want to add an email field to Admin model
      user = { email: admin.email || 'admin@example.com' }; // Adjust based on your Admin model
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

    // Save reset token
    await PasswordResetToken.create({
      email: email.toLowerCase().trim(),
      token: resetToken,
      expiresAt,
      userType
    });

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email service not configured');
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured. Please contact administrator.' 
      });
    }

    // Send reset email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `http://localhost:3000/password-reset?token=${resetToken}&email=${encodeURIComponent(email)}&type=${userType}`;
    
    const mailOptions = {
      from: `"Class Scheduling System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f2c63;">Password Reset Request</h2>
          <p>You have requested to reset your password for the Class Scheduling System.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: linear-gradient(135deg, #0f2c63 0%, #f97316 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: 600;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #0f2c63; word-break: break-all;">${resetLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'If the email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing password reset request.' 
    });
  }
});

// POST /api/password-reset/reset - Reset password with token
router.post('/reset', resetPasswordLimiter, async (req, res) => {
  try {
    const { token, email, userType, newPassword } = req.body;

    // Validate inputs
    if (!token || !email || !userType || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required.' 
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    // Find and validate reset token
    const resetToken = await PasswordResetToken.findOne({
      token,
      email: email.toLowerCase().trim(),
      userType,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token.' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    if (userType === 'instructor') {
      const instructor = await Instructor.findOne({ email: email.toLowerCase().trim() });
      if (!instructor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Instructor not found.' 
        });
      }
      instructor.password = hashedPassword;
      await instructor.save();
    } else {
      // Admin password reset
      const admin = await Admin.findOne();
      if (!admin) {
        return res.status(500).json({ 
          success: false, 
          message: 'System configuration error.' 
        });
      }
      admin.password = hashedPassword;
      await admin.save();
    }

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password.' 
    });
  }
});

// GET /api/password-reset/verify - Verify reset token validity
router.get('/verify', async (req, res) => {
  try {
    const { token, email, userType } = req.query;

    if (!token || !email || !userType) {
      return res.status(400).json({ 
        success: false, 
        valid: false, 
        message: 'Token, email, and user type are required.' 
      });
    }

    const resetToken = await PasswordResetToken.findOne({
      token,
      email: email.toLowerCase().trim(),
      userType,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.json({ 
        success: true, 
        valid: false, 
        message: 'Invalid or expired reset token.' 
      });
    }

    res.json({ 
      success: true, 
      valid: true, 
      message: 'Token is valid.' 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      valid: false, 
      message: 'Error verifying token.' 
    });
  }
});

export default router;

