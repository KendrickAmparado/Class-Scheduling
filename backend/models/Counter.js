// models/Counter.js
import mongoose from "mongoose";

/**
 * Counter schema is intentionally using _id as the counter name
 * so findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true })
 * will work as used in your routes.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'instructorId'
  seq: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Counter", counterSchema);
