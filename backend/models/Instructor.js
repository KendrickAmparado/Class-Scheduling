// models/Instructor.js
import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String },          // Added contact field
  department: { type: String },       // Added department field
  status: { type: String, default: 'pending' },
  registrationDate: { type: Date, default: Date.now }
});

const Instructor = mongoose.model('Instructor', instructorSchema);
export default Instructor;
