# 🚀 Migration Guide - New Improvements

## Overview
This guide will help you migrate existing components to use the new improvements:
1. ✅ Code Splitting & Lazy Loading
2. ✅ React Query (TanStack Query)
3. ✅ Enhanced Loading States
4. ✅ Form Validation (React Hook Form + Zod)

---

## 1. Code Splitting & Lazy Loading ✅

**Status:** Already implemented in `App.js`

**What Changed:**
- All admin and instructor routes are now lazy loaded
- Login pages remain eager loaded (lightweight)
- Error boundary wraps the entire app
- PageLoader shows during route transitions

**No Action Required** - This is already working!

---

## 2. React Query Migration

### Before (Old Way)
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/schedule');
        setSchedules(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  // ... component logic
};
```

### After (New Way with React Query)
```javascript
import { useSchedules } from '../../hooks/useSchedules';

const ScheduleManagement = () => {
  const { data: schedules = [], isLoading, error } = useSchedules({
    course: 'bsit',
    year: '1st year'
  });

  // ... component logic
  // schedules is automatically cached and refetched
  // isLoading handles loading state
  // error handles error state
};
```

### Step-by-Step Migration:

1. **Import the hook:**
```javascript
import { useSchedules } from '../../hooks/useSchedules';
```

2. **Replace useState/useEffect with hook:**
```javascript
// OLD
const [schedules, setSchedules] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  // fetch logic
}, []);

// NEW
const { data: schedules = [], isLoading, error } = useSchedules(filters);
```

3. **Update loading states:**
```javascript
// OLD
{loading && <div>Loading...</div>}

// NEW
{isLoading && <PageLoader />}
// or
{isLoading && <GridSkeletonLoader count={6} SkeletonComponent={ScheduleCardSkeleton} />}
```

4. **Update mutations:**
```javascript
// OLD
const handleCreate = async (data) => {
  try {
    const res = await axios.post('http://localhost:5000/api/schedule/create', data);
    setSchedules([...schedules, res.data]);
  } catch (err) {
    // handle error
  }
};

// NEW
import { useCreateSchedule } from '../../hooks/useSchedules';

const createSchedule = useCreateSchedule();

const handleCreate = async (data) => {
  try {
    await createSchedule.mutateAsync(data);
    // Cache is automatically updated!
  } catch (err) {
    // Error is handled by React Query
  }
};
```

---

## 3. Enhanced Loading States

### Before
```javascript
{loading && <div>Loading...</div>}
```

### After
```javascript
import { GridSkeletonLoader, ScheduleCardSkeleton } from '../common/LoadingStates';

{isLoading ? (
  <GridSkeletonLoader 
    count={6} 
    SkeletonComponent={ScheduleCardSkeleton} 
  />
) : (
  schedules.map(schedule => (
    <ScheduleCard key={schedule._id} schedule={schedule} />
  ))
)}
```

### Available Skeleton Components:
- `PageLoader` - Full page loader
- `InlineLoader` - Small inline spinner
- `ButtonLoader` - Button loading state
- `SkeletonCard` - Generic card skeleton
- `ScheduleCardSkeleton` - Schedule-specific skeleton
- `RoomCardSkeleton` - Room-specific skeleton
- `GridSkeletonLoader` - Grid of skeletons
- `TableSkeletonLoader` - Table skeleton

---

## 4. Form Validation Migration

### Before (Basic HTML5 Validation)
```javascript
const ScheduleForm = () => {
  const [formData, setFormData] = useState({
    subject: '',
    day: '',
    // ...
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Manual validation
    if (!formData.subject) {
      alert('Subject is required');
      return;
    }
    // Submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.subject}
        onChange={(e) => setFormData({...formData, subject: e.target.value})}
        required
      />
      {/* ... */}
    </form>
  );
};
```

### After (React Hook Form + Zod)
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema } from '../../utils/validationSchemas';
import { FormField, FormSelect } from '../forms/FormField';
import { useCreateSchedule } from '../../hooks/useSchedules';

const ScheduleForm = () => {
  const createSchedule = useCreateSchedule();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(scheduleSchema),
  });

  const onSubmit = async (data) => {
    try {
      await createSchedule.mutateAsync(data);
      showToast('Schedule created successfully!', 'success');
      reset();
    } catch (error) {
      showToast('Failed to create schedule', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Subject"
        name="subject"
        error={errors.subject}
        required
        register={register}
      />
      
      <FormSelect
        label="Day"
        name="day"
        options={dayOptions}
        error={errors.day}
        required
        register={register}
      />
      
      {/* ... other fields */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Schedule'}
      </button>
    </form>
  );
};
```

### Step-by-Step Form Migration:

1. **Install dependencies (already done):**
```bash
npm install react-hook-form zod @hookform/resolvers
```

2. **Import required modules:**
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema } from '../../utils/validationSchemas';
import { FormField, FormSelect } from '../forms/FormField';
```

3. **Replace useState with useForm:**
```javascript
// OLD
const [formData, setFormData] = useState({});

// NEW
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(scheduleSchema),
});
```

4. **Replace input elements:**
```javascript
// OLD
<input
  type="text"
  value={formData.subject}
  onChange={(e) => setFormData({...formData, subject: e.target.value})}
/>

// NEW
<FormField
  label="Subject"
  name="subject"
  error={errors.subject}
  register={register}
/>
```

5. **Update submit handler:**
```javascript
// OLD
const handleSubmit = (e) => {
  e.preventDefault();
  // manual validation and submit
};

// NEW
const onSubmit = async (data) => {
  // data is already validated!
  await createSchedule.mutateAsync(data);
};

// In JSX
<form onSubmit={handleSubmit(onSubmit)}>
```

---

## 5. API Client Migration

### Before
```javascript
import axios from 'axios';

const res = await axios.get('http://localhost:5000/api/schedule');
const schedules = res.data;
```

### After
```javascript
import apiClient from '../../services/apiClient';

// Option 1: Use specific method
const res = await apiClient.getSchedules({ course: 'bsit' });
const schedules = res.data;

// Option 2: Use generic method
const res = await apiClient.get('/api/schedule', { params: { course: 'bsit' } });
```

### Benefits:
- ✅ Automatic token injection
- ✅ Centralized error handling
- ✅ Consistent error messages
- ✅ Request/response interceptors
- ✅ Better error tracking

---

## Example: Complete Component Migration

### Before (Old Component)
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/rooms');
        setRooms(res.data.rooms || []);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {rooms.map(room => (
        <RoomCard key={room._id} room={room} />
      ))}
    </div>
  );
};
```

### After (Migrated Component)
```javascript
import { useRooms } from '../../hooks/useRooms';
import { GridSkeletonLoader, RoomCardSkeleton } from '../common/LoadingStates';
import RoomCard from './RoomCard';

const RoomManagement = () => {
  const { data: rooms = [], isLoading, error } = useRooms();

  if (error) {
    // Error is handled by React Query and API client
    // Show error UI if needed
    return <div>Error loading rooms</div>;
  }

  return (
    <div>
      {isLoading ? (
        <GridSkeletonLoader 
          count={6} 
          SkeletonComponent={RoomCardSkeleton} 
        />
      ) : (
        rooms.map(room => (
          <RoomCard key={room._id} room={room} />
        ))
      )}
    </div>
  );
};
```

---

## Migration Checklist

### For Each Component:

- [ ] Replace `axios` calls with `apiClient` or React Query hooks
- [ ] Replace `useState` + `useEffect` data fetching with React Query hooks
- [ ] Replace loading states with skeleton loaders
- [ ] Replace manual error handling with React Query error handling
- [ ] Update forms to use React Hook Form + Zod
- [ ] Replace basic inputs with `FormField` components
- [ ] Add proper error messages from validation
- [ ] Test the component thoroughly

### Priority Order:

1. **High Priority Components:**
   - ScheduleManagementDetails
   - RoomManagement
   - FacultyManagement
   - AdminDashboard

2. **Medium Priority Components:**
   - ScheduleManagement
   - Reports
   - InstructorDashboard

3. **Low Priority Components:**
   - Settings pages
   - Static pages

---

## Common Patterns

### Pattern 1: List Component
```javascript
const { data: items = [], isLoading } = useItems();
return isLoading ? <SkeletonLoader /> : <ItemList items={items} />;
```

### Pattern 2: Form Component
```javascript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
const mutation = useCreateItem();
```

### Pattern 3: Detail Component
```javascript
const { data: item, isLoading } = useItem(id);
return isLoading ? <SkeletonLoader /> : <ItemDetail item={item} />;
```

### Pattern 4: Mutations
```javascript
const updateItem = useUpdateItem();
const deleteItem = useDeleteItem();

// Usage
await updateItem.mutateAsync({ id, data });
await deleteItem.mutateAsync(id);
```

---

## Troubleshooting

### Issue: React Query not refetching
**Solution:** Check query keys and invalidateQueries calls

### Issue: Form validation not working
**Solution:** Ensure zodResolver is properly imported and schema is correct

### Issue: Loading skeletons not showing
**Solution:** Check if isLoading is properly destructured from query

### Issue: API errors not showing
**Solution:** Check API client error handling and toast integration

---

## Next Steps

1. Start migrating high-priority components
2. Test each migrated component thoroughly
3. Update documentation as you go
4. Share learnings with the team

---

**Need Help?** Check the example components in:
- `src/components/forms/ScheduleForm.example.jsx`
- `src/hooks/useSchedules.js`
- `src/hooks/useRooms.js`

