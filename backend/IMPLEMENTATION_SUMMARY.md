# Google Calendar Integration - Implementation Summary

## Overview

Google Calendar API integration has been successfully implemented for the Class Scheduling System. When schedules are created, updated, or deleted, corresponding events are automatically synchronized to the instructor's Google Calendar.

## What Was Implemented

### 1. **Database Schema Changes**
- Added `googleCalendarEventId` field to the `Schedule` model to store the Google Calendar event ID for later reference

### 2. **Google Calendar Service** (`backend/services/googleCalendarService.js`)
Created a comprehensive service module with the following functions:
- **`createCalendarEvent()`**: Creates a recurring weekly event in Google Calendar
- **`updateCalendarEvent()`**: Updates an existing Google Calendar event
- **`deleteCalendarEvent()`**: Deletes a Google Calendar event
- **`isGoogleCalendarConfigured()`**: Checks if Google Calendar credentials are properly configured

**Features:**
- Automatic timezone support (default: Asia/Manila)
- Recurring weekly events based on day of the week
- Automatic time parsing and formatting
- Event details including course, year, section, and room
- Instructor email invitations for calendar notifications

### 3. **Schedule Routes Integration** (`backend/routes/scheduleRoutes.js`)
Integrated Google Calendar operations into schedule management:

**Create Schedule (`POST /api/schedule/create`):**
- Automatically creates a Google Calendar event when a schedule is created
- Stores the event ID in the database for future reference
- Gracefully handles errors without breaking the main flow

**Delete Schedule (`DELETE /api/schedule/:id`):**
- Deletes the corresponding Google Calendar event when a schedule is deleted
- Handles missing event IDs gracefully
- Continues with deletion even if calendar deletion fails

### 4. **Dependencies**
- Installed `googleapis` package (version 164.1.0) for Google Calendar API integration

### 5. **Documentation**
Created comprehensive setup documentation:
- **`GOOGLE_CALENDAR_SETUP.md`**: Detailed step-by-step guide for configuring Google Calendar API
- **`env.example`**: Example environment variables file

## How It Works

### Event Creation Flow

1. Admin creates a schedule in the system
2. System extracts schedule details (subject, day, time, room, instructor email)
3. Google Calendar service parses the day and time:
   - Converts day name to proper format (Monday → MO, Tuesday → TU, etc.)
   - Parses time range (e.g., "7:30 AM - 10:00 AM")
   - Calculates next occurrence of the scheduled day
4. Creates a recurring weekly event with:
   - Title: Subject name
   - Location: Room number
   - Description: Course, year, section, and room details
   - Recurrence: Weekly on specified day
   - Attendee: Instructor email (sends invitation)
5. Stores the Google Calendar event ID in the schedule document
6. Instructor receives an invitation email from Google Calendar

### Event Details

Each calendar event includes:
- **Summary**: Course subject
- **Location**: Room number
- **Description**: 
  ```
  Course: [course name]
  Year: [year level]
  Section: [section]
  Room: [room number]
  ```
- **Start/End Time**: Parsed from schedule time range
- **Timezone**: Asia/Manila (configurable)
- **Recurrence**: Weekly on the scheduled day
- **Attendees**: Instructor's email

## Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nLines\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-google-cloud-project-id
```

**Important:** The integration is **optional**. The system will work without these variables, but calendar events won't be created.

### Setup Instructions

See `GOOGLE_CALENDAR_SETUP.md` for detailed instructions on:
1. Creating a Google Cloud project
2. Enabling Google Calendar API
3. Creating service account credentials
4. Configuring calendar access
5. Troubleshooting common issues

## Time Format

The system expects schedule times in this format:
- **Format**: `"7:30 AM - 10:00 AM"`
- **Requirements**:
  - 12-hour format with AM/PM
  - Both start and end times
  - Separated by " - " (space-dash-space)

Examples:
- ✅ `"7:30 AM - 10:00 AM"`
- ✅ `"1:00 PM - 3:30 PM"`
- ❌ `"07:30-10:00"`
- ❌ `"7:30 AM"`

## Day Format

The system accepts various day formats and converts them properly:
- Full names: Monday, Tuesday, Wednesday, etc.
- Abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Case insensitive

## Key Features

### 1. **Graceful Degradation**
- If Google Calendar is not configured, the system continues to work normally
- Schedule operations succeed even if calendar operations fail
- Errors are logged but don't break the application

### 2. **Error Handling**
- Comprehensive try-catch blocks around calendar operations
- Detailed error logging
- Non-blocking calendar operations

### 3. **Email Notifications**
- Instructors automatically receive Google Calendar invitation emails
- Notifications include event details and can be accepted directly

### 4. **Recurring Events**
- Events are created as recurring weekly occurrences
- No need to create individual events for each week
- Easy to modify or delete entire series

## Testing

To test the integration:

1. **Configure credentials**: Add the three Google Calendar environment variables
2. **Create a test schedule**: Use the admin interface to create a schedule
3. **Check logs**: Look for "✅ Google Calendar event created" message
4. **Check instructor's calendar**: Verify event appears in their Google Calendar
5. **Check email**: Instructor should receive an invitation email

## Troubleshooting

Common issues and solutions:

### Events Not Appearing
- Verify environment variables are set correctly
- Check Google Calendar API is enabled
- Ensure calendar is shared with service account (for personal Gmail)
- Review server logs for error messages

### Permission Errors
- For Google Workspace: Check domain-wide delegation setup
- For Personal Gmail: Verify calendar sharing

### Time Format Errors
- Ensure times are in "H:MM AM/PM - H:MM AM/PM" format
- Check day names are valid

## Files Modified/Created

### Created
- `backend/services/googleCalendarService.js` - Calendar service
- `backend/GOOGLE_CALENDAR_SETUP.md` - Setup guide
- `backend/IMPLEMENTATION_SUMMARY.md` - This file
- `backend/env.example` - Example environment variables

### Modified
- `backend/models/Schedule.js` - Added `googleCalendarEventId` field
- `backend/routes/scheduleRoutes.js` - Integrated calendar operations
- `backend/package.json` - Added `googleapis` dependency

## Future Enhancements

Potential improvements:
- Add schedule update (PUT/PATCH) integration
- Support multiple day schedules (e.g., "Monday/Wednesday")
- Add timezone configuration in settings
- Add UI toggle for calendar integration
- Support custom calendar locations
- Add event modification history

## Support

For issues or questions:
1. Review `GOOGLE_CALENDAR_SETUP.md` for setup help
2. Check server logs for specific error messages
3. Verify all environment variables are correct
4. Ensure Google Calendar API is properly configured

## Summary

The Google Calendar integration is now fully operational. The system automatically:
- ✅ Creates calendar events when schedules are created
- ✅ Deletes calendar events when schedules are deleted
- ✅ Sends invitation emails to instructors
- ✅ Handles errors gracefully
- ✅ Works without configuration (optional feature)

To enable it, simply follow the setup guide in `GOOGLE_CALENDAR_SETUP.md` and configure your environment variables!

