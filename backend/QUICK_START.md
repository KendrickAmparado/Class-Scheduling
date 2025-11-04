# Google Calendar Integration - Quick Start

## ⚠️ YOU MUST DO THIS FIRST

**For Google Calendar integration to work, each instructor's calendar MUST be shared with your service account.**

### Step 1: Get Your Service Account Email

Your service account email is in your `.env` file:
```env
GOOGLE_CLIENT_EMAIL=something@your-project.iam.gserviceaccount.com
```

Copy this email address.

### Step 2: Share Each Instructor's Calendar

**Each instructor needs to do this:**

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the **Settings gear** (⚙️) → **Settings**
3. Click **"Settings for my calendars"** in the left menu
4. Click on their calendar name
5. Scroll down to **"Share with specific people"**
6. Click **"Add people"**
7. Paste your **service account email**
8. Set permission: **"Make changes to events"**
9. Click **"Send"**

### Step 3: Verify Configuration

Test if your setup is working:

```bash
# In your browser or using curl:
http://localhost:5000/api/schedule/test/google-calendar
```

You should see:
```json
{
  "configured": true,
  "env_variables": {
    "GOOGLE_CLIENT_EMAIL": "✅ Set",
    "GOOGLE_PRIVATE_KEY": "✅ Set",
    "GOOGLE_PROJECT_ID": "✅ Set"
  },
  "instructions": "Configured! Events will be created in instructor calendars."
}
```

### Step 4: Test Creating a Schedule

1. Open your admin panel
2. Create a new schedule for an instructor
3. Check the **backend console logs** for:
   - ✅ `Google Calendar event created in [email]'s calendar: [event-id]`
   - ❌ If you see an error, check the error message

4. Check the instructor's Google Calendar
   - The event should appear automatically

### Common Issues

#### "Calendar not found" or "Insufficient Permission"
**Problem:** Calendar not shared with service account
**Solution:** Instructor needs to share their calendar (see Step 2)

#### Events still not appearing
**Check:**
1. Is the service account email correct in `.env`?
2. Did the instructor share their calendar correctly?
3. Did you restart the backend server after adding `.env` variables?
4. Check backend logs for specific error messages

#### "Failed to create Google Calendar event"
**Check backend logs** for the full error message and see:
- `CRITICAL_SETUP_REQUIREMENT.md` for troubleshooting
- `GOOGLE_CALENDAR_SETUP.md` for detailed setup instructions

### Quick Checklist

- [ ] Service account email is set in `.env`
- [ ] Private key is set in `.env` (with quotes and \n characters)
- [ ] Project ID is set in `.env`
- [ ] Backend server restarted after `.env` changes
- [ ] Each instructor shared their calendar with service account
- [ ] Test endpoint shows all ✅
- [ ] Created a test schedule
- [ ] Checked instructor's Google Calendar for the event

### Need More Help?

1. See `CRITICAL_SETUP_REQUIREMENT.md` for detailed troubleshooting
2. See `GOOGLE_CALENDAR_SETUP.md` for complete setup guide
3. Check your backend console logs for error messages
4. Verify the test endpoint: `http://localhost:5000/api/schedule/test/google-calendar`

