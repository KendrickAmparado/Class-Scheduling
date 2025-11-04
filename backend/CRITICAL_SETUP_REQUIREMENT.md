# ⚠️ CRITICAL SETUP REQUIREMENT

## IMPORTANT: Calendar Sharing is Required

For Google Calendar integration to work, **each instructor's calendar MUST be shared with your service account**.

### Why This is Required

When your application creates events using a service account, it can only create events in calendars that have been explicitly shared with the service account email.

### Quick Setup Instructions

#### For Each Instructor (if using personal Gmail):

1. Find your service account email in your Google Cloud Console
   - It looks like: `your-service-name@your-project-id.iam.gserviceaccount.com`

2. Have each instructor share their calendar:
   - Go to [Google Calendar](https://calendar.google.com)
   - Click the **Settings** gear icon
   - Select **Settings** > **Settings for my calendars**
   - Click on their calendar name
   - Scroll down to **"Share with specific people"**
   - Click **"Add people"**
   - Enter your **service account email**
   - Set permission to **"Make changes to events"**
   - Click **"Send"**

#### For Google Workspace (Alternative):

If you're using Google Workspace, you can use Domain-Wide Delegation:
1. In your service account, enable "Domain-wide delegation"
2. In Google Workspace Admin Console, authorize the service account
3. This allows the service account to act on behalf of any user in the domain

### Testing Your Setup

#### 1. Check if configuration is loaded:
```
GET http://localhost:5000/api/schedule/test/google-calendar
```

#### 2. Create a test schedule:
- Use the admin panel to create a schedule
- Check the backend server logs for messages like:
  - ✅ "Google Calendar event created in [email]'s calendar"
  - ❌ "Error creating Google Calendar event"

#### 3. Check the instructor's calendar:
- Open the instructor's Google Calendar
- Look for the new event

### Common Error Messages

#### "Calendar not found" or "Insufficient Permission"
**Cause:** Calendar is not shared with service account
**Solution:** Share the instructor's calendar with the service account email

#### "Failed to create Google Calendar event"
**Cause:** Check server logs for specific error
**Solution:** See troubleshooting section below

### Troubleshooting

#### Issue: Events not appearing in instructor's calendar

**Check 1:** Verify service account email
```bash
echo $GOOGLE_CLIENT_EMAIL
```
This should show your service account email

**Check 2:** Verify calendar is shared
- Instructor should go to Google Calendar settings
- Verify your service account email is listed under "Share with specific people"
- Permission should be "Make changes to events" or higher

**Check 3:** Check backend logs
Look for error messages when creating schedules:
```bash
# Watch your terminal running the backend server
# You should see either success or error messages
```

#### Issue: "Invalid credentials" error

**Cause:** Private key format is incorrect
**Solution:** Ensure your `.env` file has the private key in this format:
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\nLines\n-----END PRIVATE KEY-----\n"
```

Important points:
- Must be in double quotes
- Keep all `\n` characters
- Don't remove the BEGIN/END markers

### Quick Verification Script

You can test if the integration is working by:

1. Make sure your `.env` file has all 3 variables set
2. Restart your backend server
3. Visit: `http://localhost:5000/api/schedule/test/google-calendar`
4. Should see all ✅ for environment variables

### Next Steps

1. ✅ Configure environment variables
2. ✅ Share each instructor's calendar with service account
3. ✅ Restart backend server
4. ✅ Test by creating a schedule
5. ✅ Check instructor's Google Calendar

### Need Help?

If you're still having issues:
1. Check the backend console logs for specific error messages
2. Verify all three environment variables are set correctly
3. Make sure each instructor has shared their calendar
4. Check that the service account email is correct

