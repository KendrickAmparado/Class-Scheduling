import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema({
  instructorId: Number,
  name: String,
  email: String,
  contact: String,
  department: String,
  status: {
    type: String,
    enum: ["active", "archived", "deleted", "invited"],
    default: "active",
  },
  
  archivedDate: { type: Date, default: null },
  deletedDate: { type: Date, default: null },
});

const Instructor = mongoose.model("Instructor", instructorSchema);
export default Instructor;
