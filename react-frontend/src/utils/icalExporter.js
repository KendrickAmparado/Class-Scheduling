/**
 * iCal/ICS file generator utility
 * Generates calendar files compatible with Google Calendar, Outlook, Apple Calendar, etc.
 */

/**
 * Convert day name to iCal day abbreviation
 */
const dayToIcalDay = (dayStr) => {
  const dayMap = {
    'monday': 'MO',
    'tuesday': 'TU',
    'wednesday': 'WE',
    'thursday': 'TH',
    'friday': 'FR',
    'saturday': 'SA',
    'sunday': 'SU'
  };
  
  const normalized = dayStr.toLowerCase().trim();
  return dayMap[normalized] || null;
};

/**
 * Parse time string (e.g., "8:00 AM - 10:00 AM") to Date objects
 */
const parseTimeToDate = (timeStr, day, weekOffset = 0) => {
  if (!timeStr || !day) {
    return null;
  }
  
  const [startTime, endTime] = String(timeStr).split(' - ').map(t => t.trim()).filter(Boolean);
  
  if (!startTime || !endTime) {
    return null;
  }
  
  const parseTime = (time) => {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
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
  
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (!start || !end) return null;
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 0
  };
  
  const dayNum = dayMap[day.toLowerCase().trim()];
  if (dayNum === undefined) return null;
  
  // Get next occurrence of this day
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = (dayNum - currentDay + 7) % 7;
  if (daysUntil === 0 && now.getHours() * 60 + now.getMinutes() > start.hours * 60 + start.minutes) {
    daysUntil = 7; // Next week if time has passed today
  }
  daysUntil += weekOffset * 7;
  
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + daysUntil);
  startDate.setHours(start.hours, start.minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(end.hours, end.minutes, 0, 0);
  
  return { startDate, endDate };
};

/**
 * Format date to iCal format (YYYYMMDDTHHMMSS)
 */
const formatIcalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

/**
 * Escape text for iCal format
 */
const escapeIcalText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate iCal file content from schedule array
 */
export const generateIcalFile = (schedules, options = {}) => {
  const {
    calendarName = 'Class Schedule',
    courseName = '',
    sectionName = '',
    timezone = 'UTC'
  } = options;
  
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return ''; // Return empty string if no schedules
  }
  
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Class Scheduling System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(calendarName)}`,
    `X-WR-TIMEZONE:${timezone}`,
    ''
  ];
  
  // Process each schedule
  schedules.forEach((schedule, index) => {
    const { subject, day, time, room, instructor, course, year, section } = schedule || {};
    
    // Validate required fields
    if (!day || !time) {
      console.warn('Skipping schedule with missing day or time:', schedule);
      return;
    }
    
    // Handle multiple days (e.g., "Monday/Wednesday")
    const days = String(day).split('/').map(d => d.trim()).filter(Boolean);
    
    if (days.length === 0) {
      console.warn('Skipping schedule with invalid day format:', schedule);
      return;
    }
    
    days.forEach((singleDay) => {
      const dateInfo = parseTimeToDate(time, singleDay);
      if (!dateInfo) {
        console.warn('Skipping schedule with invalid time format:', { time, day: singleDay });
        return;
      }
      
      const { startDate, endDate } = dateInfo;
      const icalDay = dayToIcalDay(singleDay);
      
      // Generate unique ID
      const uid = `schedule-${index}-${singleDay.toLowerCase()}-${Date.now()}@class-scheduling.local`;
      
      // Build description
      const descriptionParts = [];
      if (course) descriptionParts.push(`Course: ${course}`);
      if (year) descriptionParts.push(`Year: ${year}`);
      if (section) descriptionParts.push(`Section: ${section}`);
      if (instructor) descriptionParts.push(`Instructor: ${instructor}`);
      const description = descriptionParts.join('\\n');
      
      // Build location
      const location = room ? `Room: ${room}` : '';
      
      // Build summary
      const summary = subject || 'Class';
      
      // Create event
      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${uid}`);
      icalContent.push(`DTSTART:${formatIcalDate(startDate)}`);
      icalContent.push(`DTEND:${formatIcalDate(endDate)}`);
      icalContent.push(`DTSTAMP:${formatIcalDate(new Date())}`);
      icalContent.push(`SUMMARY:${escapeIcalText(summary)}`);
      
      if (description) {
        icalContent.push(`DESCRIPTION:${escapeIcalText(description)}`);
      }
      
      if (location) {
        icalContent.push(`LOCATION:${escapeIcalText(location)}`);
      }
      
      // Add recurring rule (weekly)
      if (icalDay) {
        icalContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${icalDay};COUNT=52`); // 52 weeks (1 year)
      }
      
      icalContent.push('END:VEVENT');
      icalContent.push('');
    });
  });
  
  icalContent.push('END:VCALENDAR');
  
  return icalContent.join('\r\n');
};

/**
 * Download iCal file
 */
export const downloadIcalFile = (schedules, filename, options = {}) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    console.warn('Cannot export empty schedule list');
    throw new Error('No schedules to export');
  }
  
  const icalContent = generateIcalFile(schedules, options);
  
  if (!icalContent || icalContent.trim() === '') {
    console.warn('Generated iCal content is empty');
    throw new Error('Failed to generate calendar file');
  }
  
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL (opens Google Calendar with pre-filled event data)
 */
export const generateGoogleCalendarUrl = (schedule) => {
  if (!schedule || !schedule.day || !schedule.time) {
    console.warn('Invalid schedule data for Google Calendar:', schedule);
    return null;
  }
  
  const { subject, day, time, room, instructor, course, year, section } = schedule;
  
  // Parse time for first occurrence
  const firstDay = String(day).split('/')[0].trim();
  if (!firstDay) {
    console.warn('Invalid day format for Google Calendar:', day);
    return null;
  }
  
  const dateInfo = parseTimeToDate(time, firstDay);
  if (!dateInfo) {
    console.warn('Invalid time format for Google Calendar:', time);
    return null;
  }
  
  const { startDate, endDate } = dateInfo;
  
  // Format dates for Google Calendar URL
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
  
  // Build details
  const details = [];
  if (course) details.push(`Course: ${course}`);
  if (year) details.push(`Year: ${year}`);
  if (section) details.push(`Section: ${section}`);
  if (instructor) details.push(`Instructor: ${instructor}`);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: subject || 'Class',
    dates: dates,
    details: details.join('\n'),
    location: room ? `Room: ${room}` : '',
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${dayToIcalDay(day.split('/')[0].trim()) || 'MO'};COUNT=52`
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

