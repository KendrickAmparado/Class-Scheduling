import express from 'express';
import bcrypt from 'bcryptjs';
import Instructor from '../models/Instructor.js';
import Alert from '../models/Alert.js';
import axios from 'axios';
import { verifyRecaptcha } from '../utils/recaptcha.js';
import validator from 'validator';
import rateLimit from 'express-rate-limit';
import { logActivity, getUserEmailFromRequest } from '../utils/activityLogger.js';
import jwt from 'jsonwebtoken';

// Rate limiter for login attempts. Skip during development to avoid blocking local testing.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please wait.",
  skip: () => process.env.NODE_ENV === 'development'
});

const router = express.Router();

// Instructor Signup - Complete Registration
router.post('/signup', async (req, res) => {
  const { email, firstname, lastname, password, contact, department } = req.body;

  // Log what we received
  console.log('📝 Signup request received:', {
    email,
    firstname,
    lastname,
    contact,
    department,
    hasPassword: !!password
  });

  // Validation
  if (!email || !firstname || !lastname || !password || !contact || !department) {
    console.log('❌ Validation failed - missing fields');
    return res.status(400).json({ 
      message: 'All fields are required' 
    });
  }

  if (password.length < 6) {
    console.log('❌ Password too short');
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters long' 
    });
  }

  try {
    // Find instructor by email
    const instructor = await Instructor.findOne({ email });

    if (!instructor) {
      console.log('❌ No instructor found with email:', email);
      return res.status(404).json({ 
        message: 'No invitation found for this email address. Please contact the administrator.' 
      });
    }

    console.log('✅ Found instructor:', {
      id: instructor._id,
      email: instructor.email,
      currentStatus: instructor.status
    });

    if (instructor.status === 'active') {
      console.log('❌ Account already active');
      return res.status(400).json({ 
        message: 'This account has already been activated. Please login instead.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update instructor with registration details
    instructor.firstname = firstname;
    instructor.lastname = lastname;
    instructor.password = hashedPassword;
    instructor.contact = contact;
    instructor.department = department;
    instructor.status = 'active';
    
    // Generate instructor ID if not exists
    if (!instructor.instructorId) {
      const count = await Instructor.countDocuments({ instructorId: { $exists: true, $ne: null } });
      instructor.instructorId = `BUKSU-INST-${String(count + 1).padStart(4, '0')}`;
    }

    await instructor.save();

    // Log what was saved
    console.log('✅ Instructor saved successfully:', {
      instructorId: instructor.instructorId,
      name: `${instructor.firstname} ${instructor.lastname}`,
      email: instructor.email,
      contact: instructor.contact,
      department: instructor.department,
      status: instructor.status
    });

    // ✅ CREATE ACTIVITY LOG for signup
    await logActivity({
      type: 'instructor-signup',
      message: `${firstname} ${lastname} (${department}) completed registration`,
      source: 'instructor',
      userEmail: email,
      link: '/admin/faculty-management',
      io: req.io
    });

    // Emit real-time notification to admin (optional)
    if (req.io) {
      req.io.emit('instructor-registered', {
        instructorId: instructor.instructorId,
        name: `${instructor.firstname} ${instructor.lastname}`,
        email: instructor.email,
        department: instructor.department,
        contact: instructor.contact,
        timestamp: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: 'Registration completed successfully! You can now login with your credentials.' 
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      message: 'Registration failed. Please try again later.',
      error: error.message 
    });
  }
});

// Instructor Login
router.post('/login', loginLimiter, async (req, res) => {
  let { email, password, recaptchaToken } = req.body;
  // Validate input
  email = typeof email === 'string' ? email.trim().toLowerCase() : '';
  password = typeof password === 'string' ? password : '';
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  // Check reCAPTCHA
  if (!recaptchaToken) {
    return res.status(400).json({ message: 'Please complete the reCAPTCHA' });
  }
  try {
    const vr = await verifyRecaptcha(recaptchaToken);
    if (vr.skipped) {
      console.warn('⚠️ reCAPTCHA verification skipped (no secret configured)');
    } else if (!vr.success) {
      console.error('❌ reCAPTCHA verification failed for login:', vr);
      return res.status(400).json({ message: 'reCAPTCHA verification failed', details: vr.errorCodes || vr });
    }
  } catch (err) {
    console.error('Error during reCAPTCHA validation:', err);
    return res.status(500).json({ message: 'Error during reCAPTCHA validation' });
  }

  console.log('🔐 Login attempt for:', email);

  try {
    // Find instructor by email
    const instructor = await Instructor.findOne({ email });

    if (!instructor) {
      console.log('❌ No instructor found with email:', email);
      return res.status(404).json({ 
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Found instructor:', {
      id: instructor._id,
      instructorId: instructor.instructorId,
      email: instructor.email,
      status: instructor.status,
      hasPassword: !!instructor.password,
      hasContact: !!instructor.contact,
      hasDepartment: !!instructor.department
    });

    if (instructor.status !== 'active') {
      console.log('❌ Account not active, status:', instructor.status);
      return res.status(403).json({ 
        message: 'Your account is not active. Please complete registration or contact administrator.' 
      });
    }

    if (!instructor.password) {
      console.log('❌ No password set');
      return res.status(400).json({ 
        message: 'Please complete your registration first.' 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, instructor.password);

    if (!isMatch) {
      console.log('❌ Password mismatch');
      // Log failed login attempt
      await logActivity({
        type: 'instructor-login-failed',
        message: `Failed login attempt for ${email}`,
        source: 'instructor',
        userEmail: email,
        io: req.io
      });
      
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Login successful for:', instructor.email);

    // ✅ CREATE ACTIVITY LOG for login
    await logActivity({
      type: 'instructor-login',
      message: `${instructor.firstname} ${instructor.lastname} (${instructor.department}) logged in`,
      source: 'instructor',
      userEmail: instructor.email,
      link: '/instructor/dashboard',
      io: req.io
    });
  
    // Issue JWT token for the instructor
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables!');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const token = jwt.sign({ id: instructor._id, email: instructor.email }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Return instructor data (without password) and token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      instructor: {
        id: instructor._id,
        instructorId: instructor.instructorId,
        firstname: instructor.firstname,
        lastname: instructor.lastname,
        email: instructor.email,
        contact: instructor.contact,
        department: instructor.department,
        status: instructor.status
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Login failed. Please try again later.',
      error: error.message 
    });
  }
});

// Check if email has pending invitation (optional - for validation)
router.get('/check-email/:email', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ email: req.params.email });
    
    if (!instructor) {
      return res.json({ exists: false, status: null });
    }

    res.json({ 
      exists: true, 
      status: instructor.status,
      hasPassword: !!instructor.password,
      department: instructor.department || null,
      contact: instructor.contact || null
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      message: 'Error checking email',
      error: error.message 
    });
  }
});

// Instructor Logout
router.post('/logout', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find instructor to get their details
    const instructor = await Instructor.findOne({ email });
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // ✅ LOG LOGOUT ACTIVITY
    await logActivity({
      type: 'instructor-logout',
      message: `${instructor.firstname} ${instructor.lastname} (${instructor.department}) logged out`,
      source: 'instructor',
      userEmail: email,
      link: '/instructor/login',
      io: req.io
    });

    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed. Please try again later.',
      error: error.message 
    });
  }
});

export default router;
