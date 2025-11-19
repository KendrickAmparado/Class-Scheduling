# Quick Start: Real-Time Data Updates

## For Developers Using This System

### Situation: You want a page to auto-update when data changes

### Solution: Use the `useRealtimeDataUpdates` hook

```jsx
// 1. Import the hook
import { useRealtimeDataUpdates, useSocket } from '../../hooks/useRealtimeUpdates.js';

// 2. In your component
function MyPage() {
  const [data, setData] = useState([]);
  const socket = useSocket(); // Gets Socket.io connection

  // 3. Subscribe to updates
  useRealtimeDataUpdates('data-updated:rooms', setData, socket);

  // 4. Fetch initial data
  useEffect(() => {
    axios.get('http://localhost:5000/api/rooms')
      .then(res => setData(res.data.rooms));
  }, []);

  // 5. Render and it will auto-update!
  return <div>{data.map(item => ...)}</div>;
}
```

That's it! Your page will now:
- ✅ Load data on mount
- ✅ Auto-update when data changes
- ✅ Never flicker
- ✅ Save bandwidth

## What Events Are Available?

```
'data-updated:rooms'        → Room data changed
'data-updated:schedules'    → Schedule data changed
'data-updated:instructors'  → Instructor data changed
'data-updated:sections'     → Section data changed
'data-updated:alerts'       → Alert data changed
'data-updated:scheduleTemplates' → Template data changed
```

## Multiple Data Sources

```jsx
// Subscribe to multiple updates at once
useRealtimeMultipleUpdates({
  'data-updated:rooms': setRooms,
  'data-updated:schedules': setSchedules,
  'data-updated:instructors': setInstructors
}, socket);
```

## Conditional Updates (Optional)

Only update when page is visible:

```jsx
const [isVisible, setIsVisible] = useState(true);
useRealtimeDataUpdates('data-updated:rooms', setRooms, socket, isVisible);
```

## That's All!

No complex setup needed. The backend automatically:
- Detects when data changes
- Sends updates via Socket.io
- Only when data actually differs

Frontend just listens and updates when events arrive.

## Troubleshooting

**"Events not coming through?"**
- Check `socket.connected` in console → Should be `true`
- Check browser network tab → Should see Socket.io connection
- Verify event name matches exactly

**"Still seeing flickering?"**
- Make sure you're using `useRealtimeDataUpdates` hook
- Don't force extra re-renders with `useCallback` tricks
- Check React DevTools profiler to see render count

**"Want to debug?"**
```javascript
// In browser console
socket.onAny((event, ...data) => {
  console.log('Event:', event, 'Data:', data);
});
```

## That's it! Enjoy smooth, auto-updating data! 🚀
