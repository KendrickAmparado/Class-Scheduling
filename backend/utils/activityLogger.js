import Alert from '../models/Alert.js';
import InstructorNotification from '../models/InstructorNotification.js';

/**
 * Log an activity to the activity log system
 * @param {Object} options - Activity log options
 * @param {string} options.type - Type of activity (e.g., 'room-added', 'instructor-login', 'profile-updated')
 * @param {string} options.message - Human-readable message describing the activity
 * @param {string} options.source - Source of activity: 'admin' or 'instructor'
 * @param {string} [options.link] - Optional link to related page
 * @param {string} [options.userEmail] - Email of user performing the action (for instructor activities)
 * @param {Object} [options.meta] - Optional metadata about the activity
 * @param {Object} [options.io] - Socket.IO instance for real-time notifications
 */
export const logActivity = async ({ type, message, source, link = null, userEmail = null, meta = null, io = null }) => {
  try {
    // Create alert for admin activity log with source field
    const alert = await Alert.create({
      type: type || 'activity',
      message,
      source: source || 'admin', // Store the source (admin or instructor)
      link,
      meta: meta || undefined,
      createdAt: new Date()
    });

    // Emit real-time notification if Socket.IO is available
    if (io) {
      io.emit('new-alert', alert);
    }

    return alert;
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main operation
    console.error('Failed to log activity:', error);
    return null;
  }
};

/**
 * Helper to extract user email from request (for instructor activities)
 */
export const getUserEmailFromRequest = (req) => {
  // Try to get from JWT token (if middleware sets req.userEmail)
  if (req.userEmail) {
    return req.userEmail;
  }
  // Try to get from request body
  if (req.body && req.body.email) {
    return req.body.email;
  }
  // Try to get from request params
  if (req.params && req.params.email) {
    return req.params.email;
  }
  // Try to get from query
  if (req.query && req.query.email) {
    return req.query.email;
  }
  return null;
};

