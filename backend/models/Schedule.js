import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  course: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  instructor: { type: String, required: true }, // Keep for backward compatibility
  instructorEmail: { type: String, required: false }, // Optional for backward compatibility
  day: { type: String, required: true },
  time: { type: String, required: true },
  room: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Schedule", scheduleSchema);
