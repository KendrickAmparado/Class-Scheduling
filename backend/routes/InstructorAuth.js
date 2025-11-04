import express from 'express';
import bcrypt from 'bcryptjs';
import Instructor from '../models/Instructor.js';
import Alert from '../models/Alert.js'; // Add this line
import axios from 'axios';
import validator from 'validator';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please wait."
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
    try {
        const alert = new Alert({
          type: 'availability-update',
          message: `${firstname} ${lastname} (${department}) completed registration`,
          timestamp: new Date(),
          read: false
        });
        await alert.save();
        console.log('✅ Activity log created for instructor registration');
      } catch (alertError) {
        console.error('❌ Failed to create activity log:', alertError);
      }

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
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';
    const verify = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: { secret: secretKey, response: recaptchaToken },
    });
    if (!verify.data.success) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }
  } catch (err) {
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
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Login successful for:', instructor.email);

    // ✅ CREATE ACTIVITY LOG for login
    try {
    const alert = new Alert({
      type: 'availability-update',
      message: `${instructor.firstname} ${instructor.lastname} (${instructor.department}) logged in`,
      timestamp: new Date(),
      read: false
    });
    await alert.save();
    console.log('✅ Activity log created for instructor login');
  } catch (alertError) {
    console.error('❌ Failed to create login activity log:', alertError);
  }
  

    // Return instructor data (without password)
    res.json({
      success: true,
      message: 'Login successful',
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

export default router;
