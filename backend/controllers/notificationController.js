import Alert from '../models/Alert.js';

// Example: After saving entity successfully
const alert = await Alert.create({
  type: 'instructor-added',
  message: `Instructor ${newInstructor.name} was added.`,
  link: '/admin/faculty-management'
});

// Optionally emit alert via Socket.IO for real-time update:
req.io.emit('new-alert', alert);
