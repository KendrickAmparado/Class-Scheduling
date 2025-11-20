# MVCC (Multi-Version Concurrency Control) Implementation Guide

## Overview

This system implements **Optimistic Locking** with **Multi-Version Concurrency Control** to prevent race conditions and data conflicts in concurrent operations across four critical areas:

1. **Schedule Conflicts** - Prevent multiple admins from creating overlapping schedules
2. **Section Management** - Handle concurrent section creation and updates
3. **Room Management** - Prevent double-booking of rooms
4. **Instructor Assignments** - Handle concurrent instructor profile and assignment updates

## Architecture

### Version Tracking
- All models (Schedule, Section, Room, Instructor) include MongoDB's `__v` field
- Automatically incremented on each update
- Client sends current version; server validates before applying changes
- Mismatch triggers `409 Conflict` response

### Optimistic Locking Pattern
```javascript
// Client fetches document with version
GET /api/schedule/:id/version
→ { _id, __v: 5, course, year, section, ... }

// Client modifies and sends back with version
PUT /api/schedule/:id/update-mvcc
Body: { version: 5, course: "CS101", ... }

// Server checks: if current __v !== 5 → Version conflict
// If match: update and increment __v to 6
```

### Retry Logic
- Transient conflicts handled with exponential backoff
- Up to 3 automatic retries (100ms, 200ms, 400ms delays)
- Preserves data consistency while allowing eventual success

## File Structure

### Core Files
```
backend/
├── utils/
│   └── mvccManager.js          # MVCC operations and conflict detection
├── middleware/
│   └── mvccTransaction.js      # Transaction handling and retry logic
└── routes/
    ├── mvccScheduleRoutes.js   # Schedule MVCC endpoints
    ├── mvccSectionRoutes.js    # Section MVCC endpoints
    ├── mvccRoomRoutes.js       # Room MVCC endpoints
    └── mvccInstructorRoutes.js # Instructor MVCC endpoints
```

### Updated Models
```
backend/models/
├── Schedule.js      # Added: __v versioning, indexes
├── Section.js       # Added: __v versioning, indexes
├── Room.js          # Added: __v versioning, indexes
└── Instructor.js    # Added: __v versioning, indexes
```

## API Endpoints

### Schedule Management (MVCC)

#### Create Schedule with Validation
```http
POST /api/schedule/create-mvcc
Content-Type: application/json

{
  "course": "CS101",
  "year": "2024",
  "section": "A",
  "subject": "Data Structures",
  "instructor": "Dr. Smith",
  "instructorEmail": "smith@university.edu",
  "day": "Monday",
  "time": "10:00 - 11:30",
  "room": "101"
}

Response:
{
  "success": true,
  "schedule": {
    "_id": "...",
    "__v": 0,
    "course": "CS101",
    ...
  },
  "transaction": {
    "transactionId": "txn_...",
    "status": "committed",
    "operationCount": 1
  }
}
```

#### Update Schedule with Optimistic Locking
```http
PUT /api/schedule/:id/update-mvcc
Content-Type: application/json

{
  "version": 5,
  "course": "CS101",
  "year": "2024",
  "section": "A",
  "subject": "Data Structures",
  "instructor": "Dr. Smith",
  "instructorEmail": "smith@university.edu",
  "day": "Tuesday",
  "time": "14:00 - 15:30",
  "room": "102"
}

Response on Success:
{
  "success": true,
  "schedule": { ... },
  "transaction": { ... }
}

Response on Version Conflict (409):
{
  "success": false,
  "message": "Concurrent update detected. Please refresh and try again.",
  "code": "VERSION_CONFLICT"
}
```

#### Get Schedule Version
```http
GET /api/schedule/:id/version

Response:
{
  "success": true,
  "schedule": {
    "_id": "...",
    "__v": 5,
    "course": "CS101",
    "year": "2024",
    ...
  }
}
```

#### Bulk Create Schedules
```http
POST /api/schedule/bulk/create-mvcc
Content-Type: application/json

{
  "schedules": [
    { "course": "CS101", "year": "2024", ... },
    { "course": "CS102", "year": "2024", ... }
  ]
}

Response:
{
  "success": true,
  "created": 2,
  "failed": 0,
  "schedules": [ ... ],
  "transaction": { ... }
}
```

#### Concurrency Statistics
```http
GET /api/schedule/stats/concurrency

Response:
{
  "success": true,
  "stats": {
    "totalSchedules": 150,
    "recentlyModified": 12,
    "versionDistribution": [
      { "_id": 0, "count": 5 },
      { "_id": 1, "count": 12 },
      { "_id": 2, "count": 15 }
    ]
  }
}
```

### Section Management (MVCC)

#### Create Section with Duplicate Detection
```http
POST /api/section/create-mvcc
Content-Type: application/json

{
  "course": "CS101",
  "year": "2024",
  "name": "A"
}

Response on Conflict (409):
{
  "success": false,
  "message": "Section A already exists in CS101 2024",
  "code": "DUPLICATE_SECTION"
}
```

#### Update Section with Optimistic Locking
```http
PUT /api/section/:id/update-mvcc
Content-Type: application/json

{
  "version": 3,
  "course": "CS101",
  "year": "2024",
  "name": "B"
}
```

#### Delete Section with Cascade
```http
DELETE /api/section/:id/with-cascade-mvcc

Response:
{
  "success": true,
  "section": { ... },
  "schedulesDeleted": 5,
  "transaction": { ... }
}
```

#### Bulk Update Sections
```http
POST /api/section/bulk/update-mvcc
Content-Type: application/json

{
  "sections": [
    { "_id": "...", "__v": 2, "course": "CS101", "year": "2024", "name": "A" },
    { "_id": "...", "__v": 1, "course": "CS102", "year": "2024", "name": "B" }
  ]
}
```

### Room Management (MVCC)

#### Create Room with Duplicate Prevention
```http
POST /api/room/create-mvcc
Content-Type: application/json

{
  "room": "101",
  "area": "Building A",
  "status": "available"
}

Response on Conflict (409):
{
  "success": false,
  "message": "Room 101 already exists",
  "code": "DUPLICATE_ROOM"
}
```

#### Update Room Status with Validation
```http
PUT /api/room/:id/status-mvcc
Content-Type: application/json

{
  "version": 4,
  "status": "maintenance",
  "reason": "HVAC repair"
}

Response on Active Schedules (409):
{
  "success": false,
  "message": "Cannot set room to maintenance: 3 active schedules exist",
  "code": "ACTIVE_SCHEDULES"
}
```

#### Check Room Availability
```http
POST /api/room/:id/check-availability
Content-Type: application/json

{
  "day": "Monday",
  "timeStart": "10:00",
  "timeEnd": "11:30"
}

Response:
{
  "success": true,
  "room": "101",
  "day": "Monday",
  "available": true,
  "conflicts": 0,
  "conflictingSchedules": []
}
```

#### Get Room Booking Conflicts
```http
GET /api/room/:id/conflicts

Response:
{
  "success": true,
  "room": "101",
  "status": "available",
  "totalSchedules": 5,
  "schedulesByDay": {
    "Monday": [
      { "_id": "...", "subject": "CS101", "instructor": "Dr. Smith", "time": "10:00 - 11:30" }
    ]
  }
}
```

#### Bulk Update Room Status
```http
POST /api/room/bulk/status-mvcc
Content-Type: application/json

{
  "rooms": [
    { "_id": "...", "__v": 2, "status": "maintenance" },
    { "_id": "...", "__v": 3, "status": "available" }
  ]
}
```

### Instructor Management (MVCC)

#### Update Instructor with Email Conflict Detection
```http
PUT /api/instructor/:id/update-mvcc
Content-Type: application/json

{
  "version": 5,
  "firstname": "John",
  "lastname": "Smith",
  "email": "john.smith@university.edu",
  "department": "CS",
  "status": "active"
}

Response on Email Conflict (409):
{
  "success": false,
  "message": "Email john.smith@university.edu is already in use",
  "code": "EMAIL_CONFLICT"
}
```

#### Assign Instructor (Partial Update)
```http
PATCH /api/instructor/:id/assign-mvcc
Content-Type: application/json

{
  "version": 3,
  "departmentAssignment": "Computer Science",
  "status": "active"
}
```

#### Get Instructor Schedule Conflicts
```http
GET /api/instructor/:id/conflicts

Response:
{
  "success": true,
  "instructor": {
    "_id": "...",
    "name": "Dr. Smith",
    "totalSchedules": 6,
    "conflicts": 1,
    "conflictDetails": [
      {
        "schedule1": { "_id": "...", "subject": "CS101", "time": "10:00 - 11:30" },
        "schedule2": { "_id": "...", "subject": "CS102", "time": "10:00 - 11:30" }
      }
    ]
  }
}
```

#### Resolve Instructor Conflicts
```http
POST /api/instructor/:id/resolve-conflicts
Content-Type: application/json

{
  "scheduleIdToKeep": "...",
  "newInstructorForOther": "Dr. Johnson"
}
```

#### Bulk Assign Instructors
```http
POST /api/instructor/bulk/assign-mvcc
Content-Type: application/json

{
  "instructors": [
    { "_id": "...", "__v": 2, "department": "CS", "status": "active" },
    { "_id": "...", "__v": 1, "department": "MATH", "status": "active" }
  ]
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 201 | Created | Successful creation |
| 200 | OK | Successful operation |
| 400 | Bad Request | Missing version field, invalid status |
| 404 | Not Found | Document doesn't exist |
| 409 | Conflict | Version mismatch, duplicate name, active schedules |
| 500 | Server Error | Database or processing error |

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional context if available"
}
```

### Common Error Codes
- `VERSION_CONFLICT` - Document was modified by another user
- `DUPLICATE_SECTION` - Section name already exists
- `DUPLICATE_ROOM` - Room name already exists
- `EMAIL_CONFLICT` - Email already in use
- `CONFLICT_DETECTED` - Schedule/room/instructor conflict
- `VALIDATION_ERROR` - Missing required fields
- `ACTIVE_SCHEDULES` - Cannot perform action with active schedules

## Client Implementation Guide

### Using Optimistic Locking

```javascript
// 1. Fetch current version
const response = await fetch(`/api/schedule/${scheduleId}/version`);
const data = await response.json();
const currentVersion = data.schedule.__v;

// 2. Modify locally
const updatedSchedule = {
  ...data.schedule,
  subject: "New Subject"
};

// 3. Submit with version
const updateResponse = await fetch(`/api/schedule/${scheduleId}/update-mvcc`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    version: currentVersion,
    course: updatedSchedule.course,
    year: updatedSchedule.year,
    // ... other fields
  })
});

// 4. Handle conflict
if (updateResponse.status === 409) {
  const error = await updateResponse.json();
  if (error.code === 'VERSION_CONFLICT') {
    alert('This document was modified. Please refresh and try again.');
    // Fetch latest version and retry
  }
}
```

### Handling Retries on Frontend

```javascript
async function updateWithAutoRetry(scheduleId, updates, maxAttempts = 3) {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      // Fetch latest version
      const versionRes = await fetch(`/api/schedule/${scheduleId}/version`);
      const { schedule } = await versionRes.json();
      
      // Attempt update
      const updateRes = await fetch(`/api/schedule/${scheduleId}/update-mvcc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: schedule.__v,
          ...updates
        })
      });
      
      if (updateRes.ok) {
        return await updateRes.json();
      }
      
      if (updateRes.status === 409) {
        attempt++;
        const delay = Math.pow(2, attempt) * 100; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error(`HTTP ${updateRes.status}`);
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      attempt++;
    }
  }
}
```

## Monitoring and Debugging

### Check Concurrency Statistics
```bash
# Schedule concurrency stats
curl http://localhost:5000/api/schedule/stats/concurrency

# Room concurrency stats
curl http://localhost:5000/api/room/stats/concurrency

# Section concurrency stats
curl http://localhost:5000/api/section/stats/concurrency

# Instructor concurrency stats
curl http://localhost:5000/api/instructor/stats/concurrency
```

### Understand Version Distribution
High `__v` values indicate frequently modified documents:
- Version 0-2: Newly created, rarely modified
- Version 3-10: Regular updates
- Version 20+: Hot documents with frequent changes (may need optimization)

### Transaction Audit Trail
Every MVCC operation includes transaction information:
```json
{
  "transaction": {
    "transactionId": "txn_1234567890_abc123def456",
    "userId": "admin-1",
    "operation": "schedule_update",
    "startTime": "2024-01-15T10:30:00Z",
    "endTime": "2024-01-15T10:30:00.045Z",
    "duration": 45,
    "operationCount": 1,
    "operations": [
      {
        "documentId": "...",
        "action": "update",
        "version": 6,
        "timestamp": "2024-01-15T10:30:00.040Z",
        "result": { ... }
      }
    ]
  }
}
```

## Best Practices

1. **Always Fetch Version Before Update**: Never hardcode version numbers
2. **Implement Retry Logic**: Handle transient conflicts gracefully
3. **Show User Feedback**: Inform users when conflicts occur
4. **Monitor Statistics**: Track version distribution for performance
5. **Use Bulk Operations**: For multiple related changes
6. **Validate Constraints**: Check conflicts early before attempting updates
7. **Log Transactions**: Store transaction IDs for audit trails
8. **Handle Errors Gracefully**: Catch 409 Conflict responses and retry

## Performance Considerations

- **Indexes**: All critical fields are indexed for fast lookups
- **Exponential Backoff**: Reduces thundering herd on high contention
- **Bulk Operations**: More efficient than individual updates
- **Version Caching**: Keep client-side copies of document versions

## Migration Path

To add MVCC to existing endpoints:

1. **For new code**: Use MVCC routes (e.g., `/create-mvcc`, `/update-mvcc`)
2. **For existing code**: Keep original routes functional during transition
3. **For clients**: Update to send version field
4. **For monitoring**: Add transaction logging

## Future Enhancements

- [ ] Distributed transaction support across services
- [ ] Conflict-free replicated data types (CRDTs) for specific fields
- [ ] Optimistic UI updates with rollback
- [ ] Real-time conflict notifications via WebSocket
- [ ] Automated conflict resolution strategies
- [ ] Audit log persistence with change history
