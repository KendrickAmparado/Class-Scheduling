# Reschedule Error Fix - MVCC Integration

## Problem
Users were getting the error: **"Error rescheduling. Check conflicts or server logs."** when attempting to reschedule a class.

## Root Cause
After implementing MVCC (Multi-Version Concurrency Control) with optimistic locking, the Schedule model was configured with:
- `versionKey: '__v'` - Mongoose auto-versioning
- `optimisticConcurrency: true` - Enables version checking on saves

However:
1. **Frontend issue**: The `applyReschedule()` function in `ScheduleManagementDetails.jsx` was NOT sending the current `version` (`__v` field) with the update request
2. **Backend issue**: The PUT `/api/schedule/:id` endpoint was not validating the version field before updating, causing silent version mismatches

## Solution Applied

### 1. Frontend Update (`react-frontend/src/components/admin/ScheduleManagementDetails.jsx`)
**Modified:** `applyReschedule()` function (line 671)

```javascript
const applyReschedule = async (suggestion) => {
  if (!rescheduleModal.schedule) return;
  setRescheduleModal(prev => ({ ...prev, loading: true }));
  try {
    const schedule = rescheduleModal.schedule;
    const update = {
      day: suggestion.day,
      time: suggestion.time,
      room: suggestion.room,
      version: schedule.__v, // ✅ NOW SENDING VERSION
    };
    const res = await axios.put(`http://localhost:5000/api/schedule/${schedule._id}`, update);
    // ... rest of handler
```

**What changed:**
- Extracted `rescheduleModal.schedule` to local `schedule` variable for clarity
- Added `version: schedule.__v` to the update payload
- This ensures the server receives the current version for MVCC validation

### 2. Backend Update (`backend/routes/scheduleRoutes.js`)
**Modified:** PUT `/:id` endpoint (line 419)

```javascript
router.put('/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    // ✅ NOW EXTRACTING VERSION FROM REQUEST
    const { course, year, section, subject, instructor, instructorEmail, day, time, room, version } = req.body;

    const existingSchedule = await Schedule.findById(scheduleId);
    if (!existingSchedule) {
      return res.status(404).json({ success: false, message: "Schedule not found." });
    }

    // ✅ NEW: MVCC Version check
    if (version !== undefined && version !== null) {
      if (existingSchedule.__v !== version) {
        return res.status(409).json({ 
          success: false, 
          message: "Schedule was modified by another user. Please refresh and try again.",
          currentVersion: existingSchedule.__v
        });
      }
    }
    // ... rest of handler
```

**What changed:**
- Added `version` to destructured `req.body` fields
- Added explicit MVCC version validation before processing the update
- Returns HTTP 409 Conflict if versions don't match with clear error message
- Allows clients to refresh and retry with the latest version

## How It Works Now

1. **User initiates reschedule**: Frontend fetches current schedule with `__v` field
2. **Suggestions computed**: Time slots are calculated locally
3. **User confirms reschedule**: Frontend sends update with `version: __v`
4. **Server validates**: PUT endpoint checks if `__v` matches database version
5. **Two possible outcomes**:
   - ✅ **Match**: Update succeeds, Mongoose auto-increments `__v`, and save completes
   - ❌ **Mismatch**: Returns 409 Conflict - user sees "modified by another user" message and can retry

## Testing the Fix

### Test 1: Basic Reschedule (Happy Path)
1. Navigate to Schedule Management
2. Click "Reschedule" on any schedule
3. Click any suggestion in the modal
4. Should see: "Schedule rescheduled successfully!"

### Test 2: Concurrent Modification (Conflict Detection)
1. Open Schedule Management in two browser windows (Admin A and Admin B)
2. Admin A reschedules Schedule X to Day 1, 9:00 AM
3. Admin B (without refreshing) tries to reschedule Schedule X to Day 2, 2:00 PM
4. Admin B should see: "Schedule was modified by another user. Please refresh and try again."
5. Admin B refreshes and can retry with latest version

### Test 3: Reschedule with Room/Instructor Conflict
1. Attempt to reschedule to a time slot with existing room/instructor conflict
2. Should see: "Room X is occupied at Day Y" or "Instructor X already has a schedule"
3. Modal remains open with suggestions refreshed

## Files Modified
- ✅ `react-frontend/src/components/admin/ScheduleManagementDetails.jsx` - Added version to reschedule payload
- ✅ `backend/routes/scheduleRoutes.js` - Added MVCC version validation to PUT handler

## MVCC Integration Status
- ✅ Schedule model: Configured with versioning
- ✅ Edit schedule: Already had version validation (uses same PUT endpoint)
- ✅ Reschedule: NOW HAS version validation (this fix)
- ✅ Add schedule: Uses POST endpoint (no version needed for new records)

## Related Files (For Reference)
- `backend/middleware/mvccTransaction.js` - MVCC utilities and conflict handler
- `backend/utils/mvccManager.js` - MVCC transaction management
- `backend/routes/mvccScheduleRoutes.js` - Alternative MVCC-specific endpoints (if stricter control needed)
