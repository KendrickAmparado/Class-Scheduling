# Public API Documentation

## Overview

The Class Scheduling System provides a public REST API for accessing schedule information. This API is designed for:
- **Students** - Viewing their class schedules
- **Parents** - Checking schedules
- **External Systems** - Integrating with other applications
- **Mobile Apps** - Building mobile applications
- **Public Websites** - Displaying schedule information

## Base URL

```
http://localhost:5000/api/public
```

## Authentication

All public endpoints are **read-only** and **do not require authentication**. However, rate limiting is recommended for production use.

## Response Format

All endpoints return JSON responses with the following structure:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## Endpoints

### Health Check

#### GET `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "service": "Class Scheduling System Public API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Courses

#### GET `/courses`

Get list of available courses/programs.

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "id": "bsit",
      "name": "Bachelor of Science in Information Technology",
      "shortName": "BSIT",
      "description": "Information Technology Program"
    }
  ],
  "count": 1
}
```

---

### Year Levels

#### GET `/year-levels`

Get list of available year levels.

**Response:**
```json
{
  "success": true,
  "yearLevels": [
    {
      "year": "1st year",
      "course": "bsit",
      "subtitle": "First Year Students"
    }
  ],
  "count": 4
}
```

---

### Sections

#### GET `/sections?course={course}&year={year}`

Get sections for a specific course and year.

**Query Parameters:**
- `course` (required) - Course ID (e.g., "bsit")
- `year` (required) - Year level (e.g., "1st year")

**Response:**
```json
{
  "success": true,
  "course": "bsit",
  "year": "1st year",
  "sections": [
    {
      "_id": "...",
      "name": "A",
      "course": "bsit",
      "year": "1st year"
    }
  ],
  "count": 5
}
```

---

### Rooms

#### GET `/rooms`

Get list of available rooms.

**Response:**
```json
{
  "success": true,
  "rooms": [
    {
      "room": "LAB-101",
      "area": "Main Building",
      "status": "available"
    }
  ],
  "count": 20
}
```

---

### Schedules

#### GET `/schedules`

Get schedules with filtering and pagination.

**Query Parameters:**
- `course` (optional) - Filter by course
- `year` (optional) - Filter by year level
- `section` (optional) - Filter by section
- `day` (optional) - Filter by day (monday, tuesday, etc.)
- `room` (optional) - Filter by room
- `instructor` (optional) - Search by instructor name (partial match)
- `subject` (optional) - Search by subject (partial match)
- `limit` (optional) - Results per page (default: 100, max: 500)
- `page` (optional) - Page number (default: 1)

**Example:**
```
GET /api/public/schedules?course=bsit&year=1st year&section=A&limit=50
```

**Response:**
```json
{
  "success": true,
  "schedules": [
    {
      "course": "bsit",
      "year": "1st year",
      "section": "A",
      "subject": "Programming Fundamentals",
      "instructor": "John Doe",
      "day": "Monday",
      "time": "7:30 AM - 10:00 AM",
      "room": "LAB-101"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "course": "bsit",
    "year": "1st year",
    "section": "A",
    "day": null,
    "room": null,
    "instructor": null,
    "subject": null
  }
}
```

---

#### GET `/schedules/by-section/:course/:year/:section`

Get all schedules for a specific section.

**Example:**
```
GET /api/public/schedules/by-section/bsit/1st year/A
```

**Response:**
```json
{
  "success": true,
  "course": "bsit",
  "year": "1st year",
  "section": "A",
  "schedules": [
    {
      "subject": "Programming Fundamentals",
      "instructor": "John Doe",
      "day": "Monday",
      "time": "7:30 AM - 10:00 AM",
      "room": "LAB-101"
    }
  ],
  "count": 5
}
```

---

#### GET `/schedules/by-room/:room`

Get all schedules for a specific room.

**Example:**
```
GET /api/public/schedules/by-room/LAB-101
```

**Response:**
```json
{
  "success": true,
  "room": "LAB-101",
  "schedules": [
    {
      "course": "bsit",
      "year": "1st year",
      "section": "A",
      "subject": "Programming Fundamentals",
      "instructor": "John Doe",
      "day": "Monday",
      "time": "7:30 AM - 10:00 AM"
    }
  ],
  "count": 10
}
```

---

#### GET `/schedules/by-day/:day`

Get all schedules for a specific day.

**Example:**
```
GET /api/public/schedules/by-day/monday
```

**Response:**
```json
{
  "success": true,
  "day": "monday",
  "schedules": [
    {
      "course": "bsit",
      "year": "1st year",
      "section": "A",
      "subject": "Programming Fundamentals",
      "instructor": "John Doe",
      "time": "7:30 AM - 10:00 AM",
      "room": "LAB-101"
    }
  ],
  "count": 50
}
```

---

### Instructors

#### GET `/instructors`

Get list of active instructors (public information only).

**Query Parameters:**
- `department` (optional) - Filter by department
- `search` (optional) - Search by instructor name

**Example:**
```
GET /api/public/instructors?department=IT&search=John
```

**Response:**
```json
{
  "success": true,
  "instructors": [
    {
      "instructorId": "INS001",
      "firstname": "John",
      "lastname": "Doe",
      "department": "IT"
    }
  ],
  "count": 10
}
```

**Note:** Email addresses and other sensitive information are excluded from public responses.

---

#### GET `/instructors/:instructorId`

Get public information about a specific instructor including their schedules.

**Example:**
```
GET /api/public/instructors/INS001
```

**Response:**
```json
{
  "success": true,
  "instructor": {
    "instructorId": "INS001",
    "firstname": "John",
    "lastname": "Doe",
    "department": "IT",
    "schedules": [
      {
        "course": "bsit",
        "year": "1st year",
        "section": "A",
        "subject": "Programming Fundamentals",
        "day": "Monday",
        "time": "7:30 AM - 10:00 AM",
        "room": "LAB-101"
      }
    ],
    "scheduleCount": 5
  }
}
```

---

### Statistics

#### GET `/statistics`

Get public statistics about the scheduling system.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalSchedules": 500,
    "totalSections": 50,
    "totalRooms": 20,
    "totalInstructors": 30,
    "totalCourses": 2,
    "schedulesByDay": {
      "Monday": 100,
      "Tuesday": 100,
      "Wednesday": 100,
      "Thursday": 100,
      "Friday": 100
    },
    "schedulesByCourse": {
      "bsit": 300,
      "bsemc-dat": 200
    }
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

---

## Use Cases

### 1. Student Viewing Their Schedule

```javascript
// Get schedules for BSIT 1st Year Section A
fetch('http://localhost:5000/api/public/schedules/by-section/bsit/1st year/A')
  .then(res => res.json())
  .then(data => {
    console.log('My Schedule:', data.schedules);
  });
```

### 2. Mobile App - Today's Schedule

```javascript
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
fetch(`http://localhost:5000/api/public/schedules/by-day/${today}`)
  .then(res => res.json())
  .then(data => {
    console.log("Today's classes:", data.schedules);
  });
```

### 3. Room Availability Check

```javascript
fetch('http://localhost:5000/api/public/schedules/by-room/LAB-101')
  .then(res => res.json())
  .then(data => {
    console.log('Room schedule:', data.schedules);
  });
```

### 4. Search by Subject

```javascript
fetch('http://localhost:5000/api/public/schedules?subject=Programming&limit=10')
  .then(res => res.json())
  .then(data => {
    console.log('Programming classes:', data.schedules);
  });
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

Example error response:

```json
{
  "success": false,
  "message": "Course and year parameters are required",
  "error": "Validation error"
}
```

---

## Rate Limiting (Recommended for Production)

While the current implementation doesn't include rate limiting, it's recommended to add it for production:

```javascript
// Example using express-rate-limit
const rateLimit = require('express-rate-limit');

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/public', publicApiLimiter);
```

---

## CORS

The API supports CORS for cross-origin requests. Configure CORS settings in `server.js` if needed.

---

## Data Privacy

The public API follows these privacy principles:

- ✅ **No sensitive data** - Email addresses, passwords, and internal IDs are excluded
- ✅ **Read-only** - All endpoints are GET requests only
- ✅ **Public information only** - Only information that should be publicly accessible is exposed
- ✅ **No authentication required** - Designed for public access

---

## Future Enhancements

Potential additions to the public API:

1. **iCal Export** - Generate iCal files for schedules
2. **Schedule Subscriptions** - Subscribe to schedule changes
3. **Search Endpoint** - Full-text search across all schedules
4. **Calendar View** - Get schedules formatted for calendar display
5. **Notifications** - Public announcement endpoints
6. **API Versioning** - Version the API for backward compatibility

---

## Support

For questions or issues with the public API, please contact the system administrator.

