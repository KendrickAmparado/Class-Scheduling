# Room Status Notification System - Complete Implementation

## Overview
When an admin changes a room's status (available → maintenance → occupied), all active instructors receive a **persistent notification** stored in the database that appears in their **Notifications page**.

## System Flow

### 1. Admin Changes Room Status
- Admin goes to **Room Management**
- Edit a room and change its status (e.g., available → maintenance)
- Click "Save"

### 2. Backend Processing
**File**: `backend/routes/roomRoutes.js` - PUT `/:id` endpoint

When status changes:
1. **Database Save**: Creates notification for each active instructor
   ```javascript
   await InstructorNotification.insertMany([
     { 
       instructorEmail: 'instructor1@example.com',
       title: 'Room Status Updated: Lab A',
       message: 'The room Lab A is currently on maintenance.',
       link: '/instructor/rooms',
       read: false
     },
     // ... for each active instructor
   ])
   ```

2. **Real-time Broadcast**: Sends Socket.io event to all connected instructors
   ```javascript
   req.io.emit('room-status-changed', {
     roomId, roomName, area, newStatus, oldStatus, message, timestamp
   })
   ```

### 3. Instructor Receives Notification
**Option A: Notification Page (Primary)**
- Instructor opens **Notifications** page
- **Socket.io event triggers page refresh**
- New room notification appears at the top of the list
- Shows: Room Status Updated, room name, and status message
- Can mark as read/unread
- Persists in database until deleted

**Option B: Dashboard (Secondary)**
- If instructor is on **Dashboard**, they see a toast notification
- Notification still gets saved to database
- Can view it later on Notifications page

## Database Schema

**InstructorNotification Model**
```javascript
{
  instructorEmail: String,       // Email of instructor
  title: String,                 // "Room Status Updated: Lab A"
  message: String,               // "The room Lab A is currently on maintenance."
  link: String,                  // "/instructor/rooms"
  read: Boolean,                 // false (default)
  createdAt: Date,               // Timestamp
  updatedAt: Date                // Timestamp
}
```

## Key Features

✅ **Persistent**: Notifications stored in database
✅ **Real-time**: Socket.io broadcasts immediately 
✅ **Read/Unread**: Mark as read from notifications page
✅ **Paginated**: Supports pagination on notifications page
✅ **Filtered**: Can filter by read/unread status
✅ **For All Active Instructors**: Automatically creates notification for each active instructor
✅ **User-friendly Links**: Notifications can link to relevant pages

## User Experience

### Timeline
1. Admin updates room status
2. ✅ Backend processes and saves notifications (< 1 second)
3. ✅ Socket.io broadcasts event (< 100ms)
4. ✅ Instructor's notification page refreshes automatically (if open)
5. ✅ Instructor sees toast notification (if on dashboard)
6. ✅ Notification appears in database permanently

### Notification Page Features
- **Sort by**: Most recent first
- **Filter by**: All / Unread / Read
- **Pagination**: 20 notifications per page
- **Unread Count**: Shows total unread notifications
- **Mark as Read**: Individual or mark all
- **Delete**: Remove notifications (optional feature)

## Files Modified

### Backend
- `backend/routes/roomRoutes.js`
  - Added `InstructorNotification` import
  - Added `Instructor` model import
  - Updated PUT `/:id` endpoint to save notifications to database
  - Added console logging for debugging

### Frontend
- `react-frontend/src/components/instructor/InstructorNotifications.jsx`
  - Added `socket.io-client` import
  - Added Socket.io connection in useEffect
  - Listen for `room-status-changed` event
  - Auto-refresh notifications when event received
  - Show toast notification

- `react-frontend/src/components/instructor/InstructorDashboard.jsx`
  - Added Socket.io listener (keeps existing toast behavior)

## Testing

### Test 1: Verify Notifications Save to Database
```
1. Open Notifications page
2. Go to Room Management
3. Change a room status
4. Check Notifications page - should show new notification at top
5. Notification should not disappear after refresh
```

### Test 2: Verify Real-time Update
```
1. Open Notifications page in one tab
2. Open Room Management in another tab
3. Change a room status
4. Watch Notifications tab - should refresh automatically
```

### Test 3: Verify Mark as Read
```
1. Go to Notifications page
2. See unread room notification
3. Click notification - mark as read
4. Notification appears in read list
5. Unread count decreases
```

### Test 4: Multiple Instructors
```
1. Open Notifications on 2+ instructor accounts (different windows)
2. Change room status in Room Management
3. Both instructors should receive notifications
```

## Console Logs to Monitor

### Backend (Terminal)
```
📢 Broadcasting room status change: {roomId, roomName, area, ...}
✅ Saved room notification to 5 instructors
```

### Frontend (Browser Console)
```
✅ Connected to server for real-time notifications
📢 Room status changed event received - refreshing notifications
```

## Future Enhancements

- [ ] Add notification preferences (which types to receive)
- [ ] Add bulk delete for notifications
- [ ] Add notification categories (room, schedule, system, etc.)
- [ ] Add email notifications
- [ ] Add notification badges on sidebar
- [ ] Add search within notifications

## Status Messages by Room Status

| Status | Message |
|--------|---------|
| maintenance | "The room {name} is currently on maintenance." |
| available | "The room {name} is now available." |
| occupied | "The room {name} is now occupied." |

