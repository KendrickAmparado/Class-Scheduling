# MVCC System Architecture & Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Class Scheduling System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Schedule   │  │   Section    │  │     Room     │           │
│  │  Management  │  │  Management  │  │  Management  │           │
│  └────────┬─────┘  └────────┬─────┘  └────────┬─────┘           │
│           │                 │                 │                 │
│           └─────────────────┼─────────────────┘                 │
│                             │                                   │
│                   ┌─────────▼──────────┐                        │
│                   │  Instructor        │                        │
│                   │  Management        │                        │
│                   └────────────────────┘                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            MVCC Layer (Concurrency Control)              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │  │  Optimistic │  │  Conflict  │  │  Transaction      │ │   │
│  │  │  Locking   │  │  Detection │  │  Management       │ │   │
│  │  │            │  │            │  │                   │ │   │
│  │  │ - __v flag │  │ - Schedule │  │ - Retry Logic    │ │   │
│  │  │ - Versioning              │  │ - Exponential    │ │   │
│  │  │            │  │ - Room     │  │   Backoff        │ │   │
│  │  │            │  │ - Section  │  │ - Audit Trail    │ │   │
│  │  │            │  │ - Email    │  │ - Error Handler  │ │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           MongoDB Database with MVCC Indexes             │   │
│  │  Schedules, Sections, Rooms, Instructors                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Processing Flow

```
┌─────────────────┐
│  Client Request │
│  (with version) │
└────────┬────────┘
         │
         ▼
    ┌──────────────────┐
    │ Parse & Validate │
    │ Request Body     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Constraint Check │ ──→ Room exists?
    │ (Pre-validation) │ ──→ Section exists?
    │                  │ ──→ Email unique?
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Conflict Check   │ ──→ Schedule overlap?
    │                  │ ──→ Duplicate name?
    │                  │ ──→ Active schedules?
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Version Check    │ ──→ __v == expected?
    │ (OptLocking)     │
    └──────┬───────────┘
           │
    ┌──────┴──────────────────────────────┐
    │                                      │
    ▼                                      ▼
MISMATCH                               MATCH
409 Conflict                           Continue
Return error                           │
                                       ▼
                              ┌──────────────────┐
                              │ Atomic Update    │
                              │ - Apply changes  │
                              │ - Increment __v  │
                              │ - Update timestamp
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Create Transaction
                              │ - Transaction ID
                              │ - Operation log
                              │ - Change audit
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Return Response  │
                              │ 200/201 Success  │
                              │ With transaction │
                              └──────────────────┘
```

## Retry Logic State Machine

```
                      ┌─────────────────┐
                      │  Client Update  │
                      │  (version: 5)   │
                      └────────┬────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Attempt 1       │
                    │  Check v5 == 5?  │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                  FAIL              PASS
                    │                 │
                    ▼                 ▼
            ┌─────────────────┐  ✓ Success
            │ Version Mismatch│
            │ (now v6)        │
            └────────┬────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │ Exponential Backoff  │
         │ Wait 100ms           │
         └────────┬─────────────┘
                  │
                  ▼
         ┌──────────────────────┐
         │ Fetch New Version    │
         │ (v = 6)              │
         └────────┬─────────────┘
                  │
                  ▼
         ┌──────────────────────┐
         │ Attempt 2            │
         │ Check v6 == 6?       │
         └────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
      FAIL                PASS
        │                   │
        ▼                   ▼
    ┌─────────────────┐  ✓ Success
    │ Version Mismatch│
    │ (now v7)        │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ Exponential Backoff     │
    │ Wait 200ms              │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ Fetch New Version       │
    │ (v = 7)                 │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ Attempt 3 (Final)       │
    │ Check v7 == 7?          │
    └────────┬────────────────┘
             │
    ┌────────┴─────────────┐
    │                      │
  FAIL                   PASS
    │                      │
    ▼                      ▼
✗ Max Retries         ✓ Success
  Exceeded            Return 200
  Return 409
```

## Conflict Detection Matrix

```
                  ┌─────────────────────────────────────┐
                  │     CONFLICT DETECTION              │
                  ├─────────────────────────────────────┤
                  │                                       │
        ┌─────────▼──────┐      ┌──────────────────┐    │
        │  SCHEDULE      │      │    SECTION       │    │
        │  Conflicts     │      │   Conflicts      │    │
        ├────────────────┤      ├──────────────────┤    │
        │ • Room overlap │      │ • Duplicate name │    │
        │   (same time)  │      │   in same        │    │
        │                │      │   course/year    │    │
        │ • Instructor   │      │                  │    │
        │   double-book  │      │ • Version        │    │
        │                │      │   conflict       │    │
        │ • Time overlap │      │                  │    │
        │                │      │                  │    │
        │ • Version      │      │                  │    │
        │   conflict     │      │                  │    │
        └────────────────┘      └──────────────────┘    │
                  │                      │               │
        ┌─────────▼──────┐      ┌──────────────────┐    │
        │     ROOM       │      │   INSTRUCTOR     │    │
        │   Conflicts    │      │    Conflicts     │    │
        ├────────────────┤      ├──────────────────┤    │
        │ • Double-      │      │ • Duplicate      │    │
        │   booking      │      │   email          │    │
        │   detection    │      │                  │    │
        │                │      │ • Overlapping    │    │
        │ • Maintenance  │      │   schedules      │    │
        │   with active  │      │   (same time)    │    │
        │   schedules    │      │                  │    │
        │                │      │ • Version        │    │
        │ • Availability │      │   conflict       │    │
        │   checking     │      │                  │    │
        │                │      │                  │    │
        │ • Version      │      │                  │    │
        │   conflict     │      │                  │    │
        └────────────────┘      └──────────────────┘    │
                                                          │
                  └─────────────────────────────────────┘
```

## Data Flow - Schedule Creation

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /create-mvcc
     │ { course, year, section, ... }
     ▼
┌──────────────────────────────────┐
│ VALIDATION LAYER                  │
│ ✓ All fields present?             │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ CONFLICT DETECTION                │
│ ✓ Room exists & not archived?     │
│ ✓ Section exists & not archived?  │
│ ✓ Room not booked at that time?   │
│ ✓ Instructor not scheduled then?  │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ ATOMIC CREATE                     │
│ - Generate new __v: 0             │
│ - Set createdAt/updatedAt         │
│ - Insert into Schedule collection │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ TRANSACTION LOG                   │
│ - TransactionID                   │
│ - UserID                          │
│ - Operation: create               │
│ - DocumentID                      │
│ - Final version: 0                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ RESPONSE TO CLIENT                │
│ 201 Created                       │
│ {                                 │
│   success: true,                  │
│   schedule: { _id, __v: 0, ...},  │
│   transaction: { ... }            │
│ }                                 │
└──────────────────────────────────┘
```

## Data Flow - Schedule Update with Conflict

```
┌─────────┐
│ Client  │
└────┬────┘
     │ PUT /update-mvcc/:id
     │ { version: 5, course, ... }
     ▼
┌──────────────────────────────────┐
│ VERSION CHECK                     │
│ Document.__v == 5?                │
└────────────┬─────────────────────┘
             │
        ┌────┴──────────────────┐
        │                       │
      PASS                    FAIL
        │                       │
        │                   Current: 6
        │                       │
        │                       ▼
        │            ┌──────────────────────┐
        │            │ CONFLICT DETECTED    │
        │            │                      │
        │            │ Return 409 Response  │
        │            │ {                    │
        │            │   code: CONFLICT     │
        │            │   message: "Please   │
        │            │   refresh..."        │
        │            │ }                    │
        │            └──────────────────────┘
        │                       │
        │                       ▼
        │                  [Client Retry]
        │                  Fetch version
        │                  Attempt again
        │
        ▼
┌──────────────────────────────────┐
│ CONFLICT DETECTION (on update)   │
│ ✓ Room not booked at new time?   │
│ ✓ Instructor free at new time?   │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ ATOMIC UPDATE                     │
│ - Apply changes                   │
│ - Increment __v: 5 → 6            │
│ - Update updatedAt                │
│ - Save to database                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ TRANSACTION LOG                   │
│ - TransactionID                   │
│ - Previous version: 5             │
│ - New version: 6                  │
│ - Changes documented              │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ RESPONSE TO CLIENT                │
│ 200 OK                            │
│ {                                 │
│   success: true,                  │
│   schedule: { ..., __v: 6, ... }, │
│   transaction: { ... }            │
│ }                                 │
└──────────────────────────────────┘
```

## Concurrency Scenarios

### Scenario 1: Successful Concurrent Updates
```
Time    Admin 1                  Admin 2
────────────────────────────────────────────────
t0      GET version (v=5)       
t1                              GET version (v=5)
t2      PUT update (v=5)        
t3      ✓ Success (v=6)         
t4                              PUT update (v=5)
t5                              ✗ 409 Conflict
t6                              GET version (v=6)
t7                              PUT update (v=6)
t8                              ✓ Success (v=7)
```

### Scenario 2: Conflict Detection
```
Time    Admin 1                  Admin 2
────────────────────────────────────────────────
t0      Create Schedule          
        Room 101, Mon 10-11      
t1      ✓ Success                
t2                              Create Schedule
                                 Room 101, Mon 10-11
t3                              ✗ 409 Conflict
                                 "Room already booked"
t4                              Try different room
                                 Room 102, Mon 10-11
t5                              ✓ Success
```

### Scenario 3: Auto-Retry with Backoff
```
Time    Attempt 1               Attempt 2               Attempt 3
────────────────────────────────────────────────────────────────────
t0      PUT (v=5)               
t1      Check: v=6              
t2      ✗ Conflict              Wait 100ms
t3                              t=100ms: Fetch v=6
t4                              PUT (v=6)
t5                              Check: v=7
t6                              ✗ Conflict           Wait 200ms
t7                                                    t=300ms: Fetch v=7
t8                                                    PUT (v=7)
t9                                                    Check: v=7
t10                                                   ✓ Success!
```

## Version Distribution Over Time

```
Total Schedules: 150

Version 0   ██████████ (10)     - Just created
Version 1   ████████████ (12)   - Rarely updated
Version 2   ██████████████ (15)
Version 3   ████████████████ (20) - Regular updates
Version 4   ███████████████ (18)
Version 5   ██████████████ (15)
Version 6   ████████ (10)
Version 7   ██████ (8)
Version 10  ███████████ (12)    - Moderately active
Version 15  ████ (5)
Version 20+ ██ (2)              - Hot documents
            ├──────────────────────┤
            0      5      10     15  (frequency)
```

## Transaction Lifecycle

```
                    ┌────────────────────┐
                    │ Transaction Start  │
                    │ - ID generated     │
                    │ - User captured    │
                    │ - Timestamp set    │
                    └────────────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Operation Execution    │
                    │ - Conflict check       │
                    │ - Version check        │
                    │ - Atomic update        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Operation Recorded     │
                    │ - Document ID          │
                    │ - Action taken         │
                    │ - New version          │
                    │ - Timestamp            │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Commit/Rollback        │
                    │                        │
                    ├─────────┬──────────┐   │
                    │         │          │   │
                  SUCCESS  PARTIAL    FAIL  │
                    │       SUCCESS     │   │
                    │         │         │   │
                    └─────────┴────┬────┘   │
                                   │        │
                    ┌──────────────▼────────┐
                    │ Transaction Complete  │
                    │ - Final status        │
                    │ - Duration            │
                    │ - Audit log written   │
                    └───────────────────────┘
```

## Error Response Flow

```
┌─────────────────────┐
│  Request Arrives    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Validation Error?                    │
│ (Missing required fields)            │
└────────────┬────────────────────────┘
      │ YES       │ NO
      ▼           ▼
   400        ┌──────────────────────┐
           │ Constraint Violation?      │
           │ (Duplicate, not found)     │
           └────────────┬───────────────┘
               │ YES       │ NO
               ▼           ▼
             404/409    ┌──────────────┐
                       │ Version Match?│
                       └────────┬──────┘
                         │ NO    │ YES
                         ▼       ▼
                        409   ┌──────────────┐
                             │ Conflict Found?│
                             └────────┬───────┘
                               │ YES   │ NO
                               ▼       ▼
                              409    ┌──────────────┐
                                    │ Proceed with │
                                    │ Update       │
                                    └────┬─────────┘
                                         │
                                         ▼
                                    200/201 Success
```

---

These diagrams provide a visual representation of:
- System architecture and layers
- Request processing flow
- Retry logic state machine
- Conflict detection matrix
- Data flow for create and update operations
- Concurrency scenarios
- Transaction lifecycle
- Error handling flow
