/**
 * MVCC (Multi-Version Concurrency Control) Manager
 * Handles optimistic locking, version tracking, and conflict detection
 */

/**
 * Check version before update (Optimistic Locking)
 * @param {Object} model - Mongoose model
 * @param {String} docId - Document ID
 * @param {Number} clientVersion - Version from client
 * @throws {Error} If version mismatch detected
 */
export async function checkVersionConflict(model, docId, clientVersion) {
  const doc = await model.findById(docId);
  
  if (!doc) {
    throw new Error('Document not found');
  }
  
  // MongoDB increments __v automatically on updates
  if (doc.__v !== clientVersion) {
    throw new Error(
      `Version conflict detected. Current version: ${doc.__v}, Client version: ${clientVersion}. Please refresh and try again.`
    );
  }
  
  return doc;
}

/**
 * Increment version atomically during update
 * @param {Object} model - Mongoose model
 * @param {String} docId - Document ID
 * @param {Number} expectedVersion - Expected current version
 * @param {Object} updateData - Data to update
 * @throws {Error} If version mismatch (concurrent update detected)
 */
export async function updateWithVersionControl(model, docId, expectedVersion, updateData) {
  try {
    // Use findByIdAndUpdate with version check
    // $eq on __v ensures no concurrent update happened
    const result = await model.findByIdAndUpdate(
      docId,
      { ...updateData, $inc: { __v: 1 } },
      { 
        new: true, 
        runValidators: true,
        // This will fail if __v changed (another update happened)
        conditions: { __v: expectedVersion }
      }
    );
    
    if (!result) {
      throw new Error(
        `Version conflict: Document version changed. Please refresh and retry.`
      );
    }
    
    return result;
  } catch (error) {
    if (error.message.includes('Version conflict')) {
      throw error;
    }
    throw error;
  }
}

/**
 * Create version snapshot for audit trail
 * @param {Object} doc - Document
 * @param {String} action - Action performed
 * @param {String} userId - User performing action
 */
export function createVersionSnapshot(doc, action, userId) {
  return {
    documentId: doc._id,
    version: doc.__v,
    action,
    userId,
    timestamp: new Date(),
    data: JSON.parse(JSON.stringify(doc.toObject()))
  };
}

/**
 * Detect schedule conflicts
 * @param {String} room - Room name
 * @param {String} day - Day of week
 * @param {String} time - Time slot
 * @param {String} excludeId - Schedule ID to exclude (for updates)
 * @param {Object} model - Schedule model
 */
export async function detectScheduleConflict(room, day, time, excludeId, model) {
  const query = {
    room,
    day,
    time,
    archived: false
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const conflict = await model.findOne(query);
  
  if (conflict) {
    throw new Error(
      `Schedule conflict: Room ${room} is already booked on ${day} at ${time}`
    );
  }
  
  return false;
}

/**
 * Detect room double-booking
 * @param {String} roomId - Room ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @param {String} excludeId - Schedule ID to exclude
 * @param {Object} model - Schedule model
 */
export async function detectDoubleBooking(roomId, startTime, endTime, excludeId, model) {
  const query = {
    room: roomId,
    archived: false,
    $or: [
      // Check if new schedule overlaps with existing
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const conflict = await model.findOne(query);
  
  if (conflict) {
    throw new Error(
      `Double-booking detected: Room is already scheduled for overlapping time period`
    );
  }
  
  return false;
}

/**
 * Handle concurrent section updates with conflict resolution
 * @param {Object} sectionModel - Section model
 * @param {String} sectionId - Section ID
 * @param {Number} clientVersion - Client version
 * @param {Object} updateData - New data
 * @param {String} userId - User performing update
 */
export async function updateSectionWithConflictResolution(
  sectionModel,
  sectionId,
  clientVersion,
  updateData,
  userId
) {
  const existingSection = await sectionModel.findById(sectionId);
  
  if (!existingSection) {
    throw new Error('Section not found');
  }
  
  // Check for name conflicts with other sections in same course/year
  if (updateData.name && updateData.name !== existingSection.name) {
    const duplicate = await sectionModel.findOne({
      course: updateData.course || existingSection.course,
      year: updateData.year || existingSection.year,
      name: updateData.name,
      _id: { $ne: sectionId }
    });
    
    if (duplicate) {
      throw new Error(
        `Section name conflict: A section with name "${updateData.name}" already exists in this course/year`
      );
    }
  }
  
  // Update with version control
  return updateWithVersionControl(sectionModel, sectionId, clientVersion, updateData);
}

/**
 * Handle concurrent instructor updates
 * @param {Object} instructorModel - Instructor model
 * @param {String} instructorId - Instructor ID
 * @param {Number} clientVersion - Client version
 * @param {Object} updateData - New data
 */
export async function updateInstructorWithConflictResolution(
  instructorModel,
  instructorId,
  clientVersion,
  updateData
) {
  const existingInstructor = await instructorModel.findById(instructorId);
  
  if (!existingInstructor) {
    throw new Error('Instructor not found');
  }
  
  // Check for email uniqueness if email is being updated
  if (updateData.email && updateData.email !== existingInstructor.email) {
    const emailExists = await instructorModel.findOne({
      email: updateData.email,
      _id: { $ne: instructorId }
    });
    
    if (emailExists) {
      throw new Error(`Email ${updateData.email} is already in use`);
    }
  }
  
  // Update with version control
  return updateWithVersionControl(instructorModel, instructorId, clientVersion, updateData);
}

/**
 * Batch update with conflict detection
 * Useful for bulk operations like importing schedules
 * @param {Object} model - Mongoose model
 * @param {Array} updates - Array of { id, version, data }
 */
export async function batchUpdateWithVersionControl(model, updates) {
  const results = [];
  const errors = [];
  
  for (const update of updates) {
    try {
      const result = await updateWithVersionControl(
        model,
        update.id,
        update.version,
        update.data
      );
      results.push(result);
    } catch (error) {
      errors.push({
        id: update.id,
        error: error.message
      });
    }
  }
  
  return { results, errors };
}

/**
 * Transaction-like operation for schedule creation with multi-document validation
 * @param {Object} scheduleModel - Schedule model
 * @param {Object} roomModel - Room model
 * @param {Object} sectionModel - Section model
 * @param {Object} scheduleData - Schedule data to create
 */
export async function createScheduleWithValidation(
  scheduleModel,
  roomModel,
  sectionModel,
  scheduleData
) {
  // Validate room exists and is available
  const room = await roomModel.findOne({ room: scheduleData.room, archived: false });
  if (!room) {
    throw new Error(`Room ${scheduleData.room} not found or is archived`);
  }
  
  // Validate section exists
  const section = await sectionModel.findOne({
    course: scheduleData.course,
    year: scheduleData.year,
    name: scheduleData.section,
    archived: false
  });
  if (!section) {
    throw new Error(`Section ${scheduleData.section} not found or is archived`);
  }
  
  // Check for conflicts
  await detectScheduleConflict(
    scheduleData.room,
    scheduleData.day,
    scheduleData.time,
    null,
    scheduleModel
  );
  
  // Create schedule
  const newSchedule = new scheduleModel(scheduleData);
  await newSchedule.save();
  
  return newSchedule;
}

/**
 * Fetch a single document under MVCC snapshot isolation when supported.
 * Attempts to start a session + transaction with readConcern: 'snapshot'
 * and reads the document inside the transaction so the read sees a
 * single, consistent committed version. If the server does not support
 * snapshot reads or the transaction fails, falls back to a majority read.
 *
 * @param {Object} model - Mongoose model
 * @param {String} id - Document id to fetch
 * @returns {Object|null} - The document (lean) or null if not found
 */
export async function fetchSnapshotDocument(model, id) {
  // Lazy require mongoose to avoid circular imports
  let mongoose;
  try {
    mongoose = await import('mongoose');
  } catch (err) {
    mongoose = require('mongoose');
  }

  const session = await mongoose.startSession();
  try {
    // Try to start a transaction with snapshot readConcern (Atlas / replica sets)
    await session.startTransaction({ readConcern: { level: 'snapshot' } });

    const doc = await model.findById(id).session(session).lean();

    // Commit transaction (no writes, but commits the read snapshot)
    await session.commitTransaction();
    return doc;
  } catch (err) {
    // If snapshot transactions not supported or any error occurs,
    // abort and fall back to a majority read to get a stable committed version.
    try {
      await session.abortTransaction();
    } catch (e) {
      // ignore
    }

    try {
      // Use collection-level read with majority readConcern if possible
      // Mongoose Query API supports setOptions for readConcern on the driver
      const query = model.findById(id).lean();
      if (typeof query.setOptions === 'function') {
        query.setOptions({ readConcern: { level: 'majority' } });
      }
      const doc = await query.exec();
      return doc;
    } catch (fallbackErr) {
      // Last resort: simple findById
      return await model.findById(id).lean();
    }
  } finally {
    session.endSession();
  }
}

export default {
  checkVersionConflict,
  updateWithVersionControl,
  createVersionSnapshot,
  detectScheduleConflict,
  detectDoubleBooking,
  updateSectionWithConflictResolution,
  updateInstructorWithConflictResolution,
  batchUpdateWithVersionControl,
  createScheduleWithValidation
  ,fetchSnapshotDocument
};
