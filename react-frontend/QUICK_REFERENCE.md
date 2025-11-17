# 🚀 Quick Reference Card

## React Query Hooks

### Schedules
```javascript
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from '../../hooks/useSchedules';

// Get schedules
const { data: schedules = [], isLoading, error } = useSchedules({ course: 'bsit' });

// Create schedule
const createSchedule = useCreateSchedule();
await createSchedule.mutateAsync(data);

// Update schedule
const updateSchedule = useUpdateSchedule();
await updateSchedule.mutateAsync({ id, data });

// Delete schedule
const deleteSchedule = useDeleteSchedule();
await deleteSchedule.mutateAsync(id);
```

### Rooms
```javascript
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../../hooks/useRooms';

// Get rooms
const { data: rooms = [], isLoading } = useRooms();

// Create room
const createRoom = useCreateRoom();
await createRoom.mutateAsync(data);
```

---

## Loading States

```javascript
import { 
  PageLoader, 
  GridSkeletonLoader, 
  ScheduleCardSkeleton,
  RoomCardSkeleton,
  TableSkeletonLoader 
} from '../common/LoadingStates';

// Page loader
<PageLoader />

// Grid of skeletons
<GridSkeletonLoader count={6} SkeletonComponent={ScheduleCardSkeleton} />

// Table skeleton
<TableSkeletonLoader rows={5} cols={4} />
```

---

## Form Validation

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema } from '../../utils/validationSchemas';
import { FormField, FormSelect, FormTextarea } from '../forms/FormField';

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(scheduleSchema),
});

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
  options={['Monday', 'Tuesday']}
  error={errors.day}
  register={register}
/>
```

---

## API Client

```javascript
import apiClient from '../../services/apiClient';

// Get schedules
const res = await apiClient.getSchedules({ course: 'bsit' });

// Create schedule
const res = await apiClient.createSchedule(data);

// Update schedule
const res = await apiClient.updateSchedule(id, data);

// Delete schedule
const res = await apiClient.deleteSchedule(id);
```

---

## Validation Schemas

```javascript
import { 
  scheduleSchema,
  roomSchema,
  instructorSchema,
  loginSchema,
  registrationSchema 
} from '../../utils/validationSchemas';
```

---

## Common Patterns

### List with Loading
```javascript
const { data: items = [], isLoading } = useItems();
return isLoading ? <SkeletonLoader /> : <ItemList items={items} />;
```

### Form with Validation
```javascript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### Mutation
```javascript
const mutation = useCreateItem();
await mutation.mutateAsync(data);
```

---

## File Locations

- **Hooks:** `src/hooks/`
- **Forms:** `src/components/forms/`
- **Loading:** `src/components/common/LoadingStates.jsx`
- **API Client:** `src/services/apiClient.js`
- **Validation:** `src/utils/validationSchemas.js`
- **Query Provider:** `src/context/QueryProvider.jsx`

---

## Quick Tips

1. **Always use React Query hooks for server data**
2. **Use skeleton loaders instead of spinners**
3. **Use FormField components for forms**
4. **Use validation schemas for type-safe validation**
5. **Use API client for all API calls**
6. **Check error states from React Query**
7. **Use isLoading from React Query, not manual loading states**

---

*For more details, see MIGRATION_GUIDE.md*

