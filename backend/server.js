import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import adminRoutes from "./routes/adminRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import roomRoutes from './routes/roomRoutes.js';
import yearLevelRoutes from "./routes/yearLevelRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/class_scheduling", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/instructors", instructorRoutes);
app.use('/api', roomRoutes);
app.use("/api/year-levels", yearLevelRoutes);


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
