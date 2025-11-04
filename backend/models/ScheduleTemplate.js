import mongoose from "mongoose";

const scheduleTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  course: { type: String, required: true },
  year: { type: String, required: true },
  schedules: [{
    subject: { type: String, required: true },
    instructor: { type: String, required: true },
    instructorEmail: { type: String, required: false },
    day: { type: String, required: true },
    time: { type: String, required: true },
    room: { type: String, required: true },
  }],
  createdBy: { type: String, default: "admin" },
}, { timestamps: true });

export default mongoose.model("ScheduleTemplate", scheduleTemplateSchema);
