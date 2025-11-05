# Sentry Error Tracking Setup

This guide will help you integrate Sentry for error tracking and performance monitoring in your Class Scheduling System.

## Overview

Sentry provides:
- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Track API response times and slow queries
- **Session Replay**: Record user sessions to debug issues
- **Release Tracking**: Monitor errors by deployment version
- **User Context**: See which users are affected by errors

## Features

### 1. Automatic Error Capture
- Catches unhandled exceptions
- Captures API errors
- Tracks React component errors
- Monitors database connection issues

### 2. Performance Monitoring
- Tracks API endpoint performance
- Monitors database query times
- Identifies slow operations
- Performance budgets and alerts

### 3. Session Replay
- Records user sessions when errors occur
- Helps debug UI issues
- Privacy-focused (masks sensitive data)

### 4. User Context
- Tracks which users encounter errors
- Groups errors by user
- Helps identify patterns

## Setup Instructions

### Step 1: Create Sentry Account

1. Visit [Sentry.io](https://sentry.io/)
2. Sign up for a free account
3. Create a new project
4. Select your platform:
   - **Backend**: Node.js
   - **Frontend**: React

### Step 2: Get Your DSN

1. Go to your Sentry project settings
2. Navigate to **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**
3. Copy your DSN (it looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### Step 3: Install Sentry Packages

#### Backend:
```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

#### Frontend:
```bash
cd react-frontend
npm install @sentry/react
```

### Step 4: Configure Environment Variables

#### Backend (`backend/.env`):
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

#### Frontend (`react-frontend/.env`):
```env
REACT_APP_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Configuration Options:**
- `SENTRY_DSN`: Your Sentry project DSN (required)
- `SENTRY_TRACES_SAMPLE_RATE`: Percentage of transactions to sample (0.0 to 1.0)
  - `0.1` = 10% of requests tracked
  - `1.0` = 100% of requests tracked
- `SENTRY_PROFILES_SAMPLE_RATE`: Percentage of profiles to sample (0.0 to 1.0)

### Step 5: Restart Your Servers

After adding the environment variables, restart both servers:

```bash
# Backend
cd backend
npm start

# Frontend
cd react-frontend
npm start
```

## Usage

### Automatic Error Tracking

Errors are automatically captured. No code changes needed for:
- Unhandled exceptions
- API errors
- React component errors
- Database errors

### Manual Error Reporting

You can manually capture errors:

#### Backend:
```javascript
import { captureException, captureMessage } from './utils/sentry.js';

try {
  // Your code
} catch (error) {
  captureException(error, {
    context: {
      userId: req.user?.id,
      action: 'createSchedule',
      scheduleId: req.body.scheduleId
    }
  });
}

// Capture a message
captureMessage('Something important happened', 'info', {
  context: {
    userId: user.id,
    action: 'userLogin'
  }
});
```

#### Frontend:
```javascript
import { captureException, captureMessage } from './utils/sentry.js';

try {
  // Your code
} catch (error) {
  captureException(error, {
    context: {
      component: 'ScheduleManagement',
      action: 'createSchedule',
      userId: user.id
    }
  });
}

// Capture a message
captureMessage('User performed action', 'info', {
  context: {
    component: 'Dashboard',
    action: 'viewSchedule'
  }
});
```

### Set User Context

#### Backend:
```javascript
import { setUser, clearUser } from './utils/sentry.js';

// After login
setUser({
  id: user._id,
  email: user.email,
  username: user.name
});

// After logout
clearUser();
```

#### Frontend:
```javascript
import { setUser, clearUser } from './utils/sentry.js';

// After login
setUser({
  id: user.id,
  email: user.email,
  username: user.name
});

// After logout
clearUser();
```

## Security & Privacy

Sentry automatically:
- Filters sensitive data (passwords, tokens, cookies)
- Removes authorization headers
- Masks text in session replays
- Respects user privacy

### Manual Filtering

You can add custom filters in `backend/utils/sentry.js` and `react-frontend/src/utils/sentry.js`:

```javascript
beforeSend(event, hint) {
  // Remove sensitive data
  if (event.request) {
    delete event.request.headers.authorization;
  }
  
  // Remove sensitive fields from context
  if (event.contexts) {
    delete event.contexts.password;
    delete event.contexts.token;
  }
  
  return event;
}
```

## What Gets Tracked

### Automatically Tracked:
- ✅ Unhandled exceptions
- ✅ API endpoint errors
- ✅ React component errors
- ✅ Database connection errors
- ✅ Network errors
- ✅ Performance metrics

### Not Tracked:
- ❌ User passwords
- ❌ Authentication tokens
- ❌ Cookies
- ❌ Sensitive headers
- ❌ Credit card information

## Error Filtering

Common errors are automatically ignored:
- Browser extension errors
- Network timeout errors (can be noisy)
- Chunk load errors (common in development)

## Monitoring & Alerts

### Sentry Dashboard

1. **Issues**: See all errors grouped by type
2. **Performance**: Monitor API response times
3. **Releases**: Track errors by deployment
4. **Users**: See which users are affected

### Setting Up Alerts

1. Go to **Alerts** in Sentry dashboard
2. Create alert rules for:
   - New errors
   - Error frequency spikes
   - Performance degradation
   - User impact thresholds

## Best Practices

1. **Sample Rates**: Start with low sample rates (0.1) to avoid quota limits
2. **Environment**: Use different DSNs for dev/staging/production
3. **User Context**: Set user context after authentication
4. **Error Context**: Add relevant context when capturing errors
5. **Ignore Noisy Errors**: Add common non-critical errors to ignore list

## Free Tier Limits

- **5,000 events/month**: Error events
- **10,000 transactions/month**: Performance monitoring
- **Unlimited projects**: Create as many projects as needed
- **30 days retention**: Error history kept for 30 days

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN**: Verify `SENTRY_DSN` is set correctly
2. **Check Console**: Look for Sentry initialization messages
3. **Check Network**: Ensure Sentry API is accessible
4. **Check Quota**: Verify you haven't exceeded free tier limits

### Too Many Events

1. **Reduce Sample Rate**: Lower `SENTRY_TRACES_SAMPLE_RATE`
2. **Add Ignore Rules**: Filter out noisy errors
3. **Upgrade Plan**: Consider paid plan for higher limits

### Missing Context

1. **Set User Context**: Call `setUser()` after login
2. **Add Context**: Include relevant data when capturing errors
3. **Check Filters**: Ensure context isn't being filtered out

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node.js Guide](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Sentry React Guide](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Pricing](https://sentry.io/pricing/)

## Support

For issues with:
- **Sentry Service**: Visit [Sentry Support](https://sentry.io/support/)
- **Integration**: Check server/frontend console logs for initialization messages

