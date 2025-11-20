# MVCC Integration Guide for Server

## Quick Integration Steps

### Step 1: Import MVCC Routes in `server.js`

```javascript
// Add these imports at the top of your server.js file
import mvccScheduleRoutes from './routes/mvccScheduleRoutes.js';
import mvccSectionRoutes from './routes/mvccSectionRoutes.js';
import mvccRoomRoutes from './routes/mvccRoomRoutes.js';
import mvccInstructorRoutes from './routes/mvccInstructorRoutes.js';
import { versionConflictHandler } from './middleware/mvccTransaction.js';
```

### Step 2: Register MVCC Routes

```javascript
// Add these routes after your other route registrations
// Typically around line 40-50 in server.js

app.use('/api/schedule/mvcc', mvccScheduleRoutes);
app.use('/api/section/mvcc', mvccSectionRoutes);
app.use('/api/room/mvcc', mvccRoomRoutes);
app.use('/api/instructor/mvcc', mvccInstructorRoutes);
```

### Step 3: Register Error Handling Middleware

```javascript
// Add this BEFORE your 500 error handler
// This should be near the end of your middleware stack

app.use(versionConflictHandler);

// Your existing 500 error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});
```

### Step 4: Verify Models Are Updated

Ensure your models have the updated schema:
- `backend/models/Schedule.js` ✓
- `backend/models/Section.js` ✓
- `backend/models/Room.js` ✓
- `backend/models/Instructor.js` ✓

All models should include:
```javascript
{ 
  timestamps: true,
  versionKey: '__v',
  optimisticConcurrency: true
}
```

## Complete server.js Integration Example

```javascript
// ... existing imports ...
import mvccScheduleRoutes from './routes/mvccScheduleRoutes.js';
import mvccSectionRoutes from './routes/mvccSectionRoutes.js';
import mvccRoomRoutes from './routes/mvccRoomRoutes.js';
import mvccInstructorRoutes from './routes/mvccInstructorRoutes.js';
import { versionConflictHandler } from './middleware/mvccTransaction.js';

// ... existing setup ...

// ============== MVCC ROUTES ==============
app.use('/api/schedule/mvcc', mvccScheduleRoutes);
app.use('/api/section/mvcc', mvccSectionRoutes);
app.use('/api/room/mvcc', mvccRoomRoutes);
app.use('/api/instructor/mvcc', mvccInstructorRoutes);

// ============== ERROR HANDLING ==============
app.use(versionConflictHandler);

// 500 error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// ... rest of server.js ...
```

## Testing the MVCC Endpoints

### Test 1: Create Schedule with MVCC
```bash
curl -X POST http://localhost:5000/api/schedule/mvcc/create-mvcc \
  -H "Content-Type: application/json" \
  -d '{
    "course": "CS101",
    "year": "2024",
    "section": "A",
    "subject": "Data Structures",
    "instructor": "Dr. Smith",
    "instructorEmail": "smith@example.com",
    "day": "Monday",
    "time": "10:00 - 11:30",
    "room": "101"
  }'
```

### Test 2: Get Schedule Version
```bash
curl http://localhost:5000/api/schedule/mvcc/[SCHEDULE_ID]/version
```

### Test 3: Update with Optimistic Locking
```bash
curl -X PUT http://localhost:5000/api/schedule/mvcc/[SCHEDULE_ID]/update-mvcc \
  -H "Content-Type: application/json" \
  -d '{
    "version": 0,
    "course": "CS101",
    "year": "2024",
    "section": "B",
    "subject": "Updated Subject",
    "instructor": "Dr. Johnson",
    "instructorEmail": "johnson@example.com",
    "day": "Tuesday",
    "time": "14:00 - 15:30",
    "room": "102"
  }'
```

### Test 4: Check Concurrency Stats
```bash
curl http://localhost:5000/api/schedule/mvcc/stats/concurrency
```

## Endpoint Reference

### Schedule Routes
- `POST /api/schedule/mvcc/create-mvcc` - Create schedule
- `PUT /api/schedule/mvcc/:id/update-mvcc` - Update schedule
- `GET /api/schedule/mvcc/:id/version` - Get version info
- `POST /api/schedule/mvcc/bulk/create-mvcc` - Bulk create
- `GET /api/schedule/mvcc/stats/concurrency` - Concurrency stats

### Section Routes
- `POST /api/section/mvcc/create-mvcc` - Create section
- `PUT /api/section/mvcc/:id/update-mvcc` - Update section
- `GET /api/section/mvcc/:id/version` - Get version info
- `POST /api/section/mvcc/bulk/update-mvcc` - Bulk update
- `DELETE /api/section/mvcc/:id/with-cascade-mvcc` - Delete with cascade
- `GET /api/section/mvcc/stats/concurrency` - Concurrency stats

### Room Routes
- `POST /api/room/mvcc/create-mvcc` - Create room
- `PUT /api/room/mvcc/:id/status-mvcc` - Update room status
- `PUT /api/room/mvcc/:id/update-mvcc` - Update room details
- `GET /api/room/mvcc/:id/version` - Get version info
- `POST /api/room/mvcc/:id/check-availability` - Check availability
- `GET /api/room/mvcc/:id/conflicts` - Get conflicts
- `POST /api/room/mvcc/bulk/status-mvcc` - Bulk update status
- `GET /api/room/mvcc/stats/concurrency` - Concurrency stats

### Instructor Routes
- `PUT /api/instructor/mvcc/:id/update-mvcc` - Update instructor
- `PATCH /api/instructor/mvcc/:id/assign-mvcc` - Assign instructor
- `GET /api/instructor/mvcc/:id/version` - Get version info
- `POST /api/instructor/mvcc/bulk/assign-mvcc` - Bulk assign
- `GET /api/instructor/mvcc/:id/conflicts` - Check conflicts
- `POST /api/instructor/mvcc/:id/resolve-conflicts` - Resolve conflicts
- `GET /api/instructor/mvcc/stats/concurrency` - Concurrency stats

## Troubleshooting

### Issue: "Cannot find module mvccScheduleRoutes"
**Solution**: Ensure all route files are in the correct location:
```
backend/routes/
├── mvccScheduleRoutes.js
├── mvccSectionRoutes.js
├── mvccRoomRoutes.js
└── mvccInstructorRoutes.js
```

### Issue: Version conflict errors on all updates
**Solution**: Ensure client is sending current version:
```javascript
// ✓ Correct - includes version from GET /version endpoint
{ "version": 5, "subject": "New", ... }

// ✗ Wrong - hardcoded or missing version
{ "subject": "New", ... }
```

### Issue: 409 Conflict on duplicate section creation
**Solution**: This is expected behavior - MVCC prevented a race condition
- Check if section already exists
- Use different name or course/year combination

### Issue: "Cannot set room to maintenance: X active schedules exist"
**Solution**: This is expected behavior - prevents maintenance during active bookings
- Wait for schedules to be archived
- Reassign schedules to different room
- Mark as complete and archive

## Performance Monitoring

### Monitor High-Conflict Endpoints
```javascript
// Add to your monitoring system
async function checkConflictRates() {
  const scheduleStats = await fetch('/api/schedule/mvcc/stats/concurrency').then(r => r.json());
  const roomStats = await fetch('/api/room/mvcc/stats/concurrency').then(r => r.json());
  
  // Alert if version > 50 (high modification rate)
  if (scheduleStats.stats.versionDistribution.some(v => v._id > 50)) {
    console.warn('High schedule modification rate detected');
  }
}
```

## Migration Strategy

### Phase 1: Deploy MVCC (Current)
- Add MVCC routes and models
- Keep original endpoints functional
- Enable parallel operation

### Phase 2: Update Clients (Next)
- Gradually update React components
- Use MVCC endpoints for new features
- Maintain backward compatibility

### Phase 3: Deprecate Old Endpoints (Later)
- Mark original endpoints as deprecated
- Provide migration window
- Eventually remove old endpoints

## Support & Documentation

For complete documentation, see:
- `MVCC_IMPLEMENTATION_GUIDE.md` - Complete API reference
- `MVCC_IMPLEMENTATION_SUMMARY.md` - Implementation overview

For issues or questions:
1. Check the error response for the error code
2. Refer to error handling section in MVCC_IMPLEMENTATION_GUIDE.md
3. Review example requests in Testing section above
