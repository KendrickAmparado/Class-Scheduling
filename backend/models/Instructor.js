import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
  instructorId: { 
    type: String,
    unique: true,
    sparse: true
  },
  firstname: { type: String },
  lastname: { type: String },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true
  },
  password: { type: String },
  contact: { type: String },
  department: { type: String },
  image: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'archived'], 
    default: 'pending' 
  }
}, { 
  timestamps: true,
  versionKey: '__v',
  optimisticConcurrency: true
});

// Index for email lookups
instructorSchema.index({ email: 1 }, { unique: true });
instructorSchema.index({ status: 1 });
// Note: instructorId index is auto-created by unique: true in schema definition above

export default mongoose.model('Instructor', instructorSchema);
