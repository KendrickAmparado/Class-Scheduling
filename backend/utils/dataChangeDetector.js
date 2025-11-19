/**
 * Data Change Detector Utility
 * Tracks data changes and emits Socket.io events only when data actually changes
 * Prevents unnecessary frontend re-renders and flickering
 */

let lastDataSnapshots = {
  rooms: null,
  schedules: null,
  instructors: null,
  sections: null,
  alerts: null,
  scheduleTemplates: null,
};

/**
 * Serialize data for comparison (handle dates and nested objects)
 */
const serializeForComparison = (data) => {
  return JSON.stringify(data, (key, value) => {
    // Convert Date objects to ISO strings for comparison
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
};

/**
 * Check if data has changed and emit event only if it has
 * @param {string} dataType - Type of data (rooms, schedules, instructors, etc.)
 * @param {any} currentData - Current data to compare
 * @param {Object} io - Socket.io instance
 * @param {string} eventName - Event name to emit
 * @returns {boolean} - True if data changed, false otherwise
 */
export const detectAndEmitChange = (dataType, currentData, io, eventName) => {
  if (!io) return false;

  const serialized = serializeForComparison(currentData);
  const lastSnapshot = lastDataSnapshots[dataType];

  // Compare with last snapshot
  if (lastSnapshot === serialized) {
    // Data hasn't changed, don't emit
    return false;
  }

  // Data has changed, update snapshot and emit
  lastDataSnapshots[dataType] = serialized;
  
  console.log(`📡 Data changed: ${dataType} - emitting ${eventName}`);
  io.emit(eventName, {
    data: currentData,
    timestamp: new Date(),
    dataType: dataType
  });

  return true;
};

/**
 * Bulk check multiple data types for changes
 * @param {Object} dataMap - Map of dataType: currentData
 * @param {Object} io - Socket.io instance
 * @param {Object} eventMap - Map of dataType: eventName
 * @returns {Object} - Map showing which data types changed
 */
export const detectAndEmitMultipleChanges = (dataMap, io, eventMap) => {
  const changedTypes = {};

  for (const [dataType, currentData] of Object.entries(dataMap)) {
    const eventName = eventMap[dataType];
    if (eventName && detectAndEmitChange(dataType, currentData, io, eventName)) {
      changedTypes[dataType] = true;
    }
  }

  return changedTypes;
};

/**
 * Reset snapshots (useful for testing or manual resets)
 */
export const resetSnapshots = () => {
  lastDataSnapshots = {
    rooms: null,
    schedules: null,
    instructors: null,
    sections: null,
    alerts: null,
    scheduleTemplates: null,
  };
};

/**
 * Get current snapshots (for debugging)
 */
export const getSnapshots = () => {
  return { ...lastDataSnapshots };
};

export default {
  detectAndEmitChange,
  detectAndEmitMultipleChanges,
  resetSnapshots,
  getSnapshots,
};
