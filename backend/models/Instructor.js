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
  timestamps: true 
});

// Use correct schema variable name here
instructorSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('Instructor', instructorSchema);
