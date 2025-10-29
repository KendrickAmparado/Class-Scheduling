// models/Alert.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  type: { type: String }, // e.g. 'availability-update'
  message: { type: String, required: true },
  link: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed }, // optional extra info
}, { timestamps: true });

export default mongoose.model("Alert", alertSchema);
