import { z } from 'zod';

/**
 * Common validation schemas using Zod
 * Reusable across the application
 */

// Time format validation (e.g., "8:00 AM", "1:30 PM")
const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export const timeSchema = z.string().regex(timeRegex, {
  message: 'Time must be in format: HH:MM AM/PM (e.g., 8:00 AM)',
});

// Email validation
export const emailSchema = z.string().email({
  message: 'Please enter a valid email address',
}).min(1, {
  message: 'Email is required',
});

// Password validation
export const passwordSchema = z.string()
  .min(8, {
    message: 'Password must be at least 8 characters',
  })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, {
    message: 'Password must contain at least one number',
  });

// Schedule validation schema
export const scheduleSchema = z.object({
  subject: z.string().min(1, {
    message: 'Subject is required',
  }).max(100, {
    message: 'Subject must be less than 100 characters',
  }),
  day: z.string().min(1, {
    message: 'Day is required',
  }),
  startTime: timeSchema,
  endTime: timeSchema,
  instructor: z.string().min(1, {
    message: 'Instructor is required',
  }),
  room: z.string().min(1, {
    message: 'Room is required',
  }),
  course: z.string().min(1, {
    message: 'Course is required',
  }),
  year: z.string().min(1, {
    message: 'Year is required',
  }),
  section: z.string().min(1, {
    message: 'Section is required',
  }),
}).refine((data) => {
  // Validate that end time is after start time
  const parseTime = (timeStr) => {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    
    let [, hours, minutes, period] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  const start = parseTime(data.startTime);
  const end = parseTime(data.endTime);

  if (start === null || end === null) return true; // Let time format validation handle this

  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Room validation schema
export const roomSchema = z.object({
  room: z.string().min(1, {
    message: 'Room name is required',
  }).max(50, {
    message: 'Room name must be less than 50 characters',
  }),
  area: z.string().min(1, {
    message: 'Area/Location is required',
  }).max(100, {
    message: 'Area must be less than 100 characters',
  }),
  status: z.enum(['available', 'maintenance'], {
    errorMap: () => ({ message: 'Status must be either available or maintenance' }),
  }),
});

// Instructor validation schema
export const instructorSchema = z.object({
  firstname: z.string().min(1, {
    message: 'First name is required',
  }).max(50, {
    message: 'First name must be less than 50 characters',
  }),
  lastname: z.string().min(1, {
    message: 'Last name is required',
  }).max(50, {
    message: 'Last name must be less than 50 characters',
  }),
  email: emailSchema,
  contact: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    // Basic phone number validation (adjust regex as needed)
    return /^[\d\s\-\+\(\)]+$/.test(val);
  }, {
    message: 'Please enter a valid contact number',
  }),
  department: z.string().optional(),
});

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, {
    message: 'Password is required',
  }),
});

// Registration validation schema
export const registrationSchema = z.object({
  firstname: z.string().min(1, {
    message: 'First name is required',
  }),
  lastname: z.string().min(1, {
    message: 'Last name is required',
  }),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, {
    message: 'Please confirm your password',
  }),
  contact: z.string().optional(),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Section validation schema
export const sectionSchema = z.object({
  name: z.string().min(1, {
    message: 'Section name is required',
  }).max(20, {
    message: 'Section name must be less than 20 characters',
  }),
  course: z.string().min(1, {
    message: 'Course is required',
  }),
  year: z.string().min(1, {
    message: 'Year is required',
  }),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, {
    message: 'Please confirm your password',
  }),
  token: z.string().min(1, {
    message: 'Token is required',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, {
    message: 'Search query is required',
  }).max(100, {
    message: 'Search query must be less than 100 characters',
  }),
});

export default {
  scheduleSchema,
  roomSchema,
  instructorSchema,
  loginSchema,
  registrationSchema,
  sectionSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  searchSchema,
  emailSchema,
  passwordSchema,
  timeSchema,
};

