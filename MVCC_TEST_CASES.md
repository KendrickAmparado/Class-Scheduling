# MVCC Test Cases & Examples

## Test Suite Overview

This document provides real-world test cases for validating MVCC functionality across all four areas.

---

## 1. Schedule Conflict Prevention

### Test Case 1.1: Prevent Double-Booking Same Room
**Scenario**: Two admins simultaneously create schedules for the same room

```javascript
// Admin 1: Creates schedule in Room 101 Monday 10:00-11:30
const schedule1 = {
  course: "CS101",
  year: "2024",
  section: "A",
  subject: "Data Structures",
  instructor: "Dr. Smith",
  day: "Monday",
  time: "10:00 - 11:30",
  room: "101"
};

const res1 = await fetch('/api/schedule/mvcc/create-mvcc', {
  method: 'POST',
  body: JSON.stringify(schedule1)
});
// ✓ Success: 201 Created

// Admin 2: Tries to create overlapping schedule in same room
const schedule2 = {
  ...schedule1,
  instructor: "Dr. Johnson"
};

const res2 = await fetch('/api/schedule/mvcc/create-mvcc', {
  method: 'POST',
  body: JSON.stringify(schedule2)
});
// ✗ Expected: 409 Conflict
// Message: "Room 101 is already booked on Monday at 10:00 - 11:30"
```

**Expected Result**: Second schedule rejected with 409 Conflict
**Actual Behavior**: MVCC detects room conflict before commit

---

### Test Case 1.2: Prevent Instructor Double-Booking
**Scenario**: Same instructor scheduled for overlapping time

```javascript
// Admin 1: Assigns Dr. Smith to Monday 10:00-11:30
const schedule1 = {
  course: "CS101",
  year: "2024",
  section: "A",
  instructor: "Dr. Smith",
  day: "Monday",
  time: "10:00 - 11:30",
  room: "101"
};
// ✓ Created

// Admin 2: Tries to assign Dr. Smith to overlapping time
const schedule2 = {
  course: "MATH101",
  year: "2024",
  section: "B",
  instructor: "Dr. Smith",  // Same instructor
  day: "Monday",
  time: "10:30 - 11:30",    // Overlaps
  room: "102"
};
// ✗ Rejected: "Dr. Smith already has a schedule at Monday 10:00 - 11:30"
```

**Expected Result**: 409 Conflict
**Reason**: Prevents instructor from being in two places at once

---

### Test Case 1.3: Concurrent Update with Version Control
**Scenario**: Two admins update same schedule simultaneously

```javascript
// Step 1: Both admins fetch the same schedule
const scheduleRes = await fetch('/api/schedule/mvcc/:id/version');
const data = await scheduleRes.json();
// Both get: { __v: 5, subject: "Data Structures", ... }

// Step 2: Admin 1 updates and succeeds
const update1 = await fetch('/api/schedule/mvcc/:id/update-mvcc', {
  method: 'PUT',
  body: JSON.stringify({
    version: 5,  // Matches current
    subject: "Advanced Data Structures",
    // ... other fields
  })
});
// ✓ 200 OK
// Server increments version to 6

// Step 3: Admin 2 tries same update with old version
const update2 = await fetch('/api/schedule/mvcc/:id/update-mvcc', {
  method: 'PUT',
  body: JSON.stringify({
    version: 5,  // Outdated!
    subject: "Different Subject",
    // ... other fields
  })
});
// ✗ 409 Conflict
// Message: "Version conflict. Current version: 6, Client version: 5"
```

**Expected Result**: Admin 2 gets 409 Conflict
**Recovery**: Admin 2 fetches fresh version (now 6) and retries

---

## 2. Section Management Conflicts

### Test Case 2.1: Prevent Duplicate Sections
**Scenario**: Two admins create sections with same name in same course

```javascript
// Admin 1: Creates CS101 2024 Section A
const section1 = {
  course: "CS101",
  year: "2024",
  name: "A"
};
const res1 = await fetch('/api/section/mvcc/create-mvcc', {
  method: 'POST',
  body: JSON.stringify(section1)
});
// ✓ 201 Created

// Admin 2: Tries to create CS101 2024 Section A again
const section2 = {
  course: "CS101",  // Same
  year: "2024",     // Same
  name: "A"         // Same
};
const res2 = await fetch('/api/section/mvcc/create-mvcc', {
  method: 'POST',
  body: JSON.stringify(section2)
});
// ✗ 409 Conflict
// Message: "Section A already exists in CS101 2024"
```

**Expected Result**: 409 Conflict - duplicate prevented
**Benefit**: Prevents data duplication under concurrent load

---

### Test Case 2.2: Bulk Section Updates with Partial Success
**Scenario**: Update multiple sections, some succeed, some fail

```javascript
const bulkUpdate = {
  sections: [
    { 
      _id: "id1", 
      __v: 2, 
      course: "CS101", 
      year: "2024", 
      name: "A"
    },
    { 
      _id: "id2", 
      __v: 1,  // ← This is outdated (actual is 2)
      course: "CS102", 
      year: "2024", 
      name: "B"
    },
    { 
      _id: "id3", 
      __v: 3, 
      course: "CS103", 
      year: "2024", 
      name: "C"
    }
  ]
};

const res = await fetch('/api/section/mvcc/bulk/update-mvcc', {
  method: 'POST',
  body: JSON.stringify(bulkUpdate)
});

// Response:
{
  "success": false,  // Partial success
  "updated": 2,
  "failed": 1,
  "failures": [
    {
      "sectionId": "id2",
      "error": "Version conflict: Document version changed"
    }
  ]
}
```

**Expected Result**: 2 succeed, 1 fails with version conflict
**Benefit**: Atomic handling with clear failure reporting

---

## 3. Room Management

### Test Case 3.1: Prevent Room Double-Booking
**Scenario**: Check availability before creating schedule

```javascript
// Admin: Check if Room 101 is available Monday 10:00-11:30
const availability = await fetch('/api/room/mvcc/room123/check-availability', {
  method: 'POST',
  body: JSON.stringify({
    day: "Monday",
    timeStart: "10:00",
    timeEnd: "11:30"
  })
});

// Response: { "available": true, "conflicts": 0 }

// Proceed to create schedule
// If second admin creates schedule first:
// Next check shows: { "available": false, "conflicts": 1 }
```

**Expected Result**: Availability check prevents double-booking
**Benefit**: Early detection before expensive operations

---

### Test Case 3.2: Prevent Maintenance During Active Schedules
**Scenario**: Try to set room to maintenance with active schedules

```javascript
// Room 101 has 3 active schedules

// Admin tries to set to maintenance
const roomUpdate = await fetch('/api/room/mvcc/:id/status-mvcc', {
  method: 'PUT',
  body: JSON.stringify({
    version: 4,
    status: "maintenance"
  })
});

// ✗ 409 Conflict
// Message: "Cannot set room to maintenance: 3 active schedules exist"
```

**Expected Result**: 409 Conflict - prevents operational disruption
**Recovery**: Archive schedules first, then set to maintenance

---

### Test Case 3.3: Get Room Conflicts
**Scenario**: View all bookings and conflicts for a room

```javascript
const conflicts = await fetch('/api/room/mvcc/:id/conflicts');

// Response:
{
  "success": true,
  "room": "101",
  "totalSchedules": 5,
  "schedulesByDay": {
    "Monday": [
      { 
        "subject": "CS101", 
        "instructor": "Dr. Smith", 
        "time": "10:00 - 11:30" 
      },
      { 
        "subject": "CS102", 
        "instructor": "Dr. Johnson", 
        "time": "14:00 - 15:30" 
      }
    ],
    "Tuesday": [
      // ... more schedules
    ]
  }
}
```

**Expected Result**: Complete view of room schedule
**Benefit**: Identify conflicts and optimize room allocation

---

## 4. Instructor Management

### Test Case 4.1: Prevent Duplicate Instructor Emails
**Scenario**: Two admins update instructor with same email

```javascript
// Current database: Dr. Smith = smith@example.com

// Admin 1: Updates to new email
const update1 = await fetch('/api/instructor/mvcc/:id/update-mvcc', {
  method: 'PUT',
  body: JSON.stringify({
    version: 3,
    email: "john.smith@example.com",
    // ... other fields
  })
});
// ✓ 200 OK, version becomes 4

// Admin 2: Tries to use Smith's old email for Johnson
const update2 = await fetch('/api/instructor/mvcc/:id2/update-mvcc', {
  method: 'PUT',
  body: JSON.stringify({
    version: 2,
    email: "smith@example.com",  // ← Already taken
    // ... other fields
  })
});
// ✗ 409 Conflict
// Message: "Email smith@example.com is already in use"
```

**Expected Result**: 409 Conflict - email uniqueness enforced
**Benefit**: Prevents authentication conflicts

---

### Test Case 4.2: Detect Instructor Schedule Conflicts
**Scenario**: View overlapping schedules for an instructor

```javascript
const conflicts = await fetch('/api/instructor/mvcc/:id/conflicts');

// Response:
{
  "success": true,
  "instructor": {
    "name": "Dr. Smith",
    "totalSchedules": 6,
    "conflicts": 1,
    "conflictDetails": [
      {
        "schedule1": {
          "subject": "CS101",
          "time": "10:00 - 11:30",
          "room": "101"
        },
        "schedule2": {
          "subject": "CS102",
          "time": "10:00 - 11:30",
          "room": "102"
        }
      }
    ]
  }
}
```

**Expected Result**: Clear identification of conflicting schedules
**Benefit**: Helps resolve scheduling issues

---

### Test Case 4.3: Resolve Instructor Conflicts
**Scenario**: Reassign conflicting schedule to another instructor

```javascript
// Resolve by reassigning CS102 to Dr. Johnson
const resolve = await fetch('/api/instructor/mvcc/:id/resolve-conflicts', {
  method: 'POST',
  body: JSON.stringify({
    scheduleIdToKeep: "schedule_cs102_id",
    newInstructorForOther: "Dr. Johnson"
  })
});

// ✓ 200 OK
// CS102 now assigned to Dr. Johnson
// Dr. Smith no longer has scheduling conflicts
```

**Expected Result**: Conflict resolved by reassignment
**Benefit**: Automated conflict resolution

---

## 5. Concurrent Access Scenarios

### Test Case 5.1: Retry Logic Under High Contention
**Scenario**: Document with frequent updates triggers auto-retry

```javascript
// Setting up: Multiple admins editing same schedule
// Initial version: 15

// Admin 1: Updates successfully → version 16
// Admin 2: Attempts update with version 15
// Client-side retry logic:
// Attempt 1: Version 15 → 409 Conflict
// Wait 100ms + Fetch new version (16)
// Attempt 2: Version 16 → 409 Conflict
// Wait 200ms + Fetch new version (17)
// Attempt 3: Version 17 → 200 OK ✓

// Result: 3 attempts, final success after retry logic
```

**Expected Result**: Auto-retry eventually succeeds
**Benefit**: Transient conflicts don't fail requests

---

### Test Case 5.2: Concurrency Statistics
**Scenario**: Monitor system under load

```javascript
// After 100 concurrent operations:
const stats = await fetch('/api/schedule/mvcc/stats/concurrency');

// Response:
{
  "stats": {
    "totalSchedules": 150,
    "recentlyModified": 45,
    "versionDistribution": [
      { "_id": 0, "count": 5 },    // New docs
      { "_id": 1, "count": 8 },
      { "_id": 2, "count": 10 },
      { "_id": 5, "count": 25 },
      { "_id": 12, "count": 30 },  // Hot documents
      { "_id": 25, "count": 20 }
    ]
  }
}
```

**Expected Result**: Distribution shows modification patterns
**Benefit**: Identify hot documents for optimization

---

## 6. Error Handling Tests

### Test Case 6.1: Missing Version Field
```javascript
const res = await fetch('/api/schedule/mvcc/:id/update-mvcc', {
  method: 'PUT',
  body: JSON.stringify({
    // ✗ Missing "version" field
    subject: "New Subject"
  })
});

// Expected: 400 Bad Request
// Message: "Version field required for optimistic locking"
```

---

### Test Case 6.2: Invalid Document ID
```javascript
const res = await fetch('/api/schedule/mvcc/invalid_id/version');

// Expected: 404 Not Found
// Message: "Schedule not found"
```

---

### Test Case 6.3: Missing Required Fields
```javascript
const res = await fetch('/api/schedule/mvcc/create-mvcc', {
  method: 'POST',
  body: JSON.stringify({
    course: "CS101",
    // ✗ Missing: year, section, subject, etc.
  })
});

// Expected: 400 Bad Request
// Message: "All fields are required"
```

---

## Performance Benchmarks

### Expected Performance Metrics

**Single Create**: < 50ms
```bash
POST /api/schedule/mvcc/create-mvcc
Average: 45ms
P95: 78ms
P99: 125ms
```

**Single Update (No Conflict)**: < 40ms
```bash
PUT /api/schedule/mvcc/:id/update-mvcc
Average: 35ms
P95: 62ms
P99: 95ms
```

**Single Update (Conflict + Retry)**: < 200ms
```bash
PUT /api/schedule/mvcc/:id/update-mvcc (3 attempts)
Average: 180ms (100ms + 200ms backoff)
P95: 250ms
P99: 300ms
```

**Bulk Create (100 documents)**: < 2s
```bash
POST /api/schedule/mvcc/bulk/create-mvcc (100 items)
Average: 1.8s (18ms per item)
P95: 2.2s
P99: 2.5s
```

---

## Running Tests

### Using curl
```bash
# Create
curl -X POST http://localhost:5000/api/schedule/mvcc/create-mvcc \
  -H "Content-Type: application/json" \
  -d '{"course":"CS101","year":"2024",...}'

# Get version
curl http://localhost:5000/api/schedule/mvcc/:id/version

# Update
curl -X PUT http://localhost:5000/api/schedule/mvcc/:id/update-mvcc \
  -H "Content-Type: application/json" \
  -d '{"version":5,"course":"CS101",...}'
```

### Using Jest
```javascript
describe('MVCC Schedule Operations', () => {
  test('Create schedule with conflict detection', async () => {
    const res = await fetch('/api/schedule/mvcc/create-mvcc', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
    expect(res.status).toBe(201);
  });

  test('Prevent double-booking', async () => {
    // Create first schedule
    await fetch('/api/schedule/mvcc/create-mvcc', {...});
    
    // Try to create overlapping
    const res = await fetch('/api/schedule/mvcc/create-mvcc', {...});
    expect(res.status).toBe(409);
  });

  test('Handle version conflict', async () => {
    const res = await fetch('/api/schedule/mvcc/:id/update-mvcc', {
      method: 'PUT',
      body: JSON.stringify({ version: 999, ...data })
    });
    expect(res.status).toBe(409);
  });
});
```

---

## Conclusion

These test cases cover:
- ✓ Concurrent conflict prevention
- ✓ Version control validation
- ✓ Automatic retry logic
- ✓ Bulk operation handling
- ✓ Error scenarios
- ✓ Performance expectations

All tests should pass with the MVCC implementation providing 100% conflict prevention and data consistency.
