# Room Status Notification System - Debugging Guide

## Problem
Instructors are not receiving notifications when admin changes room status.

## Implementation Overview

### Backend Changes
- **File**: `backend/routes/roomRoutes.js`
- **Logic**: When a room's status is updated (available → maintenance → occupied), the system emits a `room-status-changed` Socket.io event
- **Event Data**:
  ```javascript
  {
    roomId: string,
    roomName: string,
    area: string,
    newStatus: string,
    oldStatus: string,
    message: string,
    timestamp: Date
  }
  ```

### Frontend Changes
- **File**: `react-frontend/src/components/instructor/InstructorDashboard.jsx`
- **Logic**: Establishes Socket.io connection and listens for `room-status-changed` events
- **Action**: Shows toast notification to instructor

## How to Test

### Step 1: Check Backend Logs
1. Open browser console (F12)
2. Go to terminal running the backend server
3. When you update a room status, you should see:
   ```
   📢 Broadcasting room status change: {...}
   ```

### Step 2: Test with Test Endpoint
1. Make sure instructor dashboard is open in browser
2. Check browser console (F12) for Socket.io logs
3. Trigger test notification manually:
   ```
   GET http://localhost:5000/api/rooms/test/notify-status-change
   ```
4. You should see:
   - Backend logs: "🧪 Testing room status change notification..."
   - Browser console: "📢 Room status changed event received: {...}"
   - Toast notification on screen

### Step 3: Test with Real Room Update
1. Open Room Management page as admin
2. Open Instructor Dashboard in another tab/window
3. In Room Management: Edit a room and change status (e.g., available → maintenance)
4. Click Save
5. Check browser console in Instructor Dashboard
6. You should see:
   - Connection log: "✅ Connected to server for notifications"
   - Event log: "📢 Room status changed event received: {...}"
   - Toast notification: "The room [name] is currently on maintenance."

## Console Logs to Look For

### Backend (Terminal)
```
📢 Broadcasting room status change: {roomId, roomName, area, newStatus, oldStatus, message, timestamp}
```

### Frontend (Browser Console)
```
✅ Connected to server for notifications
📢 Room status changed event received: {...}
❌ Socket.io connection error: [error details if any]
```

## Common Issues and Solutions

### Issue 1: "Connected to server" logs missing
- **Cause**: Socket.io not connecting properly
- **Solution**: 
  - Check if backend is running on port 5000
  - Verify CORS is enabled in Socket.io (it is: `cors: { origin: '*' }`)
  - Check browser Network tab for WebSocket connection

### Issue 2: Room update successful but no notification
- **Cause**: Status change detection might be failing
- **Solution**:
  - Verify old status is different from new status
  - Check backend logs for "📢 Broadcasting" message
  - Try test endpoint to confirm Socket.io is working

### Issue 3: Toast notification not showing
- **Cause**: ToastProvider might not be working
- **Solution**:
  - Test toast manually in console: `showToast('test', 'info')`
  - Check if ToastProvider is wrapping the app

## Socket.io Connection Details
- **Server**: `http://localhost:5000`
- **CORS**: Enabled for all origins
- **Event**: `room-status-changed`
- **Broadcast**: To all connected clients (`io.emit()`)

## Files Modified
1. `backend/routes/roomRoutes.js` - Added Socket.io event emission
2. `backend/server.js` - Socket.io already configured
3. `react-frontend/src/components/instructor/InstructorDashboard.jsx` - Added Socket.io listener

## Expected User Flow
1. Instructor opens dashboard
2. Socket.io connects automatically
3. Admin changes room status in Room Management
4. All connected instructors see toast notification immediately

