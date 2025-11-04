# Google Calendar API Integration Setup Guide

This guide will help you set up Google Calendar integration for the Class Scheduling System. When schedules are created, updated, or deleted, corresponding events will be automatically added to, modified in, or removed from the instructor's Google Calendar.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Node.js backend running

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID (you'll need this later)

## Step 2: Enable Google Calendar API

1. In your Google Cloud project, navigate to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Create Service Account Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - **Service account name**: e.g., "class-scheduling-calendar"
   - **Service account ID**: auto-generated
   - Click **Create and Continue**
4. Skip the optional steps (Grant access and Grant users access)
5. Click **Done**

## Step 4: Create and Download JSON Key

1. In the Credentials page, find your newly created service account
2. Click on it to open details
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Select **JSON** format
6. Click **Create** - this will download a JSON file to your computer

## Step 5: Configure Service Account Permissions

You have two options for managing calendar access:

### Option A: Domain-Wide Delegation (Recommended for G Suite/Workspace)

If your instructors use Google Workspace accounts:

1. Go back to your service account details
2. Under **Advanced settings**, enable **Domain-wide delegation**
3. Note the **Client ID**
4. In your Google Workspace Admin Console, go to **Security** > **Access and data control** > **API controls**
5. Under **Domain-wide delegation**, click **Manage Domain Wide Delegation**
6. Click **Add new** and enter:
   - **Client ID**: From your service account
   - **OAuth scopes**: `https://www.googleapis.com/auth/calendar`
7. Click **Authorize**

### Option B: Share Calendars with Service Account (For Personal Gmail)

For instructors using personal Gmail accounts:

1. Have each instructor share their calendar with the service account email
2. The service account email format is: `service-account-name@project-id.iam.gserviceaccount.com`
3. Instructors should:
   - Go to Google Calendar
   - Click Settings > Settings for my calendars > [Their Calendar]
   - Scroll to "Share with specific people"
   - Click "Add people"
   - Enter the service account email
   - Set permission to "Make changes to events"
   - Click "Send"

## Step 6: Configure Environment Variables

1. Open the downloaded JSON key file from Step 4
2. Copy the following values:
   - `client_email`
   - `private_key`
   - `project_id`
3. Add these to your backend `.env` file:

```env
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
```

**Important Notes:**
- The `GOOGLE_PRIVATE_KEY` value must be enclosed in double quotes
- Keep the `\n` characters in the private key exactly as shown
- Never commit your `.env` file or JSON credentials to version control

## Step 7: Test the Integration

1. Restart your backend server
2. Create a test schedule in the system
3. Check if the event appears in the instructor's Google Calendar
4. Verify the following:
   - Event title matches the subject
   - Date and time are correct
   - Recurrence is set to weekly on the correct day
   - Location shows the room number
   - Description includes course, year, section, and room details

## Troubleshooting

### Events not appearing in calendar

1. **Check environment variables**: Ensure all three variables are set correctly
2. **Verify API is enabled**: Double-check Google Calendar API is enabled in Cloud Console
3. **Check calendar sharing**: For personal Gmail, verify calendar is shared with service account
4. **Review server logs**: Look for error messages in your backend console
5. **Test credentials**: The system will log "Google Calendar is not configured" if credentials are missing

### Permission errors

- **For G Suite/Workspace**: Verify domain-wide delegation is set up correctly
- **For Personal Gmail**: Ensure each instructor has shared their calendar

### Timezone issues

The default timezone is set to `Asia/Manila`. To change it:

1. Open `backend/services/googleCalendarService.js`
2. Find all occurrences of `timeZone: 'Asia/Manila'`
3. Replace with your desired timezone (e.g., `America/New_York`, `Europe/London`)
4. Common timezone codes: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Time format errors

Ensure schedule times are in the format: `"7:30 AM - 10:00 AM"`

The system expects:
- 12-hour format with AM/PM
- Both start and end times
- Separation by " - " (space-dash-space)

## API Behavior

### Creating Schedules

- When a schedule is created, a recurring weekly event is added to the instructor's Google Calendar
- The event repeats every week on the specified day
- If the Google Calendar integration is not configured or fails, the schedule is still saved in the database

### Updating Schedules

- If an update route is added in the future, it will update the existing Google Calendar event
- The event ID is stored in the schedule document for reference

### Deleting Schedules

- When a schedule is deleted, the corresponding Google Calendar event is also deleted
- If calendar deletion fails, the schedule is still removed from the database

## Security Best Practices

1. **Never commit credentials**: Use `.gitignore` to exclude `.env` and JSON key files
2. **Rotate keys**: Periodically regenerate service account keys
3. **Limit access**: Only grant necessary permissions to the service account
4. **Monitor usage**: Review Google Cloud Console logs for unusual activity
5. **Use environment variables**: Never hardcode credentials in your source code

## Support

For additional help:
- Google Calendar API Documentation: https://developers.google.com/calendar/api/guides/overview
- Google Cloud Console: https://console.cloud.google.com/
- Service Account Setup: https://cloud.google.com/iam/docs/service-accounts

## Notes

- The integration is **optional** - the system will work without it
- Calendar events are created in the service account's "primary" calendar
- Each instructor will receive email notifications for events they're invited to
- The system uses recurring events, so the calendar will show all future occurrences

