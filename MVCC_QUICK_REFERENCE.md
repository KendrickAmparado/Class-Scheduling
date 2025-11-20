# MVCC Quick Reference Guide

## What is MVCC?

**Multi-Version Concurrency Control** prevents data conflicts when multiple users modify the same data simultaneously. It uses **Optimistic Locking** where each document has a version number (`__v`).

## The Pattern

```
1. Get Version     → __v: 5
2. Modify Data     → subject: "New Subject"
3. Send with Ver   → version: 5, subject: "New Subject"
4. Server Checks   → Current __v == 5? 
5a. Match → Save  → Update with __v: 6
5b. Mismatch → Conflict → Return 409, retry
```

## Common Operations

### Getting Version
```bash
# Get current version before updating
GET /api/schedule/mvcc/:id/version

Response:
{
  "schedule": {
    "_id": "123",
    "__v": 5,
    "course": "CS101",
    ...
  }
}
```

### Creating (No Version Needed)
```bash
POST /api/schedule/mvcc/create-mvcc
{
  "course": "CS101",
  "year": "2024",
  "section": "A",
  "subject": "Data Structures",
  "instructor": "Dr. Smith",
  "instructorEmail": "smith@example.com",
  "day": "Monday",
  "time": "10:00 - 11:30",
  "room": "101"
}

Response: 201 Created
{
  "success": true,
  "schedule": {
    "_id": "...",
    "__v": 0,
    ...
  }
}
```

### Updating (Version Required)
```bash
PUT /api/schedule/mvcc/:id/update-mvcc
{
  "version": 5,           # ← REQUIRED: from GET /version
  "course": "CS101",
  "year": "2024",
  "section": "B",         # Changed
  "subject": "New Topic", # Changed
  "instructor": "Dr. Smith",
  "instructorEmail": "smith@example.com",
  "day": "Tuesday",       # Changed
  "time": "14:00 - 15:30",# Changed
  "room": "102"           # Changed
}

Response: 200 OK (if version matches)
{
  "success": true,
  "schedule": { ... "__v": 6, ... }
}

Response: 409 Conflict (if version doesn't match)
{
  "success": false,
  "message": "Concurrent update detected. Please refresh and try again.",
  "code": "VERSION_CONFLICT"
}
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `VERSION_CONFLICT` | Document changed. Retry after refresh | Fetch version again and retry |
| `DUPLICATE_SECTION` | Section name exists in this course/year | Use different name |
| `DUPLICATE_ROOM` | Room name already exists | Use different room name |
| `EMAIL_CONFLICT` | Email already used by another instructor | Use different email |
| `CONFLICT_DETECTED` | Schedule/room/instructor conflict | Check availability first |
| `ACTIVE_SCHEDULES` | Can't change status with active schedules | Archive schedules first |
| `VALIDATION_ERROR` | Missing required fields or version | Check request format |

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created successfully |
| 200 | OK - operation successful |
| 400 | Bad request - missing version or invalid data |
| 404 | Not found - document doesn't exist |
| 409 | Conflict - version mismatch or constraint violation |
| 500 | Server error |

## Pre-Update Checklist

✓ Have I fetched the current version?
✓ Did I include the `version` field?
✓ Are all required fields present?
✓ Is the data in the correct format?
✓ Am I using PUT for full updates?
✓ Am I using PATCH for partial updates?

## Troubleshooting

### "Version field required"
- You forgot to include `"version": X` in your request
- Solution: GET the current version first

### "Version conflict detected"
- Another user updated the document
- Solution: Fetch latest version and try again
- The new version info is in the error response

### "Concurrent update detected"
- Same as above
- Solution: Same as above

### "Room already exists"
- You're trying to create a room with duplicate name
- Solution: Use a different room name

### "Section already exists"
- Duplicate section in same course/year
- Solution: Use different section name

### "Cannot set to maintenance: 5 active schedules"
- You're trying to mark room as maintenance
- Solution: Archive the 5 schedules first

## Bulk Operations

### Bulk Create Schedules
```bash
POST /api/schedule/mvcc/bulk/create-mvcc
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
  "schedules": [ ... ]
}
```

### Bulk Update Sections
```bash
POST /api/section/mvcc/bulk/update-mvcc
{
  "sections": [
    { "_id": "...", "__v": 2, "course": "CS101", "year": "2024", "name": "A" },
    { "_id": "...", "__v": 1, "course": "CS102", "year": "2024", "name": "B" }
  ]
}
```

## Monitoring

### Check Concurrency Stats
```bash
GET /api/schedule/mvcc/stats/concurrency
GET /api/section/mvcc/stats/concurrency
GET /api/room/mvcc/stats/concurrency
GET /api/instructor/mvcc/stats/concurrency

Response:
{
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

**Interpret Results:**
- `__v: 0-2` = Recently created
- `__v: 3-10` = Regularly updated
- `__v: 20+` = Hot document (frequently modified)

## Retry Pattern

```javascript
async function updateWithRetry(id, updates) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // 1. Get current version
      const versionRes = await fetch(`/api/schedule/mvcc/${id}/version`);
      const { schedule } = await versionRes.json();
      
      // 2. Update with version
      const updateRes = await fetch(`/api/schedule/mvcc/${id}/update-mvcc`, {
        method: 'PUT',
        body: JSON.stringify({ 
          version: schedule.__v, 
          ...updates 
        })
      });
      
      // 3. Check result
      if (updateRes.ok) return updateRes.json();
      
      if (updateRes.status === 409) {
        // Version conflict - retry after delay
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Other errors - don't retry
      throw new Error(`HTTP ${updateRes.status}`);
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }
}
```

## All MVCC Endpoints

### Schedules
- `POST /api/schedule/mvcc/create-mvcc` - Create
- `PUT /api/schedule/mvcc/:id/update-mvcc` - Update
- `GET /api/schedule/mvcc/:id/version` - Get version
- `POST /api/schedule/mvcc/bulk/create-mvcc` - Bulk create
- `GET /api/schedule/mvcc/stats/concurrency` - Stats

### Sections
- `POST /api/section/mvcc/create-mvcc` - Create
- `PUT /api/section/mvcc/:id/update-mvcc` - Update
- `GET /api/section/mvcc/:id/version` - Get version
- `POST /api/section/mvcc/bulk/update-mvcc` - Bulk update
- `DELETE /api/section/mvcc/:id/with-cascade-mvcc` - Delete
- `GET /api/section/mvcc/stats/concurrency` - Stats

### Rooms
- `POST /api/room/mvcc/create-mvcc` - Create
- `PUT /api/room/mvcc/:id/status-mvcc` - Update status
- `PUT /api/room/mvcc/:id/update-mvcc` - Update details
- `GET /api/room/mvcc/:id/version` - Get version
- `POST /api/room/mvcc/:id/check-availability` - Check availability
- `GET /api/room/mvcc/:id/conflicts` - Get conflicts
- `POST /api/room/mvcc/bulk/status-mvcc` - Bulk update
- `GET /api/room/mvcc/stats/concurrency` - Stats

### Instructors
- `PUT /api/instructor/mvcc/:id/update-mvcc` - Update
- `PATCH /api/instructor/mvcc/:id/assign-mvcc` - Assign
- `GET /api/instructor/mvcc/:id/version` - Get version
- `POST /api/instructor/mvcc/bulk/assign-mvcc` - Bulk assign
- `GET /api/instructor/mvcc/:id/conflicts` - Get conflicts
- `POST /api/instructor/mvcc/:id/resolve-conflicts` - Resolve
- `GET /api/instructor/mvcc/stats/concurrency` - Stats

## Key Takeaways

1. **Always get version first** before updating
2. **Send version with update** - it's required
3. **Handle 409 Conflict** - retry with fresh version
4. **Expect automatic retries** - up to 3 attempts with backoff
5. **Use bulk operations** for multiple changes
6. **Monitor stats** to detect high-contention areas
7. **Check constraints** before creating/updating

## More Information

- Full API docs: `MVCC_IMPLEMENTATION_GUIDE.md`
- Integration help: `MVCC_SERVER_INTEGRATION.md`
- Implementation details: `MVCC_IMPLEMENTATION_SUMMARY.md`
