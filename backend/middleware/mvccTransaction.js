/**
 * MVCC Transaction Middleware
 * Handles transactional operations, version conflicts, and optimistic locking recovery
 */

/**
 * Middleware to catch and handle version conflicts
 * Provides structured error response for concurrent update attempts
 */
export function versionConflictHandler(err, req, res, next) {
  if (err.message && err.message.includes('Version conflict')) {
    return res.status(409).json({
      error: 'CONFLICT',
      message: 'Document has been modified by another user. Please refresh and try again.',
      code: 'VERSION_CONFLICT',
      details: err.message
    });
  }
  
  if (err.message && err.message.includes('conflict')) {
    return res.status(409).json({
      error: 'CONFLICT',
      message: err.message,
      code: 'CONFLICT_DETECTED'
    });
  }
  
  next(err);
}

/**
 * Retry logic for transient conflicts
 * @param {Function} operation - Async operation to retry
 * @param {Number} maxRetries - Maximum retry attempts (default: 3)
 * @param {Number} delayMs - Delay between retries in milliseconds (default: 100)
 */
export async function withRetry(operation, maxRetries = 3, delayMs = 100) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on version conflicts
      if (!error.message || !error.message.includes('Version conflict')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  
  throw lastError;
}

/**
 * Session-based transaction tracking for audit trail
 */
export class MVCCTransaction {
  constructor(userId, operation) {
    this.transactionId = generateTransactionId();
    this.userId = userId;
    this.operation = operation;
    this.startTime = new Date();
    this.operations = [];
    this.status = 'active';
  }
  
  addOperation(documentId, action, version, result) {
    this.operations.push({
      documentId,
      action,
      version,
      timestamp: new Date(),
      result
    });
  }
  
  commit() {
    this.status = 'committed';
    this.endTime = new Date();
    return {
      transactionId: this.transactionId,
      userId: this.userId,
      operation: this.operation,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime - this.startTime,
      operationCount: this.operations.length,
      operations: this.operations
    };
  }
  
  rollback() {
    this.status = 'rolled_back';
    this.endTime = new Date();
  }
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Atomic bulk operation with rollback capability
 * @param {Array} operations - Array of { model, docId, version, data }
 * @param {String} userId - User performing operations
 */
export async function atomicBulkOperation(operations, userId) {
  const transaction = new MVCCTransaction(userId, 'bulk_update');
  const results = [];
  const failed = [];
  
  try {
    for (const op of operations) {
      try {
        // Attempt update with version control
        const result = await op.model.findByIdAndUpdate(
          op.docId,
          { ...op.data, $inc: { __v: 1 } },
          { new: true, runValidators: true }
        );
        
        if (result.__v - 1 !== op.version) {
          throw new Error(`Version conflict on document ${op.docId}`);
        }
        
        transaction.addOperation(op.docId, 'update', result.__v, result);
        results.push(result);
      } catch (error) {
        failed.push({
          docId: op.docId,
          error: error.message
        });
      }
    }
    
    if (failed.length > 0) {
      transaction.status = 'partial_success';
    } else {
      transaction.status = 'success';
    }
    
    const txnRecord = transaction.commit();
    
    return {
      transaction: txnRecord,
      successful: results.length,
      failed: failed.length,
      results,
      failures: failed
    };
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

/**
 * Compare document versions and detect what changed
 * @param {Object} oldVersion - Previous version
 * @param {Object} newVersion - New version
 */
export function detectChanges(oldVersion, newVersion) {
  const changes = [];
  
  // Get all keys from both versions
  const allKeys = new Set([
    ...Object.keys(oldVersion || {}),
    ...Object.keys(newVersion || {})
  ]);
  
  for (const key of allKeys) {
    const oldValue = oldVersion?.[key];
    const newValue = newVersion?.[key];
    
    // Skip internal fields and timestamps
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) {
      continue;
    }
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
        timestamp: new Date()
      });
    }
  }
  
  return changes;
}

/**
 * Create audit log entry for version change
 */
export function createAuditLog(transaction, documentId, changes) {
  return {
    transactionId: transaction.transactionId,
    documentId,
    userId: transaction.userId,
    timestamp: new Date(),
    action: transaction.operation,
    changes,
    status: transaction.status
  };
}

export default {
  versionConflictHandler,
  withRetry,
  MVCCTransaction,
  atomicBulkOperation,
  detectChanges,
  createAuditLog
};
