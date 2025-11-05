import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Calendar API using service account (calendar must be shared with this account)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Convert day string to day of week number (0 = Sunday, 1 = Monday, etc.)
 */
const dayToDayOfWeek = (day) => {
  const dayMap = {
    'sunday': 0,
    'sun': 0,
    'monday': 1,
    'mon': 1,
    'tuesday': 2,
    'tue': 2,
    'wednesday': 3,
    'wed': 3,
    'thursday': 4,
    'thu': 4,
    'friday': 5,
    'fri': 5,
    'saturday': 6,
    'sat': 6,
  };

  const normalizedDay = day.toLowerCase().trim();
  return dayMap[normalizedDay] !== undefined ? dayMap[normalizedDay] : null;
};

/**
 * Convert day string to Google Calendar RRULE day abbreviation (SU, MO, TU, etc.)
 */
const dayToRRULEDay = (day) => {
  const dayMap = {
    'sunday': 'SU',
    'sun': 'SU',
    'monday': 'MO',
    'mon': 'MO',
    'tuesday': 'TU',
    'tue': 'TU',
    'wednesday': 'WE',
    'wed': 'WE',
    'thursday': 'TH',
    'thu': 'TH',
    'friday': 'FR',
    'fri': 'FR',
    'saturday': 'SA',
    'sat': 'SA',
  };
  
  const normalizedDay = day.toLowerCase().trim();
  return dayMap[normalizedDay] || 'MO';
};

/**
 * Parse time string to hours and minutes
 */
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  
  // Handle time range like "7:30 AM - 10:00 AM"
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
  
  return { hours, minutes };
};

/**
 * Get the next occurrence of a given day
 */
const getNextDayOccurrence = (dayOfWeek, time) => {
  const now = new Date();
  const day = now.getDay();
  
  // Calculate days until next occurrence
  let daysUntil = dayOfWeek - day;
  if (daysUntil < 0 || (daysUntil === 0 && time)) {
    const currentTime = parseTime(time);
    if (currentTime) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const eventMinutes = currentTime.hours * 60 + currentTime.minutes;
      if (nowMinutes >= eventMinutes) {
        daysUntil += 7;
      }
    } else {
      daysUntil += 7;
    }
  }
  
  const nextOccurrence = new Date(now);
  nextOccurrence.setDate(now.getDate() + daysUntil);
  
  return nextOccurrence;
};

const getDaysArray = (schedule) => {
  if (Array.isArray(schedule.days) && schedule.days.length) {
    return schedule.days;
  }
  if (typeof schedule.day === 'string') {
    return schedule.day.split(',').map(d => d.trim()).filter(Boolean);
  }
  return [];
};

const getNextOccurrenceForDays = (days, time) => {
  const dayNumbers = days
    .map(d => dayToDayOfWeek(d))
    .filter(d => d !== null);
  if (!dayNumbers.length) throw new Error('Invalid days provided');
  const now = new Date();
  let bestDate = null;
  for (const d of dayNumbers) {
    const candidate = getNextDayOccurrence(d, time);
    if (!bestDate || candidate < bestDate) bestDate = candidate;
  }
  return bestDate;
};

/**
 * Convert schedule day and time to Google Calendar date
 */
const scheduleToDate = (day, time) => {
  const dayOfWeek = dayToDayOfWeek(day);
  if (dayOfWeek === null) {
    throw new Error(`Invalid day: ${day}`);
  }
  
  const date = getNextDayOccurrence(dayOfWeek, time);
  const timeData = parseTime(time);
  
  if (timeData) {
    date.setHours(timeData.hours, timeData.minutes, 0, 0);
  }
  
  return date;
};

/**
 * Create a recurring event in Google Calendar
 */
export const createCalendarEvent = async (schedule, instructorEmail) => {
  try {
    // Parse start and end time
    const timeParts = schedule.time.split(' - ');
    if (timeParts.length !== 2) {
      throw new Error('Invalid time format. Expected format: "7:30 AM - 10:00 AM"');
    }
    
    const days = getDaysArray(schedule);
    const startDate = days.length
      ? getNextOccurrenceForDays(days, timeParts[0].trim())
      : scheduleToDate(schedule.day, timeParts[0].trim());
    // Ensure start time is set when using multi-day helper
    const startTimeParsed = parseTime(timeParts[0].trim());
    if (startTimeParsed) {
      startDate.setHours(startTimeParsed.hours, startTimeParsed.minutes, 0, 0);
    }
    const endDate = new Date(startDate);
    const endTimeParsed = parseTime(timeParts[1].trim());
    if (!endTimeParsed) throw new Error('Invalid end time');
    endDate.setHours(endTimeParsed.hours, endTimeParsed.minutes, 0, 0);
    
    // If start time is after end time, add a day to end date
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const rruleDays = (days.length ? days : [schedule.day])
      .map(d => dayToRRULEDay(d))
      .filter(Boolean)
      .join(',');

    const event = {
      summary: `${schedule.subject}`,
      description: `Course: ${schedule.course}\nYear: ${schedule.year}\nSection: ${schedule.section}\nRoom: ${schedule.room}`,
      location: schedule.room,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Manila', // Adjust to your timezone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      recurrence: [
        `RRULE:FREQ=DAILY`
      ],
    };
    
    const response = await calendar.events.insert({
      calendarId: instructorEmail, // Use instructor's email as calendar ID
      sendUpdates: 'all',
      resource: event,
    });
    
    console.log(`✅ Google Calendar event created in ${instructorEmail}'s calendar: ${response.data.id}`);
    return response.data.id;
    
  } catch (error) {
    if (error?.response?.data) {
      console.error('❌ Error creating Google Calendar event:', JSON.stringify(error.response.data));
    } else {
      console.error('❌ Error creating Google Calendar event:', error.message);
    }
    throw error;
  }
};

/**
 * List upcoming events from an instructor's Google Calendar
 */
export const listCalendarEvents = async (instructorEmail, { timeMin, timeMax, maxResults = 50 } = {}) => {
  if (!instructorEmail) throw new Error('Instructor email is required');
  const now = new Date();
  const params = {
    calendarId: instructorEmail,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults,
    timeMin: (timeMin ? new Date(timeMin) : now).toISOString(),
  };
  if (timeMax) params.timeMax = new Date(timeMax).toISOString();

  const res = await calendar.events.list(params);
  return res.data.items || [];
};

/**
 * Get a specific event by ID from an instructor's calendar
 */
export const getCalendarEvent = async (instructorEmail, eventId) => {
  if (!instructorEmail || !eventId) throw new Error('Instructor email and eventId are required');
  const res = await calendar.events.get({ calendarId: instructorEmail, eventId });
  return res.data;
};

/**
 * Update an existing Google Calendar event
 */
export const updateCalendarEvent = async (eventId, schedule, instructorEmail) => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required for update');
    }
    
    // Parse start and end time
    const timeParts = schedule.time.split(' - ');
    if (timeParts.length !== 2) {
      throw new Error('Invalid time format. Expected format: "7:30 AM - 10:00 AM"');
    }
    
    const days = getDaysArray(schedule);
    const startDate = days.length
      ? getNextOccurrenceForDays(days, timeParts[0].trim())
      : scheduleToDate(schedule.day, timeParts[0].trim());
    const endDate = new Date(startDate);
    const endTimeParsed = parseTime(timeParts[1].trim());
    if (!endTimeParsed) throw new Error('Invalid end time');
    endDate.setHours(endTimeParsed.hours, endTimeParsed.minutes, 0, 0);
    
    // If start time is after end time, add a day to end date
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const rruleDays = (days.length ? days : [schedule.day])
      .map(d => dayToRRULEDay(d))
      .filter(Boolean)
      .join(',');

    const event = {
      summary: `${schedule.subject}`,
      description: `Course: ${schedule.course}\nYear: ${schedule.year}\nSection: ${schedule.section}\nRoom: ${schedule.room}`,
      location: schedule.room,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      recurrence: [
        `RRULE:FREQ=DAILY`
      ],
    };
    
    const response = await calendar.events.update({
      calendarId: instructorEmail, // Use instructor's email as calendar ID
      eventId: eventId,
      sendUpdates: 'all',
      resource: event,
    });
    
    console.log(`✅ Google Calendar event updated in ${instructorEmail}'s calendar: ${response.data.id}`);
    return response.data.id;
    
  } catch (error) {
    if (error?.response?.data) {
      console.error('❌ Error updating Google Calendar event:', JSON.stringify(error.response.data));
    } else {
      console.error('❌ Error updating Google Calendar event:', error.message);
    }
    throw error;
  }
};

/**
 * Delete a Google Calendar event
 */
export const deleteCalendarEvent = async (eventId, instructorEmail) => {
  try {
    if (!eventId) {
      console.warn('⚠️ No event ID provided for deletion');
      return;
    }
    
    if (!instructorEmail) {
      console.warn('⚠️ No instructor email provided for deletion');
      return;
    }
    
    await calendar.events.delete({
      calendarId: instructorEmail, // Use instructor's email as calendar ID
      eventId: eventId,
      sendUpdates: 'all',
    });
    
    console.log(`✅ Google Calendar event deleted from ${instructorEmail}'s calendar: ${eventId}`);
    
  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error.message);
    // Don't throw error for deletion failures to avoid breaking the main flow
  }
};

// Cache configuration status
let configStatusChecked = false;

/**
 * Check if Google Calendar is configured
 */
export const isGoogleCalendarConfigured = () => {
  const configured = !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PROJECT_ID
  );
  
  // Only log once at startup
  if (!configStatusChecked) {
    if (!configured) {
      console.log('⚠️  Google Calendar is not configured. Set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_PROJECT_ID in your .env file');
    } else {
      console.log(`✅ Google Calendar is configured with service account: ${process.env.GOOGLE_CLIENT_EMAIL}`);
    }
    configStatusChecked = true;
  }
  
  return configured;
};

