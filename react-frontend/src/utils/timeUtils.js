// Standardized time utilities for consistent schedule display

// Convert time string to minutes for calculations
export const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return -1;
  const raw = String(timeStr).trim();
  // Allow inputs like:
  // "7:30 AM", "7:30 am", "7:30AM", "07:30", "7:30 am - 10:00 am" (we'll take first part)
  const firstPart = raw.split(/\s*-\s*/)[0];
  const match = firstPart.match(/^(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?$/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10) || 0;
  const meridiem = (match[3] || '').toLowerCase();
  if (meridiem) {
    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
  }
  // If no meridiem, treat as 24-hour time
  return hours * 60 + minutes;
};

// Convert minutes back to time string
export const minutesToTimeString = (minutes, format = '12hour') => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (format === '24hour') {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  } else {
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }
};

// Standardize time format across the application
export const standardizeTimeFormat = (timeString, targetFormat = '12hour') => {
  if (!timeString) return '';
  
  // Handle different input formats
  let cleanTime = timeString;
  if (timeString.includes(' - ')) {
    cleanTime = timeString.split(' - ')[0];
  }
  
  // Convert to minutes first
  const minutes = timeStringToMinutes(cleanTime);
  if (minutes === -1) return timeString;
  
  // Convert back to target format
  return minutesToTimeString(minutes, targetFormat);
};

// Generate time slots for schedule grid
export const generateTimeSlots = (startHour = 7, endHour = 21, slotDuration = 30) => {
  const slots = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const startTime = minutesToTimeString(minutes, '12hour');
    const endTime = minutesToTimeString(minutes + slotDuration, '12hour');
    slots.push(`${startTime} - ${endTime}`);
  }
  
  return slots;
};

// Check if two time ranges overlap
export const timeRangesOverlap = (time1, time2) => {
  const [start1, end1] = time1.split(' - ').map(t => timeStringToMinutes(t.trim()));
  const [start2, end2] = time2.split(' - ').map(t => timeStringToMinutes(t.trim()));
  
  if (start1 === -1 || end1 === -1 || start2 === -1 || end2 === -1) return false;
  
  return start1 < end2 && start2 < end1;
};

// Get duration of a time range in minutes
export const getTimeRangeDuration = (timeRange) => {
  const [start, end] = timeRange.split(' - ').map(t => timeStringToMinutes(t.trim()));
  if (start === -1 || end === -1) return 0;
  return end - start;
};

// Format time range for display
export const formatTimeRange = (startTime, endTime, format = '12hour') => {
  const start = standardizeTimeFormat(startTime, format);
  const end = standardizeTimeFormat(endTime, format);
  return `${start} - ${end}`;
};

// Standard time formats used across the application
export const TIME_FORMATS = {
  GRID_30MIN: '7:30 AM - 8:00 AM', // 30-minute slots for detailed grid
  GRID_1HOUR: '8:00 AM - 9:00 AM', // 1-hour slots for general grid
  CARD_2HOUR: '8:00 AM - 10:00 AM', // 2-hour slots for instructor cards
  REPORT_2_5HOUR: '7:30 AM - 10:00 AM', // 2.5-hour slots for reports
  SIMPLE_1HOUR: '8:00 - 9:00' // Simple format without AM/PM
};

// Standard time slot configurations
export const TIME_SLOT_CONFIGS = {
  DETAILED: {
    startHour: 7,
    endHour: 21,
    duration: 30,
    format: '12hour'
  },
  GENERAL: {
    startHour: 7,
    endHour: 21,
    duration: 60,
    format: '12hour'
  },
  INSTRUCTOR: {
    startHour: 7,
    endHour: 21,
    duration: 120,
    format: '12hour'
  },
  REPORTS: {
    startHour: 7,
    endHour: 21,
    duration: 150,
    format: '12hour'
  }
};
